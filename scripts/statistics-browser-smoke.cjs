// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/statistics-browser");
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
      { name: "Cache-Control", value: "no-store" },
    ],
    body:
      status === 204
        ? ""
        : Buffer.from(
            typeof result === "string" ? result : JSON.stringify(result),
          ).toString("base64"),
  });
}
const users = [
  {
    ...normal,
    id: "merchant-1",
    firstName: "Merchant",
    lastName: "Alpha",
    email: "alpha@example.test",
  },
  {
    ...normal,
    id: "merchant-2",
    firstName: "Merchant",
    lastName: "Beta",
    email: "beta@example.test",
  },
];
let failUsers = false,
  failStatistics = false,
  emptyReport = false,
  delayStatistics = false;
const fixtureErrors = [];
let passed = 0;
function pass(name) {
  passed++;
  console.log("PASS " + name);
}
async function intercept(event) {
  const req = event.request,
    url = new URL(req.url),
    method = req.method;
  if (method === "OPTIONS") return fulfill(event, 204, "");
  const query = Object.fromEntries(url.searchParams),
    body = JSON.parse(req.postData || "{}");
  calls.push({ url: url.pathname, method, query, body });
  let result = {},
    status = 200;
  try {
    if (url.pathname.endsWith("/auth-sessions/login")) {
      const kind = body.email.split("@")[0];
      account = { ...normal, id: "staff-1", role: "admin" };
      if (kind === "merchant") account = { ...users[0] };
      if (["viewer", "old", "new", "noview", "denied"].includes(kind)) {
        account.role = "employee";
        account.features =
          kind === "denied"
            ? [{ feature: "merchants", accessView: true }]
            : (kind === "old"
                ? ["merchant-statistics"]
                : kind === "new"
                  ? ["merchant-statistics"]
                  : ["merchant-statistics", "merchant-statistics"]
              ).map((feature) => ({
                feature,
                accessView: kind !== "noview",
                accessCreate: false,
                accessUpdate: false,
                accessDelete: false,
              }));
      }
      result = {
        user: account,
        accessToken: "statistics-access",
        refreshToken: "statistics-refresh",
      };
    } else if (url.pathname.endsWith("/users/me")) result = account || normal;
    else if (url.pathname === "/v1/users") {
      assert.equal(query.type, "user");
      if (failUsers) {
        status = 500;
        result = { message: "Search unavailable" };
      } else {
        const list = users.filter(
          (x) =>
            !query.search ||
            JSON.stringify(x)
              .toLowerCase()
              .includes(query.search.toLowerCase()),
        );
        result = { results: list, total: list.length };
      }
    } else if (["/v1/users/statistics"].includes(url.pathname)) {
      assert.equal(method, "POST");
      assert.ok(users.some((x) => x.id === body.userId));

      const allowed = ["userId", "dateFrom", "dateTo", ...[]];
      assert.deepEqual(
        Object.keys(body).filter((key) => !allowed.includes(key)),
        [],
      );
      if (delayStatistics) await sleep(500);
      if (failStatistics) {
        status = 500;
        result = { message: "Statistics unavailable" };
      } else if (emptyReport) result = null;
      else
        result = {
          financialAssets: {
            total: 37,
            shipments: 12,
            codShipments: 3,
            extraWeight: 4,
            updateByAdministrator: 5,
            bankTransferFees: 6,
            others: 7,
          },
          currentObligations: {
            planBalance: 10,
            balanceCharge: 20,
            canceledShipments: 30,
            codBalance: 40,
            others: -5,
          },
          bankTransfer: { total: 9, cod: 8, others: 1 },
          codObligations: { total: 88, block: 2, pending: 3, paid: 83 },
        };
    } else if (url.pathname.startsWith("/v1/users/")) {
      result = users.find((x) => x.id === url.pathname.split("/").at(-1));
      if (!result) {
        status = 404;
        result = { message: "Not found" };
      }
    } else {
      status = 404;
      result = { message: "Unexpected fixture " + url.pathname };
    }
  } catch (error) {
    fixtureErrors.push(error.stack);
    status = 500;
    result = { message: error.message };
  }
  return fulfill(event, status, result);
}
const exists = (selector) =>
  `Boolean(document.querySelector(${JSON.stringify(selector)}))`;
