// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/applications-browser");
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
  failDetail = false,
  failSave = false,
  failDelete = false,
  failUsers = false,
  sequence = 15;
const users = [
  { ...normal, id: "merchant-1", firstName: "Account", lastName: "One" },
  { ...normal, id: "merchant-2", firstName: "Account", lastName: "Two" },
];
const applications = Array.from({ length: 15 }, (_, index) => ({
  id: "app-" + (index + 1),
  name: {
    en: "Application " + String(index + 1).padStart(2, "0"),
    ar: "التطبيق " + (index + 1),
  },
  clientName: "client_" + (index + 1),
  userId: index === 0 ? "merchant-2" : "merchant-1",
  ...(index === 0 ? {} : { user: users[0] }),
  scopes: [
    {
      id: "scope-" + (index + 1),
      feature: "shipments",
      read: true,
      write: true,
      maxHourlyUsage: 444,
    },
    { feature: "users", read: true, write: false, maxHourlyUsage: 0 },
    {
      id: "future-" + (index + 1),
      feature: "future-scope",
      read: true,
      write: false,
      maxHourlyUsage: null,
    },
  ],
  apiKey: "mock-application-key-" + (index + 1) + "-" + "x".repeat(100),
  createdAt: "2026-10-01T12:00:00Z",
  lastUsedAt: "2026-10-20T12:00:00Z",
  updatedAt: "2026-10-21T12:00:00Z",
}));
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
  if (!url.pathname.includes("/v1/"))
    return send("Fetch.continueRequest", { requestId: event.requestId });
  const query = Object.fromEntries(url.searchParams),
    body = JSON.parse(req.postData || "{}");
  calls.push({ url: url.pathname, method, query, body });
  let result = {},
    status = 200;
  if (url.pathname.endsWith("/auth-sessions/login")) {
    const viewer = body.email.startsWith("viewer"),
      denied = body.email.startsWith("denied"),
      creator = body.email.startsWith("creator"),
      noView = body.email.startsWith("noview"),
      merchant = body.email.startsWith("merchant");
    account = {
      ...normal,
      id: merchant ? "merchant-1" : "staff-1",
      role: merchant
        ? "user"
        : viewer || denied || creator || noView
          ? "employee"
          : "admin",
    };
    if (viewer || creator || noView)
      account.features = [
        {
          feature: "applications",
          accessView: !noView,
          accessCreate: creator || noView,
          accessUpdate: false,
          accessDelete: false,
        },
      ];
    if (denied) account.features = [{ feature: "merchants", accessView: true }];
    result = {
      user: account,
      accessToken: "applications-access",
      refreshToken: "applications-refresh",
    };
  } else if (url.pathname.endsWith("/users/me")) result = account || normal;
  else if (url.pathname === "/v1/users") {
    assert.equal(query.type, "user");
    if (failUsers) {
      status = 500;
      result = { message: "User lookup failed" };
    } else {
      const list = query.search
        ? users.filter((user) =>
            (user.firstName + " " + user.lastName + " " + user.email)
              .toLowerCase()
              .includes(query.search.toLowerCase()),
          )
        : [users[0]];
      result = { results: list, total: list.length };
    }
  } else if (url.pathname.startsWith("/v1/users/")) {
    const user = users.find(
      (user) => user.id === url.pathname.split("/").at(-1),
    );
    if (!user || failUsers) {
      status = failUsers ? 500 : 404;
      result = { message: "Owner unavailable" };
    } else result = user;
  } else if (url.pathname === "/v1/applications") {
    if (method === "POST") {
      if (failSave) {
        status = 500;
        result = { message: "Save failed" };
      } else {
        result = {
          ...body,
          id: "app-" + ++sequence,
          user: users.find((user) => user.id === body.userId),
          apiKey: "mock-created-key",
          createdAt: "2026-10-23T12:00:00Z",
        };
        applications.push(result);
      }
    } else if (failList) {
      status = 500;
      result = { message: "List failed" };
    } else {
      const list = applications.filter(
        (app) =>
          (!query.search ||
            JSON.stringify(app.name)
              .toLowerCase()
              .includes(query.search.toLowerCase())) &&
          (!query.userId || app.userId === query.userId),
      );
      result = {
        results: list.slice(
          Number(query.page) * Number(query.pageSize),
          (Number(query.page) + 1) * Number(query.pageSize),
        ),
        total: list.length,
      };
    }
  } else if (url.pathname.startsWith("/v1/applications/")) {
    const id = url.pathname.split("/").at(-1),
      index = applications.findIndex((app) => app.id === id);
    if (index < 0 || (method === "GET" && failDetail)) {
      status = index < 0 ? 404 : 500;
      result = { message: "Application unavailable" };
    } else if (method === "PATCH") {
      if (failSave) {
        status = 500;
        result = { message: "Save failed" };
      } else {
        applications[index] = {
          ...applications[index],
          ...body,
          user: users.find((user) => user.id === body.userId),
        };
        result = applications[index];
      }
    } else if (method === "DELETE") {
      if (failDelete) {
        status = 500;
        result = { message: "Delete failed" };
      } else {
        applications.splice(index, 1);
        status = 204;
      }
    } else result = applications[index];
  } else {
    status = 404;
    result = { message: "Unexpected fixture URL " + url.pathname };
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
    `(()=>{[...document.querySelectorAll(${JSON.stringify(selector)})].find(x=>x.getClientRects().length).click()})()`,
  );
}
async function fillField(name, value) {
  await until(
    exists(`input[name="${name}"],textarea[name="${name}"]`),
    "field " + name,
  );
  await evaluate(
    `(()=>{const input=document.querySelector('input[name=${JSON.stringify(name)}],textarea[name=${JSON.stringify(name)}]');Object.getOwnPropertyDescriptor(input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`,
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
async function closeDialog() {
  await click("[role=dialog] button[aria-label=close]");
  await until("!document.querySelector('[role=dialog]')", "dialog closes");
}
async function confirm() {
  await clickText("Yes", "[role=dialog] button");
  await until("!document.querySelector('[role=dialog]')", "confirmation ends");
  await sleep(120);
}
async function pickUser(text) {
  await evaluate("document.querySelector('input[name=userId]').focus()");
  await fillField("userId", text);
  await until(
    `Boolean([...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes(${JSON.stringify(text)})))`,
    "owner search " + text,
  );
  await evaluate(
    `[...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes(${JSON.stringify(text)})).click()`,
  );
  await sleep(100);
}
async function detail(id) {
  await navigate("/applications/" + id);
  await until(
    `document.querySelector('input[name=clientName]')?.value===${JSON.stringify(id === "new" ? "" : "client_" + id.split("-")[1])}`,
    "application detail " + id,
  );
}
async function save() {
  await click("[data-testid=save-application]");
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
    source:
      "localStorage.setItem('my-language','en');Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedText=text}}});document.execCommand=()=>true",
  });
  await navigate("/sign-in");
  await until(
    "Boolean(document.querySelector('input[name=email]')) || location.pathname==='/home'",
    "initial browser load",
  );

  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await reset("/applications");
  await until("location.pathname==='/sign-in'", "guest protection");
  pass("Guests must authenticate before accessing applications");
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin sign in");
  await navigate("/applications");
  await until(exists("[role=row][data-id=app-1]"), "application list");
  assert.equal(
    await evaluate("document.querySelectorAll('[role=row][data-id]').length"),
    10,
  );
  await screenshot("applications-desktop");
  pass("Staff navigation, localized application names and ten-row pagination");
  await click('button[aria-label="Go to next page"]');
  await until(exists("[role=row][data-id=app-11]"), "page two");
  assert.equal(
    calls.filter((call) => call.url === "/v1/applications").at(-1).query.page,
    "1",
  );
  await fillSelector("[data-testid=applications-search]", "No & Match");
  await until(
    "document.body.innerText.includes('No applications found')",
    "encoded search",
  );
  assert.equal(
    calls.filter((call) => call.url === "/v1/applications").at(-1).query.search,
    "No & Match",
  );
  assert.equal(
    calls.filter((call) => call.url === "/v1/applications").at(-1).query.page,
    "0",
  );
  await clickText("Reset filters");
  await until(exists("[role=row][data-id=app-1]"), "reset search");
  pass(
    "Search and filter resets preserve structured queries and reset pagination",
  );
  await click("[data-testid=applications-filters]");
  await until(
    exists("[role=menu] .MuiAutocomplete-root input"),
    "merchant filter input",
  );
  await evaluate(
    "document.querySelector('[role=menu] .MuiAutocomplete-root input').focus()",
  );
  await fillSelector("[role=menu] .MuiAutocomplete-root input", "Two");
  await until(
    "Boolean([...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes('Account Two')))",
    "merchant filter option",
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
    "Boolean(document.querySelector('[role=row][data-id=app-1]')) && !document.querySelector('[role=row][data-id=app-2]')",
    "merchant filtered list",
  );
  assert.equal(
    calls.filter((call) => call.url === "/v1/applications").at(-1).query.userId,
    "merchant-2",
  );
  await clickText("Reset filters");
  await until(exists("[role=row][data-id=app-2]"), "merchant filter reset");
  assert.equal(
    calls.filter((call) => call.url === "/v1/applications").at(-1).query.userId,
    undefined,
  );
  pass(
    "Merchant selection filters the list and reset clears the owner query scope",
  );
  await clickText("API Key", "[role=row][data-id=app-1] button");
  await until(exists("[data-testid=application-api-details]"), "list API key");
  assert.ok(
    await evaluate(
      "document.querySelector('[role=dialog]').innerText.includes('x-api-key')",
    ),
  );
  assert.ok(
    await evaluate(
      "document.querySelector('[role=dialog] a')?.href.endsWith('/docs')",
    ),
  );
  await click("[role=dialog] button[aria-label]");
  await until("!document.querySelector('[role=dialog]')", "API dialog closes");
  pass(
    "List API-key dialog exposes the configured base URL and original docs endpoint",
  );
  await detail("app-1");
  await until(
    "document.querySelector('input[name=userId]')?.value==='Account Two'",
    "fallback owner",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=clientName]').disabled"),
    true,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=limit-scope-shipments]').value",
    ),
    "444",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=limit-scope-users]').value",
    ),
    "0",
  );
  assert.ok(
    await evaluate(exists("[data-testid=application-scope-future-scope]")),
  );
  pass(
    "Existing client identifiers, out-of-page owners, limits and unknown scopes load intact",
  );
  await click("[data-testid=application-api-key]");
  await until(
    exists("[data-testid=application-api-details]"),
    "detail API key",
  );
  assert.ok(
    await evaluate(
      "document.querySelector('[role=dialog] a')?.href.endsWith('/api-docs')",
    ),
  );
  await evaluate(
    "[...document.querySelectorAll('[role=dialog] button')].at(-1).click()",
  );
  await until(
    "window.__copiedText?.startsWith('mock-application-key-1')",
    "key copied",
  );
  assert.equal(await evaluate("window.__copiedText"), applications[0].apiKey);
  await closeDialog();
  pass(
    "Detail integration dialog keeps the original endpoint and copyable API key",
  );
  await fillField("name.en", "Unsaved application draft");
  await fillSelector("[data-testid=limit-scope-shipments]", "765");
  failUsers = true;
  await fillField("userId", "Lookup failure");
  await until(
    "document.body.innerText.includes('Unable to load accounts')",
    "account lookup error",
  );
  failUsers = false;
  await clickText("Retry");
  await until(
    "!document.body.innerText.includes('Unable to load accounts')",
    "lookup retry",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=\"name.en\"]').value"),
    "Unsaved application draft",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=limit-scope-shipments]').value",
    ),
    "765",
  );
  await pickUser("One");
  pass(
    "Account lookup failures and searches preserve the application draft and limits",
  );
  failSave = true;
  await save();
  await until(
    "document.body.innerText.includes('Something went wrong when updating')",
    "failed update",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=\"name.en\"]').value"),
    "Unsaved application draft",
  );
  failSave = false;
  await save();
  await until(
    "location.pathname==='/applications' && Boolean(document.querySelector('[role=row][data-id=app-1]'))",
    "updated application",
  );
  const updated = calls.filter((call) => call.method === "PATCH").at(-1);
  assert.equal(updated.url, "/v1/applications/app-1");
  assert.equal(
    updated.body.scopes.find((scope) => scope.feature === "shipments")
      .maxHourlyUsage,
    765,
  );
  assert.equal(
    updated.body.scopes.find((scope) => scope.feature === "users")
      .maxHourlyUsage,
    0,
  );
  assert.equal(
    updated.body.scopes.find((scope) => scope.feature === "future-scope")
      .maxHourlyUsage,
    null,
  );
  assert.equal(updated.body.userId, "merchant-1");
  assert.equal(updated.body.apiKey, undefined);
  assert.equal(updated.body.user, undefined);
  assert.equal(updated.body.scopes[0].id, undefined);
  pass(
    "Failed updates keep drafts; retry saves limits and future scopes without keys or metadata",
  );
  await detail("new");
  await save();
  await until(
    "document.querySelectorAll('.Mui-error').length>0",
    "required validation",
  );
  assert.equal(
    calls.filter(
      (call) => call.url === "/v1/applications" && call.method === "POST",
    ).length,
    0,
  );
  await fillField("name.en", "New Shipping Integration");
  await fillField("clientName", "new_shipping_integration");
  await pickUser("Two");
  pass(
    "New application validates English name, client name and merchant while Arabic stays optional",
  );
  await click("[data-testid=enable-scope-shipments] input");
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=read-scope-shipments] input').checked",
    ),
    true,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=read-scope-shipments] input').disabled",
    ),
    true,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=limit-scope-shipments]').value",
    ),
    "300",
  );
  await click("[data-testid=write-scope-shipments] input");
  await click("[data-testid=read-scope-shipments] input");
  await click("[data-testid=write-scope-shipments] input");
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=read-scope-shipments] input').checked",
    ),
    true,
  );
  await fillSelector("[data-testid=limit-scope-shipments]", "650");
  await click("[data-testid=enable-scope-users] input");
  assert.equal(
    await evaluate(exists("[data-testid=write-scope-users]")),
    false,
  );
  await fillSelector("[data-testid=limit-scope-users]", "0");
  pass(
    "Scope defaults, supported writes and write-implies-read behave correctly on user action",
  );
  failSave = true;
  await save();
  await until(
    "document.body.innerText.includes('Something went wrong when creating')",
    "failed creation",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=limit-scope-shipments]').value",
    ),
    "650",
  );
  failSave = false;
  await save();
  await until("location.pathname==='/applications'", "created");
  const created = calls
    .filter((call) => call.method === "POST" && call.url === "/v1/applications")
    .at(-1).body;
  assert.equal(created.userId, "merchant-2");
  assert.equal(
    created.scopes.find((scope) => scope.feature === "shipments")
      .maxHourlyUsage,
    650,
  );
  assert.equal(
    created.scopes.find((scope) => scope.feature === "users").maxHourlyUsage,
    0,
  );
  assert.equal(created.apiKey, undefined);
  assert.equal(
    applications.filter((app) => app.clientName === "new_shipping_integration")
      .length,
    1,
  );
  pass(
    "Failed creation retains form state and retry creates exactly one application with hourly limits",
  );
  await detail("app-2");
  await click("[data-testid=remove-application]");
  await until(exists("[role=dialog]"), "delete confirmation");
  const deletesBefore = calls.filter((call) => call.method === "DELETE").length;
  await clickText("No", "[role=dialog] button");
  assert.equal(
    calls.filter((call) => call.method === "DELETE").length,
    deletesBefore,
  );
  failDelete = true;
  await click("[data-testid=remove-application]");
  await confirm();
  await until(
    "document.body.innerText.includes('Unable to remove the application')",
    "failed delete",
  );
  assert.ok(applications.some((app) => app.id === "app-2"));
  failDelete = false;
  await click("[data-testid=remove-application]");
  await confirm();
  await until(
    "location.pathname==='/applications' && !document.querySelector('[role=row][data-id=app-2]')",
    "deleted",
  );
  assert.equal(
    calls.filter((call) => call.method === "DELETE").at(-1).url,
    "/v1/applications/app-2",
  );
  assert.ok(applications.some((app) => app.id === "app-1"));
  pass(
    "Delete cancellation, failure and retry target the selected detail ID only",
  );
  failList = true;
  await navigate("/applications");
  await until(
    "document.body.innerText.includes('Unable to load applications')",
    "list error",
  );
  failList = false;
  await clickText("Retry");
  await until(exists("[role=row][data-id=app-1]"), "list retry");
  failDetail = true;
  await navigate("/applications/app-1");
  await until(
    "document.body.innerText.includes('Unable to load applications')",
    "detail error",
  );
  failDetail = false;
  await clickText("Retry");
  await until(exists("input[name=clientName]"), "detail retry");
  await navigate("/applications/missing");
  await until(
    "document.body.innerText.includes('No such application')",
    "missing detail",
  );
  assert.ok(await evaluate(exists('a[href="/applications"]')));
  pass("List/detail errors retry and missing IDs expose a working back link");
  await login("viewer@example.test");
  await until("location.pathname==='/home'", "viewer login");
  await detail("app-1");
  assert.equal(await evaluate(exists("[data-testid=save-application]")), false);
  assert.equal(
    await evaluate(exists("[data-testid=remove-application]")),
    false,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('input[name=\"name.en\"]').disabled",
    ),
    true,
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=userId]').disabled"),
    true,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=enable-scope-shipments] input').disabled",
    ),
    true,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=limit-scope-shipments]').disabled",
    ),
    true,
  );
  await click("[data-testid=application-api-key]");
  await until(
    exists("[data-testid=application-api-details]"),
    "read-only integration details",
  );
  await closeDialog();
  await navigate("/applications/new");
  await until(
    "document.body.innerText.includes('Unauthorized Access')",
    "view-only create guard",
  );
  pass(
    "View-only staff can inspect/copy integration details without editing, creating or deleting",
  );
  await login("creator@example.test");
  await until("location.pathname==='/home'", "creator login");
  await detail("new");
  assert.ok(await evaluate(exists("[data-testid=save-application]")));
  await detail("app-1");
  assert.equal(await evaluate(exists("[data-testid=save-application]")), false);
  pass("Create and update grants remain independent");
  await login("noview@example.test");
  await until("location.pathname==='/home'", "no-view login");
  let before = calls.filter((call) =>
    call.url.startsWith("/v1/applications"),
  ).length;
  await navigate("/applications/new");
  await until("location.pathname==='/home'", "view required for creation");
  assert.equal(
    calls.filter((call) => call.url.startsWith("/v1/applications")).length,
    before,
  );
  pass("Create permission without view permission cannot load the feature");
  for (const email of ["denied@example.test", "merchant@example.test"]) {
    await login(email);
    await until("location.pathname==='/home'", "restricted login");
    before = calls.filter((call) =>
      call.url.startsWith("/v1/applications"),
    ).length;
    await navigate("/applications/app-1");
    await until(
      "document.body.innerText.includes('Unauthorized Access')||location.pathname==='/home'",
      "staff role permission",
    );
    assert.equal(
      calls.filter((call) => call.url.startsWith("/v1/applications")).length,
      before,
    );
  }
  pass("Denied staff and merchant accounts cannot fetch application data");
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin mobile login");
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
  await detail("app-1");
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  await screenshot("application-ar-mobile");
  await click("[data-testid=application-api-key]");
  await until(
    exists("[data-testid=application-api-details]"),
    "mobile key dialog",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=application-api-details] [dir=ltr]')?.getAttribute('dir')",
    ),
    "ltr",
  );
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  await screenshot("application-api-ar-mobile");
  await closeDialog();
  pass(
    "Arabic mobile form stays RTL and long API keys remain readable in LTR dialogs",
  );
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks: passed, exceptions, calls }, null, 2),
  );
  console.log(
    `${passed}/${passed} application browser checks passed; no uncaught JavaScript exceptions.`,
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
