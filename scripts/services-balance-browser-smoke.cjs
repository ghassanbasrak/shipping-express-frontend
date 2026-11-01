// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/services-balance-browser");
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

let passed = 0,
  failAudit = false,
  emptyAudit = false,
  delayAudit = 0;
const pass = (name) => {
  passed++;
  console.log("PASS " + name);
};
const first = {
  _id: "raw-first",
  transactionNumber: "TX-001",
  amount: 0,
  previousBalance: 0,
  currentBalance: 0,
  hasRepeatedBalance: true,
  user: { id: "owner-1", email: "owner1@example.test" },
  type: "deposit",
  title: { en: "English title", ar: "عنوان عربي" },
  description: { en: "English description", ar: "وصف عربي" },
  notes: '<img src=x onerror="window.__auditInjected=true">',
  reference: "REFERENCE-ONE",
  createdAt: "2026-10-20T12:00:00Z",
};
const rows = Array.from({ length: 14 }, (_, i) => ({
  ...first,
  _id: "raw-" + i,
  transactionNumber: "TX-" + String(i + 1).padStart(3, "0"),
  amount: i === 2 ? -25 : i,
  hasRepeatedBalance: i % 2 === 0,
}));
rows[0] = first;
rows[1] = structuredClone(first);
rows[2] = {
  ...rows[2],
  transactionNumber: undefined,
  _id: "raw-only",
  createdAt: "invalid-date",
};
const report = {
  users: [
    { groups: [{ transactions: rows }] },
    {
      userId: "owner-2",
      user: { id: "owner-2", email: "owner2@example.test" },
      groups: [
        {
          transactions: [
            { _id: "outer-one", amount: 15, hasRepeatedBalance: false },
            { _id: "outer-two", amount: 0, hasRepeatedBalance: true },
          ],
        },
      ],
    },
  ],
};
async function fulfill(event, status, result) {
  await send("Fetch.fulfillRequest", {
    requestId: event.requestId,
    responseCode: status,
    responseHeaders: [
      { name: "Content-Type", value: "application/json" },
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
        : Buffer.from(JSON.stringify(result)).toString("base64"),
  });
}
async function intercept(event) {
  const url = new URL(event.request.url),
    method = event.request.method,
    query = Object.fromEntries(url.searchParams),
    body = event.request.postData ? JSON.parse(event.request.postData) : {};
  if (method === "OPTIONS") return fulfill(event, 204, {});
  calls.push({ url: url.pathname, method, query, body, origin: url.origin });
  let status = 200,
    result = {};
  if (url.pathname === "/v1/auth-sessions/login") {
    const kind = body.email.split("@")[0];
    account = {
      ...normal,
      email: body.email,
      role:
        kind === "merchant" ? "user" : kind === "admin" ? "admin" : "employee",
    };
    if (kind !== "merchant" && kind !== "admin")
      account.features = [
        {
          feature:
            kind === "denied" ? "transactions" : "balance-duplication-errors",
          accessView: kind !== "noview",
        },
      ];
    result = {
      user: account,
      accessToken: "audit-access",
      refreshToken: "audit-refresh",
    };
  } else if (url.pathname === "/v1/users/me") {
    if (!account) status = 401;
    else result = account;
  } else if (url.pathname === "/v1/transactions/balance-errors") {
    if (delayAudit) await sleep(delayAudit);
    if (failAudit) {
      status = 500;
      result = { message: "Unavailable" };
    } else result = emptyAudit ? { users: [] } : report;
  }
  return fulfill(event, status, result);
}
const audits = () =>
  calls.filter((c) => c.url === "/v1/transactions/balance-errors");
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
      { urlPattern: "https://uploads.example.test/*" },
      { urlPattern: "https://checkout.example.test/*" },
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

  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate("/balance-duplication-errors");
  await until(
    "location.pathname==='/sign-in' && !!document.querySelector('input[name=email]')",
    "guest audit protection",
  );
  assert.equal(audits().length, 0);
  pass("Guests cannot open the balance audit or issue audit reads");
  await login("merchant@example.test");
  await until("location.pathname==='/home'", "merchant");
  await navigate("/balance-duplication-errors");
  await until(
    "location.pathname==='/home'||location.pathname.includes('/error/')",
    "merchant audit denied",
  );
  assert.equal(audits().length, 0);
  pass("Merchants cannot read cross-account balance diagnostics");
  for (const route of [
    "/store-authentication",
    "/store-integration",
    "/new-store",
  ]) {
    await navigate(route);
    await until("location.pathname==='/error/404'", "removed route: " + route);
  }
  pass("Removed store routes resolve to not found for authenticated merchants");
  await reset("/home");
  await until("location.pathname==='/sign-in'", "guest home denied");
  await login("denied@example.test");
  await until("location.pathname==='/home'", "unrelated staff");
  await navigate("/balance-duplication-errors");
  await until(
    "location.pathname==='/home'||location.pathname.includes('/error/')",
    "staff grant denied",
  );
  assert.equal(audits().length, 0);
  pass("Wallet view alone cannot grant the balance audit");
  await login("noview@example.test");
  await until("location.pathname==='/home'", "no view");
  await navigate("/balance-duplication-errors");
  await until(
    "location.pathname==='/home'||location.pathname.includes('/error/')",
    "explicit view denied",
  );
  assert.equal(audits().length, 0);
  pass("An existing audit permission without view cannot fetch data");
  await login("viewer@example.test");
  await until("location.pathname==='/home'", "viewer");
  const audit = async () => {
    await navigate("/balance-duplication-errors");
    await until(exists("[data-testid=balance-errors-table]"), "audit form");
  };
  await audit();
  assert.equal(audits().length, 0);
  assert(
    (await evaluate("document.body.innerText")).includes("Choose a date range"),
  );
  pass("Authorized audit is manual and does not fetch before search");
  await fillField("dateFrom", "");
  await click("[data-testid=search-balance-errors]");
  await until(
    "document.body.innerText.includes('Required field')",
    "empty date",
  );
  assert.equal(audits().length, 0);
  pass("Blank dates cannot produce an unbounded audit query");
  await fillField("dateFrom", "2026-10-26");
  await fillField("dateTo", "2026-10-01");
  await click("[data-testid=search-balance-errors]");
  await until(
    "document.body.innerText.includes('end date must be')",
    "reversed dates",
  );
  assert.equal(audits().length, 0);
  pass("Reversed dates fail validation without a backend request");
  const search = async (from = "2026-10-01", to = "2026-10-26") => {
    await fillField("dateFrom", from);
    await fillField("dateTo", to);
    await click("[data-testid=search-balance-errors]");
  };
  await search();
  await until(exists("[role=row][data-id=balance-0-0-0]"), "audit results");
  assert.deepEqual(audits().at(-1).query, {
    dateFrom: "01/10/2026",
    dateTo: "26/10/2026",
  });
  assert(!audits().at(-1).origin.includes("ghaya"));
  pass("Search uses configured backend and original day/month/year contract");
  assert.equal(
    await evaluate(
      "document.querySelectorAll('[role=row][data-id=balance-0-0-0],[role=row][data-id=balance-0-0-1]').length",
    ),
    2,
  );
  assert(
    (await evaluate("document.body.innerText")).includes("Transactions (16)"),
  );
  pass("Repeated backend IDs remain separate diagnostic occurrences");
  assert(
    (
      await evaluate(
        "document.querySelector('[role=row][data-id=balance-0-0-2]').innerText",
      )
    ).includes("-25.00"),
  );
  assert(
    (
      await evaluate(
        "document.querySelector('[role=row][data-id=balance-0-0-0]').innerText",
      )
    ).includes("0.00"),
  );
  pass("Signed and zero amounts remain visible");
  const countBeforePage = audits().length;
  await click('button[aria-label="Go to next page"]');
  await until(exists("[role=row][data-id=balance-1-0-0]"), "last page");
  assert.equal(audits().length, countBeforePage);
  assert(
    (await evaluate("document.body.innerText")).includes("owner2@example.test"),
  );
  pass(
    "All nested groups remain accessible through local pagination and parent-account fallback",
  );
  await click('button[aria-label="Go to previous page"]');
  await until(exists("[data-testid=view-balance-0-0-0]"), "first page");
  await click("[data-testid=view-balance-0-0-0]");
  await until(exists("[role=dialog]"), "details");
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=balance-detail-TRANSACTION_NUMBER]').textContent",
    ),
    "TX-001",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=balance-detail-TITLE]').textContent",
    ),
    "English title",
  );
  assert(
    (
      await evaluate(
        "document.querySelector('[data-testid=balance-detail-NOTES]').textContent",
      )
    ).includes("<img"),
  );
  assert.equal(
    await evaluate(
      "Boolean(window.__auditInjected)||document.querySelectorAll('[role=dialog] img').length>0",
    ),
    false,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=balance-detail-REFERENCE]').textContent",
    ),
    "REFERENCE-ONE",
  );
  pass(
    "Read-only details retain raw number, localized text, reference and escaped notes",
  );
  for (const name of ["AMOUNT", "PREVIOUS_BALANCE", "CURRENT_BALANCE"])
    assert(
      (
        await evaluate(
          `document.querySelector('[data-testid=balance-detail-${name}]').textContent`,
        )
      ).includes("0.00"),
    );
  pass(
    "Zero previous/current balances are not replaced by missing-value fallbacks",
  );
  await clickText("Close", "[role=dialog] button");
  await click("[data-testid=view-balance-0-0-2]");
  await until(exists("[role=dialog]"), "raw id detail");
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=balance-detail-TRANSACTION_NUMBER]').textContent",
    ),
    "raw-only",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=balance-detail-DATE]').textContent",
    ),
    "N/A",
  );
  await clickText("Close", "[role=dialog] button");
  pass("Historical _id and invalid timestamps render safely in details");
  await fillField("dateFrom", "2026-09-01");
  assert.equal(audits().length, countBeforePage);
  assert(
    (
      await evaluate(
        "document.querySelector('[data-testid=balance-result-range]').textContent",
      )
    ).includes("01/10/2026"),
  );
  pass("Editing filters does not relabel or refetch the displayed result");
  failAudit = true;
  await click("[data-testid=search-balance-errors]");
  await until(
    "document.body.innerText.includes('previous successful results')",
    "read failure",
  );
  assert(await evaluate(exists("[role=row][data-id=balance-0-0-0]")));
  await fillField("dateFrom", "2026-08-01");
  failAudit = false;
  await clickText("Retry");
  await until(
    "document.querySelector('[data-testid=balance-result-range]')?.textContent.includes('01/09/2026')",
    "retry snapshot",
  );
  assert.equal(audits().at(-1).query.dateFrom, "01/09/2026");
  pass(
    "Failed searches preserve results and retry the failed snapshot despite later draft changes",
  );
  const beforeRepeat = audits().length;
  delayAudit = 350;
  await search("2026-09-01", "2026-10-26");
  await click("[data-testid=search-balance-errors]");
  await until(
    "!document.querySelector('[data-testid=search-balance-errors]').disabled",
    "repeat completed",
  );
  delayAudit = 0;
  assert.equal(audits().length, beforeRepeat + 1);
  pass(
    "Repeated range searches refresh once and guard rapid duplicate submission",
  );
  emptyAudit = true;
  await search("2026-07-01", "2026-07-02");
  await until(
    "document.body.innerText.includes('No errors found')",
    "empty report",
  );
  assert.equal(
    await evaluate("document.querySelectorAll('[role=row][data-id]').length"),
    0,
  );
  pass("Successful empty reports clear old rows and show their own date range");
  emptyAudit = false;
  await audit();
  failAudit = true;
  await search();
  await until(
    "document.body.innerText.includes('Unable to load balance errors')",
    "initial failure",
  );
  assert(
    !(await evaluate("document.body.innerText")).includes("No errors found"),
  );
  failAudit = false;
  await clickText("Retry");
  await until(exists("[role=row][data-id=balance-0-0-0]"), "initial recovery");
  pass(
    "Initial read failures remain distinct from an empty audit and expose retry",
  );
  await screenshot("balance-errors-en-desktop");
  assert(audits().every((c) => c.method === "GET"));
  assert(
    !calls.some(
      (c) =>
        /transactions|users\/[^m]/.test(c.url) &&
        ["PATCH", "DELETE"].includes(c.method),
    ),
  );
  pass("Audit inspection never submits a monetary mutation");
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
  await audit();
  await search();
  await until(exists("[data-testid=view-balance-0-0-0]"), "mobile report");
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  assert(
    await evaluate(
      "[...document.querySelectorAll('input[type=date]')].every(i=>i.getBoundingClientRect().right<=innerWidth)",
    ),
  );
  await screenshot("balance-errors-ar-mobile");
  await click("[data-testid=view-balance-0-0-0]");
  await until(exists("[role=dialog]"), "mobile detail");
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=balance-detail-TITLE]').textContent",
    ),
    "عنوان عربي",
  );
  assert(
    await evaluate(
      "document.querySelector('[role=dialog]').getBoundingClientRect().right<=innerWidth",
    ),
  );
  await screenshot("balance-detail-ar-mobile");
  pass(
    "Arabic audit filters and read-only details fit the mobile viewport with RTL",
  );
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks: passed, exceptions, calls }, null, 2),
  );
  console.log(
    `${passed}/${passed} services/balance browser checks passed; no uncaught exceptions.`,
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