async function click(selector) {
  await until(exists(selector), "action " + selector);
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
}
async function fillField(name, value) {
  await until(exists(`[name="${name}"]`), "field " + name);
  await fill(name, value);
  await evaluate(
    `document.querySelector('[name="${name}"]').dispatchEvent(new FocusEvent('blur',{bubbles:true}))`,
  );
}
async function selectUser(text) {
  await evaluate(
    `(()=>{const input=document.querySelector('[name=userId]');input.focus();input.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',code:'ArrowDown',bubbles:true}));})()`,
  );
  await fill("userId", text);
  await until(
    `Boolean([...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes(${JSON.stringify(text)})))`,
    "merchant " + text,
  );
  await evaluate(
    `[...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes(${JSON.stringify(text)})).click()`,
  );
}
async function statisticsPage() {
  await navigate("/merchant-statistics");
  await until(exists("[data-testid=generate-statistics]"), "report form");
}
async function generate() {
  await click("[data-testid=generate-statistics]");
}
async function screenshot(name) {
  await sleep(500);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(output, name + ".png"),
    Buffer.from(shot.data, "base64"),
  );
}
const reportCalls = () =>
  calls.filter((x) =>
    ["/v1/users/statistics", "/v1/users/statistics"].includes(x.url),
  );
async function downloadPdf(fileName) {
  const file = path.join(output, fileName + ".pdf");
  if (fs.existsSync(file)) fs.unlinkSync(file);
  await click("[data-testid=print-statistics]");
  for (let i = 0; i < 200; i++) {
    if (fs.existsSync(file) && !fs.existsSync(file + ".crdownload")) break;
    await sleep(100);
  }
  assert.ok(fs.existsSync(file), "PDF downloaded " + fileName);
  const data = fs.readFileSync(file);
  assert.equal(data.subarray(0, 5).toString(), "%PDF-");
  await until(
    "!document.querySelector('[data-testid=print-statistics]').disabled",
    "PDF loading released",
  );
  return data.toString("latin1");
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
      { urlPattern: "https://receipts.example.test/*" },
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
  await send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: output,
  });
  await reset("/merchant-statistics");
  await until("location.pathname==='/sign-in'", "guest protection");
  pass("Guests are redirected to sign-in");
  await login("merchant@example.test");
  await until("location.pathname==='/home'", "merchant login");
  let count = reportCalls().length;
  await navigate("/merchant-statistics");
  await sleep(700);
  assert.equal(reportCalls().length, count);
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=generate-statistics]'))",
    ),
    false,
  );
  pass("Statistics remains staff-only");
  await login("denied@example.test");
  await until("location.pathname==='/home'", "denied login");
  await navigate("/merchant-statistics");
  await sleep(600);
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=generate-statistics]'))",
    ),
    false,
  );
  pass("Staff without statistics grants cannot open report forms");
  await login("noview@example.test");
  await until("location.pathname==='/home'", "no-view login");
  await navigate("/merchant-statistics");
  await sleep(600);
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=generate-statistics]'))",
    ),
    false,
  );
  pass("A grant without view access cannot fetch report data");
  await login("viewer@example.test");
  await until("location.pathname==='/home'", "read-only staff");
  await statisticsPage();
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=print-statistics]').disabled",
    ),
    true,
  );
  count = reportCalls().length;
  await generate();
  await sleep(250);
  assert.equal(reportCalls().length, count);
  await until(
    "document.body.innerText.includes('Required field')",
    "required merchant",
  );
  pass(
    "View-only staff may generate reports, with required-merchant validation and no premature PDF",
  );
  await selectUser("Alpha");
  await fillField("dateFrom", "01/01/2026");
  await fillField("dateTo", "10/22/2026");
  await generate();
  await until(
    "Boolean(document.querySelector('[data-testid=statistics-FINANCIAL_ASSETS]'))",
    "original report",
  );
  assert.equal(reportCalls().at(-1).body.userId, "merchant-1");
  assert.equal(new Date(reportCalls().at(-1).body.dateFrom).getMonth(), 0);
  assert.equal(new Date(reportCalls().at(-1).body.dateTo).getDate(), 22);
  assert.equal(
    await evaluate(
      "document.querySelectorAll('[data-testid^=statistics-] section').length",
    ),
    0,
  );
  assert.equal(
    await evaluate(
      "document.querySelectorAll('[data-testid=merchant-statistics-report] section').length",
    ),
    4,
  );
  assert.ok(
    await evaluate(
      "document.querySelector('[data-testid=merchant-statistics-report]').innerText.includes('-5.00')",
    ),
  );
  await screenshot("statistics-desktop");
  pass(
    "Original report sends the selected dates and renders all four source groups including negative balances",
  );
  await fill("userId", "Beta");
  await until(
    "Boolean([...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes('Beta')))",
    "current search results",
  );
  assert.ok(
    calls.some((x) => x.url === "/v1/users" && x.query.search === "Beta"),
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
  assert.ok(
    await evaluate(
      "document.querySelector('[data-testid=report-merchant]').innerText.includes('Alpha')",
    ),
  );
  pass(
    "Remote merchant search uses current text and leaves the submitted report unchanged",
  );
  await selectUser("Beta");
  await until(
    exists("[data-testid=statistics-draft-changed]"),
    "draft warning",
  );
  assert.ok(
    await evaluate(
      "document.querySelector('[data-testid=report-merchant]').innerText.includes('Alpha')",
    ),
  );
  const pdf = await downloadPdf("Ashamco-statistics-merchant-1");
  assert.ok(pdf.includes("/Type /Page"));
  pass(
    "PDF download retains the generated merchant snapshot after draft filters change",
  );
  failStatistics = true;
  await generate();
  await until(
    "document.body.innerText.includes('Unable to load statistics')",
    "report failure",
  );
  assert.ok(
    await evaluate(
      "document.querySelector('[name=userId]').value.includes('Beta')",
    ),
  );
  assert.ok(
    await evaluate(
      "document.querySelector('[data-testid=report-merchant]').innerText.includes('Alpha')",
    ),
  );
  failStatistics = false;
  await generate();
  await until(
    "document.querySelector('[data-testid=report-merchant]').innerText.includes('Beta')",
    "report retry",
  );
  pass(
    "Failed generation retains filters and last successful report, then retries correctly",
  );
  await selectUser("Alpha");
  delayStatistics = true;
  count = reportCalls().length;
  await evaluate(
    "document.querySelector('[data-testid=generate-statistics]').click();document.querySelector('[data-testid=generate-statistics]').click()",
  );
  await until(`true`, "validation");
  await sleep(100);
  await selectUser("Beta");
  await until(
    "!document.querySelector('[data-testid=generate-statistics]').disabled",
    "delayed report",
  );
  delayStatistics = false;
  assert.equal(reportCalls().length, count + 1);
  assert.ok(
    await evaluate(
      "document.querySelector('[data-testid=report-merchant]').innerText.includes('Alpha')",
    ),
  );
  assert.ok(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=statistics-draft-changed]'))",
    ),
  );
  pass(
    "Duplicate generation is blocked and edits during a request cannot relabel the returned report",
  );
  await fillField("dateTo", "01/01/2025");
  count = reportCalls().length;
  await generate();
  await sleep(250);
  assert.equal(reportCalls().length, count);
  await until(
    "document.body.innerText.includes('Invalid End Date')",
    "date range validation",
  );
  await fillField("dateFrom", "");
  await fillField("dateTo", "");
  await generate();
  await until(
    "document.querySelector('[data-testid=report-dates]').innerText.includes('All dates')",
    "all-date report",
  );
  assert.deepEqual(reportCalls().at(-1).body, { userId: "merchant-2" });
  pass(
    "Reversed dates are rejected; clearing dates preserves the original open-boundary API contract",
  );
  emptyReport = true;
  await generate();
  await until(
    "document.querySelector('[data-testid=print-statistics]').disabled",
    "empty report",
  );
  await until(
    "!document.querySelector('[data-testid=report-merchant]')",
    "empty report clears snapshot",
  );
  emptyReport = false;
  await generate();
  await until(exists("[data-testid=report-merchant]"), "after empty retry");
  pass(
    "Empty responses clear obsolete data and disable export, with normal recovery",
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
  await statisticsPage();
  await selectUser("Beta");
  await generate();
  await until(
    exists("[data-testid=statistics-FINANCIAL_ASSETS]"),
    "Arabic original report",
  );
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  await sleep(300);
  const fields = await evaluate(
    "['userId','dateFrom','dateTo'].map(name=>{const input=document.querySelector('[name='+name+']');const box=input.closest(name==='userId'?'.MuiAutocomplete-root':'.MuiFormControl-root').getBoundingClientRect();return {name,width:box.width,left:box.left,right:box.right}})",
  );
  fs.writeFileSync(
    path.join(output, "mobile-field-layout.json"),
    JSON.stringify(fields, null, 2),
  );
  assert.ok(
    fields.every(
      (field) => field.width >= 300 && field.left >= 0 && field.right <= 390,
    ),
    JSON.stringify(fields),
  );
  await screenshot("statistics-ar-mobile");
  pass(
    "Original report also preserves full-width merchant/date fields in the Arabic mobile layout",
  );
  assert.equal(
    calls.some((x) => ["PATCH", "DELETE"].includes(x.method)),
    false,
  );
  assert.deepEqual(fixtureErrors, []);
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify(
      { checks: passed, exceptions, fixtureErrors, calls },
      null,
      2,
    ),
  );
  console.log(
    `${passed}/${passed} statistics browser checks passed; no uncaught exceptions.`,
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
