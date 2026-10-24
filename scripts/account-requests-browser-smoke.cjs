// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/account-requests-browser");
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

async function fillSelector(selector, value) {
  await evaluate(
    `(()=>{const input=document.querySelector(${JSON.stringify(selector)});if(!input)throw new Error('Missing input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  );
}
async function clickText(text, selector = "button") {
  await evaluate(
    `(()=>{const element=[...document.querySelectorAll(${JSON.stringify(selector)})].find(element=>element.textContent.trim()===${JSON.stringify(text)});if(!element)throw new Error('Missing action '+${JSON.stringify(text)});element.click();})()`,
  );
}

let failList = false,
  failWrite = false,
  failUpload = false,
  slowUpload = false,
  failRefresh = false,
  sequence = 40;
const merchant = {
    ...normal,
    id: "merchant-1",
    firstName: "Account",
    lastName: "One",
    isAuthorized: false,
  },
  other = {
    ...normal,
    id: "merchant-2",
    firstName: "Account",
    lastName: "Two",
    isAuthorized: true,
  };
const reviewer = {
  id: "staff-1",
  role: "admin",
  firstName: "Reviewer",
  lastName: "One",
};
const records = ["authorization", "verification"].flatMap((kind) =>
  Array.from({ length: 15 }, (_, i) => ({
    id: (kind === "authorization" ? "auth-" : "verify-") + (i + 1),
    type: kind,
    status: i === 1 ? "approved" : i === 2 ? "rejected" : "pending",
    userId: i % 2 ? "merchant-2" : "merchant-1",
    user: i % 2 ? other : merchant,
    updatedById: "staff-1",
    updatedBy: reviewer,
    userType: i % 2 ? "smallStore" : "company",
    name: "Business " + (i + 1),
    description: "Account request " + (i + 1),
    fileUrl: "https://uploads.example.test/document.pdf",
    freelanceDocumentUrl:
      i % 2 ? "https://uploads.example.test/freelance.pdf" : "",
    taxCertificateUrl: "https://uploads.example.test/tax.pdf",
    crUrl: "https://uploads.example.test/registration.pdf",
    taxNumber: "123456789012345",
    crNumber: "12345",
    createdAt: "2026-10-10T10:00:00Z",
    updatedAt: "2026-10-12T10:00:00Z",
  })),
);
let passed = 0;
function pass(name) {
  passed++;
  console.log("PASS " + name);
}
async function fulfill(
  event,
  status,
  result,
  contentType = "application/json",
) {
  await send("Fetch.fulfillRequest", {
    requestId: event.requestId,
    responseCode: status,
    responseHeaders: [
      { name: "Content-Type", value: contentType },
      { name: "Access-Control-Allow-Origin", value: "*" },
      { name: "Access-Control-Allow-Headers", value: "*" },
      {
        name: "Access-Control-Allow-Methods",
        value: "GET,POST,PATCH,DELETE,OPTIONS",
      },
    ],
    body:
      status === 204
        ? ""
        : Buffer.from(
            typeof result === "string" ? result : JSON.stringify(result),
          ).toString("base64"),
  });
}

async function intercept(event) {
  const req = event.request,
    url = new URL(req.url),
    method = req.method;
  if (method === "OPTIONS") return fulfill(event, 204, "");
  if (url.hostname === "uploads.example.test") {
    assert.equal(req.headers.Authorization, undefined);
    assert.equal(req.headers["X-Api-Key"], undefined);
    calls.push({ url: url.pathname, method, upload: true });
    if (slowUpload) await sleep(700);
    return fulfill(
      event,
      failUpload ? 500 : method === "POST" ? 204 : 200,
      method === "GET" ? "%PDF-1.4 mock document" : "",
    );
  }
  if (!url.pathname.includes("/v1/"))
    return send("Fetch.continueRequest", { requestId: event.requestId });
  const body = JSON.parse(req.postData || "{}"),
    query = Object.fromEntries(url.searchParams);
  calls.push({ url: url.pathname, method, body, query });
  let status = 200,
    result = {};
  if (url.pathname.endsWith("/auth-sessions/login")) {
    const viewer = body.email.startsWith("viewer"),
      denied = body.email.startsWith("denied"),
      employee = body.email.startsWith("employee"),
      isMerchant =
        body.email.startsWith("merchant") ||
        body.email.startsWith("authorized");
    account = isMerchant
      ? { ...merchant, isAuthorized: body.email.startsWith("authorized") }
      : {
          ...normal,
          id: "staff-1",
          role: viewer || denied || employee ? "employee" : "admin",
        };
    if (viewer || employee)
      account.features = ["auth-requests", "verification-requests"].map(
        (feature) => ({
          feature,
          accessView: true,
          accessUpdate: employee,
          accessCreate: false,
          accessDelete: false,
        }),
      );
    if (denied) account.features = [{ feature: "merchants", accessView: true }];
    result = {
      user: account,
      accessToken: "requests-access",
      refreshToken: "requests-refresh",
    };
  } else if (url.pathname.endsWith("/users/me")) {
    if (failRefresh) {
      status = 500;
      result = { message: "Account refresh failed" };
    } else result = account || normal;
  } else if (url.pathname === "/v1/media/create")
    result = {
      url: "https://uploads.example.test/",
      fields: { key: body.fileName || "document.pdf" },
    };
  else if (url.pathname.startsWith("/v1/users/")) {
    const id = url.pathname.split("/").at(-1);
    if (id === "missing") {
      status = 404;
      result = { message: "Missing account" };
    } else
      result =
        id === "merchant-2"
          ? other
          : id === "staff-1"
            ? reviewer
            : { ...merchant, id };
  } else if (url.pathname === "/v1/users") {
    const list = query.type === "user" ? [merchant, other] : [reviewer];
    result = {
      results: query.search
        ? list.filter((x) =>
            JSON.stringify(x)
              .toLowerCase()
              .includes(query.search.toLowerCase()),
          )
        : list,
      total: list.length,
    };
  } else if (url.pathname === "/v1/requests") {
    if (method === "POST") {
      if (failWrite) {
        status = 500;
        result = { message: "Save failed" };
      } else {
        result = {
          ...body,
          id: "auth-" + ++sequence,
          user: account,
          createdAt: "2026-10-22T10:00:00Z",
          updatedAt: "2026-10-22T10:00:00Z",
        };
        records.unshift(result);
      }
    } else if (failList) {
      status = 500;
      result = { message: "List failed" };
    } else {
      const list = records.filter(
        (x) =>
          x.type === query.type &&
          (!query.status || x.status === query.status) &&
          (!query.userId || x.userId === query.userId) &&
          (!query.updatedById || x.updatedById === query.updatedById) &&
          (!query.search ||
            JSON.stringify(x)
              .toLowerCase()
              .includes(query.search.toLowerCase())) &&
          (account?.role !== "user" || x.userId === account.id),
      );
      result = {
        results: list.slice(
          Number(query.page) * Number(query.pageSize),
          (Number(query.page) + 1) * Number(query.pageSize),
        ),
        total: list.length,
      };
    }
  } else if (url.pathname.startsWith("/v1/requests/")) {
    const id = url.pathname.split("/").at(-1),
      item = records.find((x) => x.id === id);
    if (!item) {
      status = 404;
      result = { message: "Missing request" };
    } else if (method === "PATCH") {
      if (failWrite) {
        status = 500;
        result = { message: "Decision failed" };
      } else {
        Object.assign(item, body);
        result = item;
      }
    } else result = item;
  } else {
    status = 404;
    result = { message: "Unexpected mock URL " + url.pathname };
  }
  return fulfill(event, status, result);
}
const exists = (selector) =>
  `Boolean(document.querySelector(${JSON.stringify(selector)}))`;
async function click(selector) {
  await until(
    `Boolean([...document.querySelectorAll(${JSON.stringify(selector)})].find(x=>x.getClientRects().length))`,
    "visible action " + selector,
  );
  await evaluate(
    `(()=>{const node=[...document.querySelectorAll(${JSON.stringify(selector)})].find(x=>x.getClientRects().length);if(!node)throw Error('Missing visible '+${JSON.stringify(selector)});node.click()})()`,
  );
}
async function fillField(name, value) {
  await evaluate(
    `(()=>{const input=document.querySelector('input[name=${JSON.stringify(name)}],textarea[name=${JSON.stringify(name)}]');if(!input)throw Error('Missing '+${JSON.stringify(name)});Object.getOwnPropertyDescriptor(input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
}
async function screenshot(name) {
  await sleep(500);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(output, name + ".png"),
    Buffer.from(shot.data, "base64"),
  );
}
async function rowAction(id, title) {
  await clickText(title, `[role=row][data-id=${id}] button`);
  await until(exists("[role=dialog]"), "review confirmation");
}
async function confirm() {
  await clickText("Yes", "[role=dialog] button");
  await until("!document.querySelector('[role=dialog]')", "dialog closed");
  await sleep(150);
}
async function setStatusFilter(folder, value) {
  await click(`[data-testid=${folder}-filters]`);
  await until(exists("[role=menu] [role=combobox]"), "filter dropdown");
  await evaluate(
    "document.querySelector('[role=menu] div[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))",
  );
  await until(exists(`[role=option][data-value=${value}]`), "status options");
  await click(`[role=option][data-value=${value}]`);
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
  });
  await sleep(100);
}
async function upload(name = "authorization.pdf") {
  const file = path.join(output, name);
  fs.writeFileSync(file, "%PDF-1.4\nMock account document\n%%EOF");
  const dom = await send("DOM.getDocument"),
    inputs = await send("DOM.querySelectorAll", {
      nodeId: dom.root.nodeId,
      selector: "input[type=file]",
    });
  assert.equal(inputs.nodeIds.length, 1);
  await send("DOM.setFileInputFiles", {
    nodeId: inputs.nodeIds[0],
    files: [file],
  });
}
async function exportAll(kind, scope) {
  const started = Date.now();
  const before = calls.filter(
    (x) => x.url === "/v1/requests" && x.query.pageSize === "500000",
  ).length;
  await clickText("Export All Pages");
  let downloaded;
  for (let i = 0; i < 150; i++) {
    downloaded = fs
      .readdirSync(output)
      .filter((name) => name.endsWith(".xlsx"))
      .map((name) => path.join(output, name))
      .find((file) => fs.statSync(file).mtimeMs >= started);
    if (downloaded) break;
    await sleep(100);
  }
  assert.ok(downloaded, "Export must produce a new Excel file");
  const XLSX = require(path.join(target, "node_modules/xlsx"));
  const book = XLSX.readFile(downloaded),
    rows = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]]);
  assert.ok(rows.length > 0);
  if (scope.userId)
    assert.ok(
      rows.every(
        (row) =>
          row.Merchant ===
          (scope.userId === "merchant-1" ? "Account One" : "Account Two"),
      ),
    );
  if (scope.status === "approved")
    assert.ok(rows.every((row) => row.Status === "Confirmed"));
  const list = calls.filter(
    (x) => x.url === "/v1/requests" && x.query.pageSize === "500000",
  );
  assert.equal(list.length, before + 1);
  assert.equal(list.at(-1).query.type, kind);
  for (const [key, value] of Object.entries(scope))
    assert.equal(list.at(-1).query[key], value);
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

  await send("Emulation.setDeviceMetricsOverride", {
    width: 1700,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await reset("/verification-requests/all");
  await until("location.pathname==='/sign-in'", "guest gate");
  pass("Guest access requires sign-in");
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin login");
  await navigate("/verification-requests/all");
  await until(exists("[role=row][data-id=verify-1]"), "verification list");
  assert.equal(
    await evaluate("document.querySelectorAll('[role=row][data-id]').length"),
    10,
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.type,
    "verification",
  );
  assert.ok(await evaluate(exists('[data-field="updatedBy.firstName"]')));
  pass("Verification list retains type, ten-row pagination and staff metadata");
  await screenshot("verification-desktop");
  await click('button[aria-label="Go to next page"]');
  await until(exists("[role=row][data-id=verify-11]"), "second page");
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.page,
    "1",
  );
  await fillSelector(
    "[data-testid=verification-requests-search]",
    "No & Match",
  );
  await until(
    "document.body.innerText.toLowerCase().includes('no verification requests')",
    "search",
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.search,
    "No & Match",
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.page,
    "0",
  );
  pass("Verification pagination and encoded search reset page correctly");
  await navigate("/verification-requests/merchant-1?updatedById=staff-1");
  await until(exists("[role=row][data-id=verify-1]"), "scoped review");
  const scoped = calls.filter((x) => x.url === "/v1/requests").at(-1).query;
  assert.equal(scoped.userId, "merchant-1");
  assert.equal(scoped.updatedById, "staff-1");
  assert.ok(await evaluate("document.body.innerText.includes('Account One')"));
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('a[href=\"/merchants/merchant-1/view\"]'))",
    ),
    false,
  );
  pass(
    "Merchant and reviewer URL scopes initialize without unavailable profile links",
  );
  const docs = await evaluate(
    "[...document.querySelectorAll('[role=row][data-id=verify-1] a[target=_blank]')].map(x=>x.href)",
  );
  assert.ok(docs.includes("https://uploads.example.test/registration.pdf"));
  assert.ok(docs.includes("https://uploads.example.test/tax.pdf"));
  pass("Existing account documents retain direct download links");
  await rowAction("verify-1", "Accept");
  const beforeCancel = calls.filter((x) => x.method === "PATCH").length;
  await clickText("No", "[role=dialog] button");
  assert.equal(calls.filter((x) => x.method === "PATCH").length, beforeCancel);
  failWrite = true;
  await rowAction("verify-1", "Accept");
  await confirm();
  assert.equal(records.find((x) => x.id === "verify-1").status, "pending");
  failWrite = false;
  await rowAction("verify-1", "Accept");
  await confirm();
  await until(
    "document.querySelector('[role=row][data-id=verify-1]')?.innerText.includes('Confirmed')",
    "approved",
  );
  assert.deepEqual(calls.filter((x) => x.method === "PATCH").at(-1).body, {
    status: "approved",
  });
  pass(
    "Review confirmation, failed decision and retry target the actual row with status only",
  );
  await rowAction("verify-1", "Refuse");
  await confirm();
  await until(
    "document.querySelector('[role=row][data-id=verify-1]')?.innerText.includes('Refused')",
    "rejected",
  );
  await rowAction("verify-1", "Accept");
  await confirm();
  await until(
    "document.querySelector('[role=row][data-id=verify-1]')?.innerText.includes('Confirmed')",
    "re-approved",
  );
  pass("Verification approvals and refusals can be reversed as in the source");
  await setStatusFilter("verification-requests", "approved");
  await until(
    "!document.querySelector('[role=row][data-id=verify-3]') && Boolean(document.querySelector('[role=row][data-id=verify-1]'))",
    "status filter",
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.status,
    "approved",
  );
  await send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: output,
  });
  await exportAll("verification", {
    userId: "merchant-1",
    updatedById: "staff-1",
    status: "approved",
  });
  for (
    let i = 0;
    i < 100 && !fs.readdirSync(output).some((x) => x.endsWith(".xlsx"));
    i++
  )
    await sleep(50);
  assert.ok(fs.readdirSync(output).some((x) => x.endsWith(".xlsx")));
  pass(
    "Verification filtered export downloads Excel with matching merchant/reviewer/status scopes",
  );
  await click("[data-testid=verification-requests-filters]");
  await until(
    exists("[role=menu] .MuiAutocomplete-root input"),
    "merchant filter",
  );
  await fillSelector("[role=menu] .MuiAutocomplete-root input", "Two");
  await until(
    "Boolean([...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes('Account Two')))",
    "account options",
  );
  await evaluate(
    "[...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes('Account Two')).click()",
  );
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
  });
  await until(
    exists("[role=row][data-id=verify-2]"),
    "merchant filter applied",
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.userId,
    "merchant-2",
  );
  await clickText("Reset filters");
  await until(exists("[role=row][data-id=verify-1]"), "route scope reset");
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.userId,
    "merchant-1",
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.updatedById,
    "staff-1",
  );
  pass(
    "Merchant picker changes scope and reset restores the merchant/reviewer URL filters",
  );
  await navigate("/auth-requests/all");
  await until(exists("[role=row][data-id=auth-1]"), "authorization list");
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.type,
    "authorization",
  );
  await rowAction("auth-1", "Accept");
  await confirm();
  await until(
    "document.querySelector('[role=row][data-id=auth-1]')?.innerText.includes('Confirmed')",
    "authorization approved",
  );
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('[role=row][data-id=auth-1] button')].some(x=>['Accept','Refuse'].includes(x.textContent.trim()))",
    ),
    false,
  );
  await rowAction("auth-3", "Accept").then(
    () => {
      throw Error("Rejected authorization must not have Accept");
    },
    () => {},
  );
  pass("Authorization review is restricted to pending requests");
  await navigate("/auth-requests/merchant-2");
  await until(
    exists("[role=row][data-id=auth-2]"),
    "authorization merchant scope",
  );
  await exportAll("authorization", { userId: "merchant-2" });
  pass(
    "Authorization account scopes and export-all remain independent of verification",
  );
  failList = true;
  await navigate("/verification-requests/all");
  await until(
    "document.body.innerText.includes('Unable to load requests')",
    "list error",
  );
  failList = false;
  await clickText("Retry");
  await until(exists("[role=row][data-id=verify-1]"), "retry list");
  pass("Failed request lists expose working retry actions");
  await login("viewer@example.test");
  await until("location.pathname==='/home'", "viewer login");
  for (const folder of ["auth-requests", "verification-requests"]) {
    await navigate("/" + folder + "/all");
    await until(exists("[role=row][data-id]"), "viewer list");
    assert.equal(
      await evaluate(
        "[...document.querySelectorAll('[role=row][data-id] button')].some(x=>['Accept','Refuse'].includes(x.textContent.trim()))",
      ),
      false,
    );
  }
  pass("View-only staff can read documents but cannot approve or refuse");
  await login("employee@example.test");
  await until("location.pathname==='/home'", "employee login");
  await navigate("/verification-requests/all");
  await until(exists("[role=row][data-id=verify-1]"), "employee list");
  assert.equal(
    await evaluate(exists('[data-field="updatedBy.firstName"]')),
    false,
  );
  await click("[data-testid=verification-requests-filters]");
  await until(exists("[role=menu]"), "employee filters");
  assert.equal(
    await evaluate(
      "document.querySelector('[role=menu]').innerText.includes('Updated By')",
    ),
    false,
  );
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
  });
  pass(
    "Reviewer columns and employee-selection filter remain administrator-only",
  );
  await login("denied@example.test");
  await until("location.pathname==='/home'", "denied login");
  const deniedBefore = calls.filter((x) => x.url === "/v1/requests").length;
  for (const folder of ["auth-requests", "verification-requests"]) {
    await navigate("/" + folder + "/all");
    await until(
      "document.body.innerText.includes('Unauthorized Access')",
      "denied " + folder,
    );
  }
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").length,
    deniedBefore,
  );
  pass("Denied staff cannot load either request feature");
  await login("merchant@example.test");
  await until("location.pathname==='/home'", "merchant login");
  await navigate("/auth-requests/merchant-2");
  await until(exists("[data-testid=add-auth-request]"), "merchant list");
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.userId,
    undefined,
  );
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('[role=row][data-id]')].some(x=>x.getAttribute('data-id')==='auth-2')",
    ),
    false,
  );
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('[role=row] button')].some(x=>['Accept','Refuse'].includes(x.textContent.trim()))",
    ),
    false,
  );
  pass(
    "Merchant lists ignore route owner overrides and retain server account scoping",
  );
  await navigate("/auth-requests/foreign-owner/new");
  await until(exists("textarea[name=description]"), "new authorization");
  await click("[data-testid=send-auth-request]");
  await until(
    "document.querySelectorAll('.Mui-error').length>0",
    "required validation",
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests" && x.method === "POST").length,
    0,
  );
  await fillField("description", "Merchant notes that must survive");
  failUpload = true;
  await upload("failed.pdf");
  await until(
    "document.body.innerText.includes('The request failed')",
    "upload error",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('textarea[name=description]').value",
    ),
    "Merchant notes that must survive",
  );
  failUpload = false;
  slowUpload = true;
  await upload("authorization.pdf");
  await until(
    "document.querySelector('[data-testid=send-auth-request]')?.disabled",
    "upload locks submission",
  );
  await until(
    "Boolean(document.querySelector('a[href=\"https://uploads.example.test/authorization.pdf\"]'))",
    "uploaded",
  );
  slowUpload = false;
  pass(
    "Required notes/document validation, failed uploads and upload busy state preserve the draft",
  );
  failWrite = true;
  await click("[data-testid=send-auth-request]");
  await until(
    "document.body.innerText.includes('Something went wrong while')",
    "failed submit",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('textarea[name=description]').value",
    ),
    "Merchant notes that must survive",
  );
  assert.ok(
    await evaluate(
      exists('a[href="https://uploads.example.test/authorization.pdf"]'),
    ),
  );
  failWrite = false;
  await click("[data-testid=send-auth-request]");
  await until("location.pathname==='/auth-requests/all'", "request sent");
  const created = calls
    .filter((x) => x.url === "/v1/requests" && x.method === "POST")
    .at(-1).body;
  assert.deepEqual(created, {
    description: "Merchant notes that must survive",
    fileUrl: "https://uploads.example.test/authorization.pdf",
    userId: "merchant-1",
    type: "authorization",
    status: "pending",
  });
  assert.ok(calls.some((x) => x.url === "/v1/users/me"));
  pass(
    "Failed submission keeps uploaded document; retry uses current account and fixed pending authorization type",
  );
  const newId = records.find(
    (x) => x.description === "Merchant notes that must survive",
  ).id;
  await navigate("/auth-requests/all/" + newId);
  await until(exists("textarea[name=description]"), "submitted detail");
  assert.equal(
    await evaluate(
      "document.querySelector('textarea[name=description]').disabled",
    ),
    true,
  );
  assert.equal(
    await evaluate(exists("[data-testid=send-auth-request]")),
    false,
  );
  await navigate("/auth-requests/all/verify-1");
  await until(
    "document.body.innerText.includes('No such')||document.body.innerText.includes('no such')",
    "wrong request type",
  );
  pass(
    "Submitted requests are read-only and other request types cannot populate their form",
  );
  await navigate("/auth-requests/all/new");
  await until(exists("textarea[name=description]"), "refresh-failure form");
  await fillField("description", "Accepted despite refresh failure");
  await upload("refresh.pdf");
  await until(
    exists('a[href="https://uploads.example.test/refresh.pdf"]'),
    "refresh upload",
  );
  failRefresh = true;
  await click("[data-testid=send-auth-request]");
  await until(
    "location.pathname==='/auth-requests/all'",
    "accepted before refresh",
  );
  await until(
    "document.body.innerText.includes('could not be refreshed')",
    "refresh error message",
  );
  failRefresh = false;
  assert.equal(
    records.filter((x) => x.description === "Accepted despite refresh failure")
      .length,
    1,
  );
  pass(
    "Account refresh failure cannot turn a completed request into a duplicate submission",
  );
  await navigate("/verification-requests/all");
  await until(
    "document.body.innerText.includes('Unauthorized Access')||location.pathname==='/home'",
    "merchant staff-route denial",
  );
  pass("Merchants cannot open the staff verification-review route");
  await login("authorized@example.test");
  await until("location.pathname==='/home'", "authorized login");
  await navigate("/auth-requests/all");
  await until(exists("[data-testid=auth-requests-table]"), "authorized list");
  assert.equal(await evaluate(exists("[data-testid=add-auth-request]")), false);
  await navigate("/auth-requests/all/new");
  await until(
    "location.pathname==='/auth-requests/all'",
    "authorized create blocked",
  );
  pass(
    "Already authorized accounts cannot create another authorization request",
  );
  await send("Page.removeScriptToEvaluateOnNewDocument", {
    identifier: languageScript.identifier,
  });
  await evaluate("localStorage.setItem('my-language','ar')");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await navigate("/auth-requests/all");
  await until(
    exists("[data-testid=auth-requests-table]"),
    "Arabic mobile list",
  );
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  await screenshot("authorization-ar-mobile");
  pass("Arabic mobile lists keep RTL and contained table scrolling");
  account = { ...account, isAuthorized: false };
  await navigate("/auth-requests/all/new");
  await until(
    exists("textarea[name=description]"),
    "Arabic mobile authorization form",
  );
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  await screenshot("authorization-form-ar-mobile");
  pass(
    "Arabic mobile authorization form fits the screen with document upload and submit controls",
  );
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks: passed, exceptions, calls }, null, 2),
  );
  console.log(
    `${passed}/${passed} account-request browser checks passed; no uncaught JavaScript exceptions.`,
  );
}
main()
  .catch(async (error) => {
    try {
      await screenshot("failure");
      console.error(await evaluate("document.body.innerText"));
      fs.writeFileSync(
        path.join(output, "failure-calls.json"),
        JSON.stringify(calls, null, 2),
      );
    } catch {}
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
