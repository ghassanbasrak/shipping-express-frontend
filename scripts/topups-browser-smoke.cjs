// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/topups-browser");
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
  failCreate = false,
  failRecreate = false,
  failCheck = false,
  failCallback = false,
  failProvider = false,
  failRefresh = false,
  checkoutKind = "invalid",
  checkOutcome = "pending";
let provider = {
  CustomerReference: "pay-5",
  InvoiceStatus: "Paid",
  InvoiceId: 123,
  InvoiceTransactions: [],
};
const users = [
  {
    ...normal,
    id: "merchant-1",
    firstName: "Account",
    lastName: "One",
    balance: 250,
  },
  {
    ...normal,
    id: "merchant-2",
    firstName: "Account",
    lastName: "Two",
    balance: 100,
  },
];
const records = Array.from({ length: 15 }, (_, i) => ({
  id: "pay-" + (i + 1),
  userId: i % 2 ? "merchant-2" : "merchant-1",
  user: users[i % 2],
  status: i === 2 ? "success" : i === 3 ? "failed" : "pending",
  amount: 100,
  total: 115,
  taxTotal: 15,
  feeTotal: 0,
  reference: i === 3 ? "800.100.152" : "reference-" + (i + 1),
  responseStatus: i === 3 ? "D" : undefined,
  code: i === 3 ? "316" : undefined,
  paymentMethodType: "VISA",
  notes: i === 14 ? "Topup & # special" : "Note " + (i + 1),
  transactionId: "gateway-" + (i + 1),
  platform: "web",
  zohoCreditId: "credit-" + (i + 1),
  createdAt: "2026-10-01T12:00:00Z",
  updatedAt: "2026-10-23T12:00:00Z",
}));
records[0].isPlan = true;
records[0].paymentPlanId = "stored-plan";
records[0].paymentPlan = { id: "stored-plan", name: "Stored plan" };
records[1].paymentMethodType = "unknown";
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
async function intercept(event) {
  const req = event.request,
    url = new URL(req.url),
    method = req.method;
  if (method === "OPTIONS") return fulfill(event, 204, "");
  if (url.hostname === "checkout.example.test") {
    assert.equal(req.headers.Authorization, undefined);
    calls.push({
      url: "hosted-checkout",
      method,
      query: Object.fromEntries(url.searchParams),
    });
    return fulfill(
      event,
      200,
      "<!doctype html><title>Hosted payment fixture</title><p>Hosted payment fixture</p>",
      "text/html",
    );
  }
  if (!url.pathname.includes("/v1/"))
    return send("Fetch.continueRequest", { requestId: event.requestId });
  const query = Object.fromEntries(url.searchParams),
    body = JSON.parse(req.postData || "{}");
  calls.push({ url: url.pathname, method, query, body });
  let result = {},
    status = 200;
  if (url.pathname.endsWith("/auth-sessions/login")) {
    const merchant = body.email.startsWith("merchant"),
      viewer = body.email.startsWith("viewer"),
      denied = body.email.startsWith("denied"),
      editor = body.email.startsWith("editor");
    account = {
      ...normal,
      id: merchant ? "merchant-1" : "staff-1",
      role: merchant
        ? "user"
        : viewer || denied || editor
          ? "employee"
          : "admin",
      balance: 250,
    };
    if (viewer || denied || editor)
      account.features = [
        { feature: "payments", accessView: !denied },
        ...(editor
          ? [
              { feature: "merchants", accessUpdate: true },
              { feature: "transactions", accessView: true, accessCreate: true },
            ]
          : []),
      ];
    result = {
      user: account,
      accessToken: "topup-access",
      refreshToken: "topup-refresh",
    };
  } else if (url.pathname === "/v1/users/me") {
    if (failRefresh) {
      status = 500;
      result = { message: "refresh failed" };
    } else result = account || normal;
  } else if (url.pathname === "/v1/users") {
    const list = users.filter(
      (x) =>
        !query.search ||
        JSON.stringify(x).toLowerCase().includes(query.search.toLowerCase()),
    );
    result = { results: list, total: list.length };
  } else if (url.pathname.startsWith("/v1/users/"))
    result = users.find((x) => x.id === url.pathname.split("/").at(-1)) || {
      id: "staff-1",
      firstName: "Staff",
      lastName: "Reviewer",
    };
  else if (url.pathname === "/v1/payments/paytabs") {
    assert.equal(body.userId, account.id);
    assert.equal(body.isPlan, false);
    if (failCreate) {
      status = 500;
      result = { message: "create failed" };
    } else {
      const id = "created-" + (records.length + 1);
      records.push({
        ...body,
        id,
        status: "pending",
        user: users[0],
        createdAt: "2026-10-25T12:00:00Z",
      });
      result = {
        _id: id,
        link:
          checkoutKind === "valid"
            ? "https://checkout.example.test/pay?id=" + id
            : checkoutKind === "missing"
              ? undefined
              : "javascript:window.__badCheckout=true",
      };
    }
  } else if (url.pathname === "/v1/payments/payment-status") {
    if (failProvider) {
      status = 500;
      result = { message: "provider failed" };
    } else result = { Data: provider };
  } else if (url.pathname === "/v1/payments") {
    if (failList) {
      status = 500;
      result = { message: "list failed" };
    } else {
      const list = records.filter(
        (x) =>
          (account.role !== "user" || x.userId === account.id) &&
          (!query.userId || x.userId === query.userId) &&
          (!query.status || x.status === query.status) &&
          (!query.search ||
            JSON.stringify(x)
              .toLowerCase()
              .includes(query.search.toLowerCase())),
      );
      result = {
        results: list.slice(
          Number(query.page) * Number(query.pageSize),
          (Number(query.page) + 1) * Number(query.pageSize),
        ),
        total: list.length,
      };
    }
  } else if (url.pathname.startsWith("/v1/payments/")) {
    const parts = url.pathname.split("/"),
      id = parts[3],
      row = records.find((x) => x.id === id);
    if (!row) {
      status = 404;
      result = { message: "missing payment" };
    } else if (url.pathname.endsWith("/recreate-checkout")) {
      assert.equal(row.userId, account.id);
      if (failRecreate) {
        status = 500;
        result = { message: "recreate failed" };
      } else
        result = {
          id,
          link:
            checkoutKind === "valid"
              ? "https://checkout.example.test/pay?id=" + id
              : undefined,
        };
    } else if (url.pathname.endsWith("/check-status")) {
      assert.equal(row.userId, account.id);
      if (failCheck) {
        status = 500;
        result = { message: "check failed" };
      } else {
        Object.assign(row, {
          status: checkOutcome,
          responseStatus: checkOutcome === "failed" ? "D" : undefined,
          code: checkOutcome === "failed" ? "316" : undefined,
        });
        result = row;
      }
    } else if (method === "PATCH") {
      if (failCallback) {
        status = 500;
        result = { message: "confirmation failed" };
      } else {
        Object.assign(row, body);
        result = row;
      }
    } else result = row;
  } else if (url.pathname === "/v1/logs")
    result = {
      results: [
        {
          id: "log-1",
          message: "Payment event",
          modelName: "payment",
          meta: { data: { reference: "REF" } },
        },
      ],
      total: 1,
    };
  else if (url.pathname === "/v1/transactions")
    result = { results: [], total: 0 };
  else {
    status = 404;
    result = { message: "Unexpected fixture " + url.pathname };
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
async function exportAll(kind, scope) {
  const started = Date.now();
  const before = calls.filter(
    (x) => x.url === "/v1/payments" && x.query.pageSize === "500000",
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
    (x) => x.url === "/v1/payments" && x.query.pageSize === "500000",
  );
  assert.equal(list.length, before + 1);

  for (const [key, value] of Object.entries(scope))
    assert.equal(list.at(-1).query[key], value);
}

async function rowAction(id, label) {
  await until(exists(`[role=row][data-id=${id}]`), "row " + id);
  const visible = await evaluate(
    `(()=>{const row=document.querySelector('[role=row][data-id=${id}]');return [...row.querySelectorAll('button')].some(x=>x.textContent.trim()===${JSON.stringify(label)})})()`,
  );
  if (visible) await clickText(label, `[role=row][data-id=${id}] button`);
  else {
    await click(`[role=row][data-id=${id}] button[aria-label=More]`);
    await until(exists("[role=menu]"), "action menu");
    await clickText(label, "[role=menu] [role=button]");
  }
  await until(exists("[role=dialog]"), "row action dialog");
}
async function escape() {
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
async function list(scope = "all") {
  await navigate("/topup-requests/" + scope);
  await until(
    exists("[data-testid=topup-requests-table]"),
    "bank transfer list",
  );
  await until(
    "Boolean(document.querySelector('[role=row][data-id]')) || document.body.innerText.includes('There are no topup requests')",
    "rows or empty list",
  );
}
async function bank(value) {
  await evaluate(
    "document.querySelector('[role=dialog] div[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))",
  );
  await until(exists(`[role=option][data-value=${value}]`), "bank options");
  await click(`[role=option][data-value=${value}]`);
}
const patches = () => calls.filter((x) => x.method === "PATCH");

async function detail(id = "new", owner = "all") {
  await navigate("/topup-requests/" + owner + "/" + id);
  await until(exists("input[name=amount]"), "top-up detail");
}
async function upload() {
  const file = path.join(output, "receipt.png");
  fs.writeFileSync(
    file,
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l2QAAAAASUVORK5CYII=",
      "base64",
    ),
  );
  const dom = await send("DOM.getDocument"),
    files = await send("DOM.querySelectorAll", {
      nodeId: dom.root.nodeId,
      selector: "[role=dialog] input[type=file]",
    });
  assert.equal(files.nodeIds.length, 1);
  await send("DOM.setFileInputFiles", {
    nodeId: files.nodeIds[0],
    files: [file],
  });
}

async function untilCall(predicate, label) {
  for (let i = 0; i < 150; i++) {
    if (predicate()) return;
    await sleep(100);
  }
  throw new Error("Timed out: " + label);
}

const creates = () => calls.filter((x) => x.url === "/v1/payments/paytabs");
const recreates = () =>
  calls.filter((x) => x.url.endsWith("/recreate-checkout"));
const checks = () => calls.filter((x) => x.url.endsWith("/check-status"));
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

  await reset("/topup-requests/all");
  await until("location.pathname==='/sign-in'", "guest");
  pass("Guests must sign in before reading top-ups");
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin");
  await list();
  assert.equal(
    await evaluate("document.querySelectorAll('[role=row][data-id]').length"),
    10,
  );
  assert((await evaluate("document.body.innerText")).includes("credit-1"));
  assert(
    !(await evaluate("document.body.innerText")).includes(
      "Convert To Confirmed",
    ),
  );
  assert(
    (
      await evaluate(
        "document.querySelector('[role=row][data-id=pay-1]').innerText",
      )
    ).includes("Stored plan"),
  );
  assert(
    !(await evaluate(
      "Boolean(document.querySelector('[role=row][data-id=pay-2] img[src*=product-image-placeholder]'))",
    )),
  );
  await screenshot("topups-en-desktop");
  pass(
    "Staff list preserves gateway/accounting metadata and keeps inactive manual confirmation unexposed",
  );
  await click('button[aria-label="Go to next page"]');
  await until(exists("[role=row][data-id=pay-11]"), "page two");
  await fillSelector(
    "[data-testid=topup-requests-search]",
    "Topup & # special",
  );
  await until(exists("[role=row][data-id=pay-15]"), "encoded search");
  assert.equal(
    calls.filter((x) => x.url === "/v1/payments").at(-1).query.page,
    "0",
  );
  pass("Server pagination and encoded search preserve original query scopes");
  await navigate("/topup-requests/merchant-2");
  await until(exists("[role=row][data-id=pay-2]"), "account scope");
  await setStatusFilter("topup-requests", "failed");
  await until(exists("[role=row][data-id=pay-4]"), "failed filter");
  await exportAll(null, { userId: "merchant-2", status: "failed" });
  pass("Account/status filtered export downloads a matching Excel workbook");
  failList = true;
  await navigate("/topup-requests/all");
  await until(
    "document.body.innerText.includes('Could not load top-up requests')",
    "failed list",
  );
  failList = false;
  await clickText("Retry");
  await until(exists("[role=row][data-id=pay-1]"), "list retry");
  pass("Failed payment list reads expose a working retry");
  await login("editor@example.test");
  await until("location.pathname==='/home'", "editor");
  await navigate("/topup-requests/merchant-1");
  await until(exists("[data-testid=adjust-topup-balance]"), "adjust button");
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=adjust-topup-balance]').getAttribute('href')",
    ),
    "/transactions/merchant-1/all/new",
  );
  pass("Authorized staff adjustments use the migrated ledger creation route");
  await login("viewer@example.test");
  await until("location.pathname==='/home'", "viewer");
  await list();
  assert(!(await evaluate(exists("[data-testid=adjust-topup-balance]"))));
  assert.equal(
    await evaluate(
      "document.querySelectorAll('[data-testid^=recreate-]').length",
    ),
    0,
  );
  await navigate("/topup-requests/all/new");
  await until(
    "location.pathname==='/home' || location.pathname.includes('403')",
    "staff create denied",
  );
  pass(
    "Payment viewers have read-only lists and cannot create merchant checkouts",
  );
  await login("denied@example.test");
  await until("location.pathname==='/home'", "denied");
  let start = calls.length;
  await navigate("/topup-requests/all");
  await until(
    "location.pathname.includes('403') || location.pathname==='/home'",
    "view denied",
  );
  assert(!calls.slice(start).some((x) => x.url === "/v1/payments"));
  pass("Missing payments view grant blocks API reads");
  await login("merchant@example.test");
  await until("location.pathname==='/home'", "merchant");
  await list("foreign");
  assert(!calls.filter((x) => x.url === "/v1/payments").at(-1).query.userId);
  assert(!(await evaluate(exists("[role=row][data-id=pay-2]"))));
  pass(
    "Merchant list ignores route owner overrides and relies on current-account backend scope",
  );
  await detail();
  await fillField("amount", "99");
  let n = creates().length;
  await click("[data-testid=create-topup]");
  await until(
    "Boolean(document.querySelector('.Mui-error'))",
    "minimum validation",
  );
  assert.equal(creates().length, n);
  await fillField("amount", "115");
  assert(
    (
      await evaluate(
        "document.querySelector('[data-testid=topup-net]').textContent",
      )
    ).includes("100"),
  );
  pass(
    "Minimum amount validation and inclusive 15-percent wallet preview match the source",
  );
  failCreate = true;
  await click("[data-testid=create-topup]");
  await untilCall(() => creates().length === n + 1, "failed creation");
  await until(
    "document.body.innerText.includes('Could not create the checkout')",
    "creation error",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=amount]').value"),
    "115",
  );
  failCreate = false;
  await click("[data-testid=create-topup]");
  await until(
    "document.body.innerText.includes('payment link is unavailable')",
    "invalid link",
  );
  assert.deepEqual(creates().at(-1).body, {
    amount: 100,
    total: 115,
    feeTotal: 0,
    taxTotal: 15,
    isPlan: false,
    userId: "merchant-1",
  });
  assert.equal(await evaluate("Boolean(window.__badCheckout)"), false);
  assert(
    await evaluate(
      "document.querySelector('[data-testid=create-topup]').disabled",
    ),
  );
  pass(
    "Creation retry preserves amount, fixes ownership and does not execute an invalid gateway link",
  );
  const savedId = records.at(-1).id;
  failRecreate = true;
  await click("[data-testid=retry-checkout]");
  await untilCall(
    () => recreates().some((x) => x.url.includes(savedId)),
    "failed recreate",
  );
  await until(
    "!document.querySelector('[data-testid=retry-checkout]').disabled",
    "recreate retry available",
  );
  assert.equal(creates().length, n + 2);
  failRecreate = false;
  checkoutKind = "valid";
  await click("[data-testid=retry-checkout]");
  await until(
    "document.body.innerText.includes('Hosted payment fixture')",
    "hosted redirect",
  );
  assert.equal(creates().length, n + 2);
  assert(recreates().at(-1).url.includes(savedId));
  pass(
    "Saved checkout identity survives redirect/recreation failure and retry never creates a second top-up",
  );
  await list();
  checkoutKind = "missing";
  failRecreate = true;
  await click("[data-testid=recreate-pay-1]");
  await untilCall(
    () => recreates().at(-1)?.url === "/v1/payments/pay-1/recreate-checkout",
    "list recreate failed",
  );
  await until(
    "document.body.innerText.includes('Could not recreate checkout')",
    "list recreate error",
  );
  failRecreate = false;
  checkoutKind = "valid";
  await click("[data-testid=recreate-pay-1]");
  await until(
    "document.body.innerText.includes('Hosted payment fixture')",
    "list hosted checkout",
  );
  pass(
    "Merchant list recreation fetches current payment state and retries failures at the original payment ID",
  );
  await list();
  records[0].status = "success";
  n = recreates().length;
  await click("[data-testid=recreate-pay-1]");
  await until(
    "document.body.innerText.includes('Could not recreate checkout')",
    "stale success guard",
  );
  assert.equal(recreates().length, n);
  records[0].status = "pending";
  pass(
    "Fresh payment status prevents recreating an already successful checkout",
  );
  checkOutcome = "pending";
  await navigate("/topup-requests/all/pay-1");
  await until(exists("[data-testid=topup-result]"), "pending result");
  assert(
    (await evaluate("document.body.innerText")).includes("Payment is pending"),
  );
  assert.deepEqual(checks().at(-1).body, {});
  pass(
    "Pending result checks use the PayTabs empty-body contract without an undefined checkout path",
  );
  failCheck = true;
  await navigate("/topup-requests/all/pay-7");
  await until(
    "Boolean([...document.querySelectorAll('button')].find(x=>x.textContent==='Retry'))",
    "failed status read",
  );
  failCheck = false;
  checkOutcome = "success";
  failRefresh = true;
  await clickText("Retry");
  await until(
    "document.body.innerText.includes('Payment done')",
    "paid result",
  );
  await sleep(200);
  failRefresh = false;
  pass(
    "Failed verification retries and successful result survives account refresh failure",
  );
  checkOutcome = "failed";
  await navigate(
    "/topup-requests/all/pay-9?resourcePath=%2Fv1%2Fcheckouts%2Flegacy%2Fpayment",
  );
  await until(exists("[data-testid=topup-result]"), "legacy path result");
  assert.equal(
    checks().at(-1).body.resourcePath,
    "/v1/checkouts/legacy/payment",
  );
  assert(
    (await evaluate("document.body.innerText")).toLowerCase().includes("fund"),
  );
  pass(
    "Stored failed payments preserve resourcePath and localized gateway error descriptions",
  );
  n = checks().length;
  await navigate("/topup-requests/all/pay-2");
  await until(
    "document.body.innerText.includes('No such topup request')",
    "foreign payment",
  );
  assert.equal(checks().length, n);
  pass(
    "Foreign merchant payment details are rejected before gateway status mutations",
  );
  n = checks().length;
  await navigate("/topup-requests/all/pay-3");
  await until(exists("[data-testid=topup-result]"), "paid replay");
  assert.equal(checks().length, n);
  assert.equal(
    await evaluate(
      "document.querySelectorAll('[data-testid=recreate-pay-3]').length",
    ),
    0,
  );
  pass("Successful stored payments are read-only and are not reconfirmed");
  start = calls.length;
  await navigate("/payment/merchant-1/pay-5/success");
  await until(
    "document.body.innerText.includes('provided data is invalid')",
    "invalid callback",
  );
  assert(!calls.slice(start).some((x) => x.url.startsWith("/v1/payments")));
  pass("Missing callback identifiers fail before any payment API request");
  start = calls.length;
  await navigate("/payment/foreign/pay-5/success?paymentId=provider-id");
  await until(
    "document.body.innerText.includes('related to other user')",
    "route owner",
  );
  assert(!calls.slice(start).some((x) => x.url.startsWith("/v1/payments")));
  pass("Callback route ownership is checked before reading a payment");
  start = calls.length;
  await navigate("/payment/merchant-1/pay-2/success?paymentId=provider-id");
  await until(exists("[data-testid=retry-callback]"), "stored owner");
  assert(
    !calls.slice(start).some((x) => x.url === "/v1/payments/payment-status"),
  );
  pass("Callback rejects a foreign stored owner before provider verification");
  provider.CustomerReference = "mismatch";
  n = patches().length;
  await navigate("/payment/merchant-1/pay-5/success?paymentId=provider-id");
  await until(exists("[data-testid=retry-callback]"), "reference mismatch");
  assert.equal(patches().length, n);
  pass("Mismatched gateway customer reference never confirms a payment");
  provider = {
    CustomerReference: "pay-5",
    InvoiceStatus: "Canceled",
    InvoiceId: 123,
    InvoiceTransactions: [{ ErrorCode: "MF004" }],
  };
  await click("[data-testid=retry-callback]");
  await untilCall(
    () => patches().length === n + 1,
    "failed provider persisted",
  );
  await until(
    "document.body.innerText.includes('Insufficient funds')",
    "gateway failure",
  );
  assert.equal(patches().at(-1).body.status, "failed");
  assert(
    !(await evaluate("document.body.innerText")).includes(
      "Payment done successfully",
    ),
  );
  pass("A success URL cannot override a verified failed gateway result");
  provider = {
    CustomerReference: "pay-5",
    InvoiceStatus: "Paid",
    InvoiceId: 123,
    InvoiceTransactions: [],
  };
  failCallback = true;
  n = patches().length;
  await click("[data-testid=retry-callback]");
  await untilCall(() => patches().length === n + 1, "confirmation failure");
  await until(exists("[data-testid=retry-callback]"), "confirmation retry");
  failCallback = false;
  await click("[data-testid=retry-callback]");
  await until(
    "document.body.innerText.includes('Payment done successfully')",
    "verified paid",
  );
  assert.deepEqual(patches().at(-1).body, {
    transactionId: "provider-id",
    status: "success",
    reference: "123",
  });
  pass(
    "Failed confirmation retries provider verification and writes only verified transaction/status/reference",
  );
  n = patches().length;
  await navigate("/payment/merchant-1/pay-5/error?paymentId=provider-id");
  await until(
    "document.body.innerText.includes('Payment done successfully')",
    "callback replay",
  );
  assert.equal(patches().length, n);
  pass(
    "Already confirmed callback replay does not repeat the financial PATCH and ignores the untrusted result label",
  );
  provider.InvoiceStatus = "Pending";
  provider.InvoiceTransactions = [];
  n = patches().length;
  await navigate("/payment/merchant-1/pay-5/success?paymentId=other-attempt");
  await until(
    exists("[data-testid=retry-callback]"),
    "paid record pending provider",
  );
  assert.equal(patches().length, n);
  assert.equal(records[4].status, "success");
  pass("Later pending provider responses cannot downgrade confirmed records");
  provider = {
    CustomerReference: "pay-11",
    InvoiceStatus: "Pending",
    InvoiceId: 124,
    InvoiceTransactions: [],
  };
  await navigate("/payment/merchant-1/pay-11/error?paymentId=pending-provider");
  await until(exists("[data-testid=retry-callback]"), "pending callback");
  assert.equal(patches().at(-1).body.status, "pending");
  pass("Pending callback retains the original pending backend status");
  provider = {
    CustomerReference: "pay-13",
    InvoiceStatus: "Paid",
    InvoiceId: 125,
    InvoiceTransactions: [],
  };
  failProvider = true;
  n = patches().length;
  await navigate("/payment/merchant-1/pay-13/success?paymentId=retry-provider");
  await until(exists("[data-testid=retry-callback]"), "provider failure");
  assert.equal(patches().length, n);
  failProvider = false;
  failRefresh = true;
  await click("[data-testid=retry-callback]");
  await until(
    "document.body.innerText.includes('Payment done successfully')",
    "provider retry success",
  );
  await sleep(200);
  failRefresh = false;
  assert.equal(patches().length, n + 1);
  pass(
    "Provider read failure retries safely and account refresh cannot repeat callback confirmation",
  );
  await navigate("/transactions/all/wallet");
  await until(exists("[data-testid=topup-wallet]"), "ledger topup link");
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=topup-wallet]').getAttribute('href')",
    ),
    "/topup-requests/all/new",
  );
  pass("Merchant ledger top-up link now resolves to its migrated owner");
  await login("viewer@example.test");
  await until("location.pathname==='/home'", "staff callback");
  start = calls.length;
  await navigate("/payment/merchant-1/pay-1/success?paymentId=provider-id");
  await until(
    "location.pathname==='/home' || location.pathname.includes('403')",
    "staff callback denied",
  );
  assert(
    !calls.slice(start).some((x) => x.url === "/v1/payments/payment-status"),
  );
  pass("Legacy callback remains merchant-only");
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin log link");
  await navigate("/logs");
  await until(exists("[role=row][data-id=log-1]"), "log payment link");
  await clickText("View Payment", "[role=row][data-id=log-1] button");
  await until(exists("[data-testid=topup-requests-table]"), "logs destination");
  pass("Logs payment link now resolves to the migrated top-up list");
  await login("merchant@example.test");
  await until("location.pathname==='/home'", "Arabic merchant");
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
  await detail();
  await fillField("amount", "115");
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  await until(
    "!document.querySelector('[data-testid=create-topup]').disabled",
    "Arabic amount ready",
  );
  await screenshot("topup-ar-mobile");
  provider = {
    CustomerReference: "pay-5",
    InvoiceStatus: "Paid",
    InvoiceId: 123,
    InvoiceTransactions: [],
  };
  await navigate("/payment/merchant-1/pay-5/success?paymentId=provider-id");
  await until(
    "Boolean(document.querySelector('[data-testid=payment-callback][data-status=success]'))",
    "Arabic callback",
  );

  const callbackReads = calls.filter(
    (x) => x.url === "/v1/payments/payment-status",
  ).length;
  await sleep(1000);
  assert(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=payment-callback][data-status=success]'))",
    ),
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/payments/payment-status").length,
    callbackReads,
  );
  await screenshot("payment-ar-mobile");
  pass(
    "Arabic mobile top-up form and payment callback retain RTL and branding",
  );
  assert.deepEqual(exceptions, []);
  assert(!calls.some((x) => x.method === "DELETE"));
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks: passed, exceptions, calls }, null, 2),
  );
  console.log(
    `${passed}/${passed} top-up/payment browser checks passed; no uncaught exceptions.`,
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
