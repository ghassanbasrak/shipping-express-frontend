// Requires Node.js 22+ and Microsoft Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/auth-browser");
fs.mkdirSync(output, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let edge, server, ws;
const pending = new Map();
let seq = 0;
const exceptions = [];
const calls = [];
let account;
const normal = {
  id: "merchant-1",
  role: "user",
  firstName: "Ashamco",
  lastName: "Merchant",
  email: "merchant@example.test",
  phone: "+966-555123456",
  isRegistered: true,
  isBlocked: false,
  verificationStatus: "approved",
  emailVerified: true,
  phoneVerified: true,
};
function send(method, params = {}) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("CDP timeout: " + method));
    }, 15000);
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails)
    throw new Error(
      result.exceptionDetails.text +
        " " +
        result.exceptionDetails.exception?.description,
    );
  return result.result.value;
}
async function until(expression, label) {
  for (let i = 0; i < 150; i++) {
    if (await evaluate(expression)) return;
    await sleep(100);
  }
  throw new Error(
    "Timed out: " + label + "\n" + (await evaluate("document.body.innerText")),
  );
}
async function navigate(route) {
  await send("Page.navigate", { url: "http://127.0.0.1:3138" + route });
}
async function fill(name, value) {
  await evaluate(
    `(()=>{const input=document.querySelector('input[name=${JSON.stringify(name)}]');if(!input)throw new Error('Missing input ${name}');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
}
async function submit() {
  await evaluate("document.querySelector('button[type=submit]').click()");
}
async function choosePlace(name, value) {
  await fill(name, value);
  await until(
    "Boolean(document.querySelector('[role=option]'))",
    "place options",
  );
  await evaluate("document.querySelector('[role=option]').click()");
}
async function reset(route = "/sign-in") {
  await evaluate(
    "localStorage.clear();sessionStorage.clear();localStorage.setItem('my-language','en')",
  );
  await navigate(route);
  await until(
    "Boolean(document.querySelector('form')) || (location.pathname.includes('delete') && document.body.innerText.includes('info@ashamcoex.com'))",
    route,
  );
}
async function login(email) {
  await reset();
  await fill("email", email);
  await fill("password", "password123");
  await submit();
}
async function intercept(event) {
  const request = event.request;
  const url = new URL(request.url);
  if (url.hostname === "uploads.example.test") {
    assert.equal(request.headers.Authorization, undefined);
    calls.push({ url: url.pathname, method: request.method, upload: true });
    return send("Fetch.fulfillRequest", {
      requestId: event.requestId,
      responseCode: 204,
      responseHeaders: [
        { name: "Access-Control-Allow-Origin", value: "*" },
        { name: "Access-Control-Allow-Methods", value: "POST,OPTIONS" },
        { name: "Access-Control-Allow-Headers", value: "*" },
      ],
    });
  }
  if (!url.pathname.includes("/v1/"))
    return send("Fetch.continueRequest", { requestId: event.requestId });
  if (request.method === "OPTIONS")
    return send("Fetch.fulfillRequest", {
      requestId: event.requestId,
      responseCode: 204,
      responseHeaders: [
        { name: "Access-Control-Allow-Origin", value: "*" },
        {
          name: "Access-Control-Allow-Methods",
          value: "GET,POST,PATCH,DELETE,OPTIONS",
        },
        { name: "Access-Control-Allow-Headers", value: "*" },
      ],
    });
  const body = JSON.parse(request.postData || "{}");
  calls.push({ url: url.pathname, method: request.method, body });
  let result = {},
    status = 200;
  if (url.pathname.endsWith("/auth-sessions/login")) {
    account = { ...normal };
    if (body.email.startsWith("employee"))
      account = { ...normal, id: "employee-1", role: "employee" };
    if (body.email.startsWith("blocked")) account.isBlocked = true;
    if (body.email.startsWith("register"))
      account = {
        ...normal,
        isRegistered: false,
        emailVerified: true,
        phoneVerified: false,
      };
    if (body.email.startsWith("verify"))
      account.verificationStatus = "notSubmitted";
    if (body.email.startsWith("link")) account.emailVerified = false;
    result = {
      user: account,
      accessToken: "test-access",
      refreshToken: "test-refresh",
    };
  } else if (url.pathname.endsWith("/users/me")) {
    if (request.method === "PATCH")
      account = { ...account, ...body, isRegistered: true };
    result = account || normal;
  } else if (
    url.pathname.endsWith("/users/send-codes") ||
    url.pathname.endsWith("/users/send-phone-code")
  )
    result = { msegatId: 12345 };
  else if (url.pathname.endsWith("/users/verify-codes")) {
    account = { ...normal };
    result = {
      isVerified: true,
      user: account,
      accessToken: { token: "phone-access" },
      refreshToken: { token: "phone-refresh" },
    };
  } else if (url.pathname.endsWith("/countries"))
    result = {
      results: [
        { id: "country-1", name: { en: "Saudi Arabia", ar: "السعودية" } },
      ],
      total: 1,
    };
  else if (url.pathname.endsWith("/states"))
    result = {
      results: [{ id: "state-1", name: { en: "Riyadh", ar: "الرياض" } }],
      total: 1,
    };
  else if (url.pathname.endsWith("/cities"))
    result = {
      results: [
        { id: "city-1", name: { en: "Riyadh city", ar: "مدينة الرياض" } },
      ],
      total: 1,
    };
  else if (url.pathname.endsWith("/users/verify-email-otp"))
    result = { isVerified: true, user: account };
  else if (url.pathname.endsWith("/media/create"))
    result = {
      url: "https://uploads.example.test/",
      fields: { key: "verification.pdf" },
    };
  else if (url.pathname.endsWith("/requests")) {
    account.verificationStatus = "pending";
    result = { id: "request-1" };
  }
  await send("Fetch.fulfillRequest", {
    requestId: event.requestId,
    responseCode: status,
    responseHeaders: [
      { name: "Content-Type", value: "application/json" },
      { name: "Access-Control-Allow-Origin", value: "*" },
    ],
    body: Buffer.from(JSON.stringify(result)).toString("base64"),
  });
}
async function main() {
  server = http.createServer((req, res) => {
    let file = path.join(
      build,
      decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (!file.startsWith(build)) {
      res.writeHead(403);
      return res.end();
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
      file = path.join(build, "index.html");
    const mime = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".woff2": "font/woff2",
    };
    res.setHeader(
      "Content-Type",
      mime[path.extname(file)] || "application/octet-stream",
    );
    res.end(fs.readFileSync(file));
  });
  await new Promise((resolve) => server.listen(3138, "127.0.0.1", resolve));
  edge = spawn(
    process.env.BROWSER_PATH ||
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    [
      "--headless=new",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-component-extensions-with-background-pages",
      "--disable-features=msEdgeSidebarV2",
      "--no-first-run",
      "--no-default-browser-check",
      "--remote-debugging-port=9338",
      "--user-data-dir=" + path.join(output, "edge-profile"),
      "about:blank",
    ],
    { windowsHide: true, stdio: "ignore" },
  );
  fs.writeFileSync(path.join(output, "edge.pid"), String(edge.pid));
  edge.on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
  });
  let pages;
  for (let i = 0; i < 60; i++) {
    try {
      pages = await (
        await fetch("http://127.0.0.1:9338/json", {
          signal: AbortSignal.timeout(500),
        })
      ).json();
      break;
    } catch {
      if (edge.exitCode !== null)
        throw new Error("Browser exited with code " + edge.exitCode);
      await sleep(150);
    }
  }
  if (!pages) throw new Error("Browser did not start");
  const page = pages.find((p) => p.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  ws.onmessage = (message) => {
    const event = JSON.parse(message.data);
    if (event.id) {
      const p = pending.get(event.id);
      if (p) {
        pending.delete(event.id);
        event.error
          ? p.reject(new Error(event.error.message))
          : p.resolve(event.result);
      }
    } else if (event.method === "Fetch.requestPaused")
      intercept(event.params).catch((error) => console.error(error));
    else if (event.method === "Runtime.exceptionThrown")
      exceptions.push({
        description:
          event.params.exceptionDetails.exception?.description ||
          event.params.exceptionDetails.text,
        url: event.params.exceptionDetails.url,
        stack: event.params.exceptionDetails.stackTrace,
      });
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Fetch.enable", {
    patterns: [
      { urlPattern: "*/v1/*" },
      { urlPattern: "https://uploads.example.test/*" },
    ],
  });
  await send("Browser.setPermission", {
    permission: { name: "notifications" },
    setting: "denied",
    origin: "http://127.0.0.1:3138",
  });
  const languageScript = await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "localStorage.setItem('my-language','en')",
  });
  await navigate("/sign-in");
  await until(
    "Boolean(document.querySelector('input[name=email]')) || location.pathname==='/home'",
    "initial browser load",
  );
  await reset("/home");
  await until(
    "location.pathname==='/sign-in' && Boolean(document.querySelector('input[name=email]'))",
    "protected-route redirect",
  );
  console.log("PASS Guest protected-route redirect");
  const screenshot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(output, "sign-in.png"),
    Buffer.from(screenshot.data, "base64"),
  );
  await login("employee@example.test");
  await until(
    "location.pathname==='/home' && document.body.innerText.includes('Merchant')",
    "employee sign-in",
  );
  console.log("PASS Employee password sign-in");
  await send("Page.reload");
  await until(
    "location.pathname==='/home' && document.body.innerText.includes('Merchant')",
    "session restoration",
  );
  console.log("PASS Session restoration");
  await navigate("/sign-out");
  await until(
    "location.pathname==='/sign-in' && !localStorage.getItem('jwt_access_token')",
    "sign-out",
  );
  console.log("PASS Sign-out clears credentials");
  await login("blocked@example.test");
  await until(
    "location.pathname==='/blocked' && document.body.innerText.includes('blocked')",
    "blocked gate",
  );
  console.log("PASS Blocked-account gate");
  await login("register@example.test");
  await until(
    "location.pathname==='/register' && Boolean(document.querySelector('input[name=firstName]'))",
    "registration gate",
  );
  console.log("PASS Incomplete-registration gate");
  await login("verify@example.test");
  await until(
    "location.pathname==='/verify-account' && document.body.innerText.includes('Account verification')",
    "verification gate",
  );
  console.log("PASS Merchant-verification gate");
  await login("link@example.test");
  await until(
    "Boolean(document.querySelector('[role=dialog]')) && document.body.innerText.includes('Verify your email')",
    "mandatory linking",
  );
  console.log("PASS Mandatory email-linking dialog");
  await evaluate(
    "document.querySelector('[role=dialog] button[type=submit]').click()",
  );
  await until(
    "Boolean(document.querySelector('input[name=code]'))",
    "email code",
  );
  await fill("code", "123456");
  await evaluate(
    "document.querySelector('[role=dialog] button[type=submit]').click()",
  );
  await until("!document.querySelector('[role=dialog]')", "email linked");
  assert.equal(account.emailVerified, true);
  console.log("PASS Email OTP linking completes and updates the account");
  await reset("/sign-in-phone");
  await fill("phone", "555123456");
  await submit();
  await until(
    "location.pathname.includes('/otp-code-sent/') && Boolean(document.querySelector('input[name=code]'))",
    "phone OTP challenge",
  );
  await fill("code", "1234");
  await submit();
  await until("location.pathname==='/home'", "phone sign-in");
  console.log("PASS Phone OTP sign-in with nested tokens");
  await reset(
    "/reset-password?email=merchant%40example.test&resetCode=reset-test",
  );
  await fill("password", "newpassword123");
  await fill("passwordConfirmation", "newpassword123");
  await submit();
  await until("location.pathname==='/home'", "password reset");
  const resetCall = calls.find((call) =>
    call.url.endsWith("/users/reset-password"),
  );
  assert.equal(resetCall.body.token, "reset-test");
  assert.equal(resetCall.body.confirmPassword, "newpassword123");
  console.log("PASS Password-reset link and backend payload");
  await reset("/sign-up");
  await until(
    "Boolean(document.querySelector('input[name=firstName]'))",
    "sign-up",
  );
  await fill("firstName", "New");
  await fill("lastName", "Merchant");
  await fill("email", "new@example.test");
  await fill("phone", "555123456");
  await fill("taxNumber", "١٢٣٤٥٦٧٨٩٠١٢٣٤٥");
  await choosePlace("address.countryId", "Saudi");
  await choosePlace("address.stateId", "Riyadh");
  await choosePlace("address.cityId", "Riyadh");
  await fill("address.street", "Street 1");
  await fill("password", "password123");
  await fill("passwordConfirmation", "password123");
  await evaluate("document.querySelector('input[type=checkbox]').click()");
  await submit();
  await until(
    "Boolean(document.querySelector('input[name=code]'))",
    "sign-up OTP",
  );
  await fill("code", "1234");
  await submit();
  await until("location.pathname==='/home'", "sign-up completion");
  const profileCall = calls
    .filter((call) => call.url.endsWith("/users/me") && call.method === "PATCH")
    .at(-1);
  assert.equal(profileCall.body.phone, "+966-555123456");
  assert.equal(profileCall.body.taxNumber, "123456789012345");
  assert.equal(profileCall.body.address.stateId, "state-1");
  assert.equal(profileCall.body.address.cityId, "city-1");
  assert.equal(profileCall.body.passwordConfirmation, undefined);
  assert.equal(profileCall.body.acceptTermsConditions, undefined);
  console.log(
    "PASS Merchant sign-up completes with address, OTP and normalized API payload",
  );
  await reset("/delete-my-account");
  await until(
    "document.body.innerText.includes('info@ashamcoex.com')",
    "account deletion compatibility",
  );
  console.log("PASS Account deletion support page");
  await login("verify@example.test");
  await until(
    "location.pathname==='/verify-account' && Boolean(document.querySelector('input[type=file]'))",
    "verification upload",
  );
  const pdf = path.join(output, "verification.pdf");
  fs.writeFileSync(pdf, "%PDF-1.4\nmock verification document\n%%EOF");
  const dom = await send("DOM.getDocument");
  const files = await send("DOM.querySelectorAll", {
    nodeId: dom.root.nodeId,
    selector: "input[type=file]",
  });
  await send("DOM.setFileInputFiles", {
    nodeId: files.nodeIds.at(-1),
    files: [pdf],
  });
  await until(
    "Boolean(document.querySelector('a[href=\"https://uploads.example.test/verification.pdf\"]'))",
    "document uploaded",
  );
  await submit();
  await until(
    "document.body.innerText.includes('under review')",
    "verification submitted",
  );
  const verification = calls
    .filter((call) => call.url.endsWith("/requests"))
    .at(-1);
  assert.equal(
    verification.body.crUrl,
    "https://uploads.example.test/verification.pdf",
  );
  assert.equal(verification.body.type, "verification");
  console.log("PASS Verification document upload and pending-review workflow");
  await send("Page.removeScriptToEvaluateOnNewDocument", {
    identifier: languageScript.identifier,
  });
  await evaluate(
    "localStorage.clear();sessionStorage.clear();localStorage.setItem('my-language','ar')",
  );
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await navigate("/sign-in");
  await until(
    "document.body.innerText.includes('تسجيل الدخول') && Boolean(document.querySelector('input[name=email]'))",
    "Arabic mobile sign-in",
  );
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  const mobile = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(output, "sign-in-ar-mobile.png"),
    Buffer.from(mobile.data, "base64"),
  );
  console.log("PASS Arabic RTL and mobile sign-in");
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks: 15, exceptions, calls }, null, 2),
  );
  console.log(
    "15/15 browser checks passed; no uncaught JavaScript exceptions.",
  );
}
main()
  .catch((error) => {
    console.error(error.stack);
    console.error("Uncaught browser exceptions:", exceptions);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      if (ws?.readyState === 1) await send("Browser.close");
    } catch {}
    ws?.close();
    edge?.kill();
    server?.close();
  });
