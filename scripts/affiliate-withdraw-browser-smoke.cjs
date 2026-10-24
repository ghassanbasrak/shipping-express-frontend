// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/affiliate-withdraw-browser");
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
  failCreate = false,
  failUsers = false,
  failBalance = false,
  failPending = false,
  failRefresh = false,
  failUpload = false,
  holdUpload = false,
  releaseUpload;
const users = [
  {
    ...normal,
    id: "merchant-1",
    firstName: "Account",
    lastName: "One",
    isAffiliate: true,
  },
  {
    ...normal,
    id: "merchant-2",
    firstName: "Account",
    lastName: "Two",
    isAffiliate: true,
  },
  {
    ...normal,
    id: "merchant-3",
    firstName: "New",
    lastName: "Affiliate",
    isAffiliate: true,
  },
];
const records = Array.from({ length: 15 }, (_, i) => ({
  id: "withdraw-" + (i + 1),
  type: "affiliateWithdraw",
  status: i === 2 ? "approved" : i === 3 ? "rejected" : "pending",
  amount: 100 + i,
  userId: i % 2 ? "merchant-2" : "merchant-1",
  user: users[i % 2],
  updatedById: "staff-1",
  updatedBy: { id: "staff-1", firstName: "Staff", lastName: "Reviewer" },
  description: "IBAN account " + (i + 1),
  transactionReference: i === 2 ? "existing-reference" : "",
  transactionDescription: "Receipt " + String(i + 1).padStart(2, "0"),
  bank: i === 2 ? "box" : undefined,
  transactionImageUrl:
    i === 2 ? "https://receipts.example.test/transfer.svg" : undefined,
  createdAt: "2026-10-01T12:00:00Z",
  updatedAt: "2026-10-23T12:00:00Z",
}));
const balances = { "merchant-1": 500, "merchant-2": 200, "merchant-3": 300 };
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
  if (url.hostname === "uploads.example.test") {
    assert.equal(req.headers.Authorization, undefined);
    calls.push({ url: url.pathname, method, upload: true });
    if (holdUpload) await new Promise((resolve) => (releaseUpload = resolve));
    return fulfill(event, failUpload ? 500 : 204, "");
  }
  if (url.hostname === "receipts.example.test")
    return fulfill(
      event,
      200,
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="white"/><text x="20" y="60" font-size="25">Mock affiliate payment receipt</text></svg>',
      "image/svg+xml",
    );
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
      noView = body.email.startsWith("noview"),
      reviewer = body.email.startsWith("reviewer"),
      wrong = body.email.startsWith("wrong"),
      affiliate = body.email.startsWith("affiliate"),
      fresh = body.email.startsWith("fresh"),
      merchant = body.email.startsWith("merchant");
    account = {
      ...normal,
      id: fresh
        ? "merchant-3"
        : affiliate || merchant
          ? "merchant-1"
          : "staff-1",
      role:
        affiliate || fresh || merchant
          ? "user"
          : viewer || denied || noView || reviewer || wrong
            ? "employee"
            : "admin",
      isAffiliate: affiliate || fresh,
    };
    if (viewer || noView || reviewer || wrong)
      account.features = [
        {
          feature: "affiliate-withdraw-requests",
          accessView: !noView,
          accessUpdate: true,
        },
        ...(wrong
          ? []
          : [
              {
                feature: "withdraw-requests",
                accessView: true,
                accessUpdate: !viewer,
              },
            ]),
      ];
    if (denied)
      account.features = [
        { feature: "withdraw-requests", accessView: true, accessUpdate: true },
      ];
    result = {
      user: account,
      accessToken: "affiliate-withdraw-access",
      refreshToken: "affiliate-withdraw-refresh",
    };
  } else if (url.pathname.endsWith("/users/me")) {
    if (failRefresh) {
      status = 500;
      result = { message: "Refresh failed" };
    } else result = account || normal;
  } else if (url.pathname === "/v1/affiliate-transactions/balance") {
    assert.ok(query.affiliateId);
    if (failBalance) {
      status = 500;
      result = { message: "Balance failed" };
    } else result = { balance: balances[query.affiliateId] ?? 0 };
  } else if (url.pathname === "/v1/media/create")
    result = {
      url: "https://uploads.example.test/",
      fields: { key: "receipt.png" },
    };
  else if (url.pathname === "/v1/users") {
    if (query.type === "user") assert.equal(query.isAffiliate, "true");
    const source =
      query.type === "user"
        ? users
        : [
            {
              id: "staff-1",
              role: "admin",
              firstName: "Staff",
              lastName: "Reviewer",
            },
          ];
    const list = query.search
      ? source.filter((x) =>
          JSON.stringify(x).toLowerCase().includes(query.search.toLowerCase()),
        )
      : source;
    result = { results: list, total: list.length };
  } else if (url.pathname.startsWith("/v1/users/")) {
    result = users.find((x) => x.id === url.pathname.split("/").at(-1)) || {
      id: "staff-1",
      firstName: "Staff",
      lastName: "Reviewer",
    };
    if (failUsers) {
      status = 500;
      result = { message: "Account lookup failed" };
    }
  } else if (url.pathname === "/v1/requests") {
    if (method === "POST") {
      if (failCreate) {
        status = 500;
        result = { message: "Create failed" };
      } else {
        assert.equal(body.userId, account.id);
        assert.equal(body.type, "affiliateWithdraw");
        assert.equal(body.status, "pending");
        result = {
          ...body,
          id: "withdraw-" + (records.length + 1),
          user: users.find((x) => x.id === account.id),
          createdAt: "2026-10-23T12:00:00Z",
        };
        records.push(result);
      }
    } else {
      assert.equal(query.type, "affiliateWithdraw");
      if (failList || (failPending && query.pageSize === "1")) {
        status = 500;
        result = { message: "List failed" };
      } else {
        const list = records.filter(
          (x) =>
            (!query.userId || x.userId === query.userId) &&
            (!query.updatedById || x.updatedById === query.updatedById) &&
            (!query.status || x.status === query.status) &&
            (!query.search ||
              JSON.stringify(x)
                .toLowerCase()
                .includes(query.search.toLowerCase())) &&
            (account.role !== "user" || x.userId === account.id),
        );
        result = {
          results: list.slice(
            Number(query.page) * Number(query.pageSize),
            (Number(query.page) + 1) * Number(query.pageSize),
          ),
          total: list.length,
        };
      }
    }
  } else if (url.pathname.startsWith("/v1/requests/")) {
    const id = url.pathname.split("/").at(-1),
      row = records.find((x) => x.id === id);
    if (!row) {
      status = 404;
      result = { message: "Not found" };
    } else if (method === "GET") result = row;
    else {
      assert.equal(method, "PATCH");
      assert.equal(row.status, "pending");
      if (failWrite) {
        status = 500;
        result = { message: "Write failed" };
      } else {
        Object.assign(row, body);
        if (body.status === "approved") balances[row.userId] -= row.amount;
        result = row;
      }
    }
  } else {
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
  await navigate("/affiliate-withdraw-requests/" + scope);
  await until(
    exists("[data-testid=affiliate-withdraw-requests-table]"),
    "bank transfer list",
  );
  await until(
    "Boolean(document.querySelector('[role=row][data-id]')) || document.body.innerText.includes('There are no withdraw requests')",
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
  await navigate("/affiliate-withdraw-requests/" + owner + "/" + id);
  await until(exists("input[name=amount]"), "withdrawal detail");
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
  await reset("/affiliate-withdraw-requests/all");
  await until("location.pathname==='/sign-in'", "guest protection");
  pass("Guests must sign in");
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin");
  await list();
  assert.equal(
    await evaluate("document.querySelectorAll('[role=row][data-id]').length"),
    10,
  );
  assert.ok(
    await evaluate("document.body.innerText.includes('IBAN account 1')"),
  );
  await screenshot("affiliate-withdraw-desktop");
  pass(
    "List preserves reference, amount, request notes, receipt fields and ten-row pagination",
  );
  await click('button[aria-label="Go to next page"]');
  await until(exists("[role=row][data-id=withdraw-11]"), "page two");
  await fillSelector(
    "[data-testid=affiliate-withdraw-requests-search]",
    "No & Match",
  );
  await until(
    "document.body.innerText.includes('There are no withdraw requests')",
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
  await clickText("Reset filters");
  await until(exists("[role=row][data-id=withdraw-1]"), "reset");
  pass(
    "Search and filter changes reset pagination without losing structured search",
  );
  await list("merchant-1?updatedById=staff-1");
  await until(exists("[data-testid=affiliate-balance]"), "selected balance");
  assert.ok(
    await evaluate(
      "document.querySelector('[data-testid=affiliate-balance]').textContent.includes('500')",
    ),
  );
  await setStatusFilter("affiliate-withdraw-requests", "approved");
  await until(exists("[role=row][data-id=withdraw-3]"), "approved filter");
  await exportAll("affiliateWithdraw", {
    userId: "merchant-1",
    updatedById: "staff-1",
    status: "approved",
  });
  pass(
    "Merchant/reviewer/status export downloads a matching Excel workbook and scoped balance",
  );
  await clickText("Reset filters");
  await until(exists("[role=row][data-id=withdraw-1]"), "reset scope");
  await click("[data-testid=affiliate-withdraw-requests-filters]");
  await until(
    exists("[role=menu] .MuiAutocomplete-root input"),
    "merchant filter",
  );
  await fillSelector("[role=menu] .MuiAutocomplete-root input", "Two");
  await until(
    "Boolean([...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes('Account Two')))",
    "options",
  );
  await evaluate(
    "[...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes('Account Two')).click()",
  );
  await escape();
  await until(exists("[role=row][data-id=withdraw-2]"), "scope changed");
  await until(
    "document.querySelector('[data-testid=affiliate-balance]')?.textContent.includes('200')",
    "balance changed",
  );
  assert.ok(
    calls.some((x) => x.url === "/v1/users" && x.query.isAffiliate === "true"),
  );
  await clickText("Reset filters");
  await until(exists("[role=row][data-id=withdraw-1]"), "restore route scope");
  pass(
    "Account selector searches affiliates, updates balance and resets to URL scope",
  );
  await rowAction("withdraw-1", "Accept");
  const beforeCancel = patches().length;
  await closeDialog();
  assert.equal(patches().length, beforeCancel);
  pass("Approval cancellation sends no financial write");
  await rowAction("withdraw-1", "Accept");
  await click("[data-testid=affiliate-withdraw-request-decision-submit]");
  await until(
    "document.querySelector('[role=dialog]')?.innerText.includes('Required field')",
    "bank/reference validation",
  );
  assert.equal(patches().length, beforeCancel);
  await bank("box");
  await fillField("transactionReference", "bank-reference-1");
  await fillField("transactionDescription", "Payment receipt note");
  failUpload = true;
  await upload();
  await until(
    "document.querySelector('[role=dialog]')?.innerText.includes('The request failed')",
    "failed upload",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('input[name=transactionReference]').value",
    ),
    "bank-reference-1",
  );
  failUpload = false;
  holdUpload = true;
  await upload();
  for (let i = 0; i < 100 && !releaseUpload; i++) await sleep(50);
  assert.ok(releaseUpload);
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=affiliate-withdraw-request-decision-submit]').disabled",
    ),
    true,
  );
  holdUpload = false;
  releaseUpload();
  releaseUpload = undefined;
  await until(
    "document.querySelector('input[name=transactionImageUrl]')?.value==='https://uploads.example.test/receipt.png'",
    "receipt uploaded",
  );
  pass(
    "Required approval fields validate; failed upload keeps drafts and active upload blocks submission",
  );
  failWrite = true;
  await click("[data-testid=affiliate-withdraw-request-decision-submit]");
  await until(
    "document.body.innerText.includes('Something went wrong while converting to the confirmed')",
    "failed approval",
  );
  assert.ok(await evaluate(exists("[role=dialog]")));
  assert.equal(
    await evaluate(
      "document.querySelector('input[name=transactionReference]').value",
    ),
    "bank-reference-1",
  );
  failWrite = false;
  await click("[data-testid=affiliate-withdraw-request-decision-submit]");
  await until("!document.querySelector('[role=dialog]')", "approve");
  await until(
    "document.querySelector('[role=row][data-id=withdraw-1]')?.innerText.includes('Confirmed')",
    "approved row",
  );
  assert.deepEqual(patches().at(-1).body, {
    status: "approved",
    bank: "box",
    transactionReference: "bank-reference-1",
    transactionDescription: "Payment receipt note",
    transactionImageUrl: "https://uploads.example.test/receipt.png",
  });
  assert.equal(patches().at(-1).url, "/v1/requests/withdraw-1");
  await until(
    "document.querySelector('[data-testid=affiliate-balance]')?.textContent.includes('400')",
    "post-approval balance",
  );
  pass(
    "Approval retry saves only bank/reference/receipt fields to exact ID and refreshes balance",
  );
  assert.equal(
    await evaluate(
      "[...document.querySelector('[role=row][data-id=withdraw-1]').querySelectorAll('button')].some(x=>['Accept','Refuse'].includes(x.textContent.trim()))",
    ),
    false,
  );
  await rowAction("withdraw-5", "Refuse");
  failWrite = true;
  await click("[data-testid=affiliate-withdraw-request-decision-submit]");
  await until(
    "document.body.innerText.includes('Something went wrong while converting to the refused')",
    "rejection failure",
  );
  failWrite = false;
  await click("[data-testid=affiliate-withdraw-request-decision-submit]");
  await until("!document.querySelector('[role=dialog]')", "reject retry");
  assert.deepEqual(patches().at(-1).body, { status: "rejected" });
  pass(
    "Only pending requests can be reviewed; rejection retries send status only",
  );
  await rowAction("withdraw-3", "Transaction Image");
  await until(
    "document.querySelector('[data-testid=affiliate-withdraw-request-image] img')?.naturalWidth>0",
    "receipt preview",
  );
  const started = Date.now();
  await clickText("Download", "[role=dialog] button");
  let downloaded;
  for (let i = 0; i < 100; i++) {
    downloaded = fs
      .readdirSync(output)
      .filter((x) => x.endsWith(".jpg"))
      .map((x) => path.join(output, x))
      .find((x) => fs.statSync(x).mtimeMs >= started);
    if (downloaded) break;
    await sleep(100);
  }
  assert.ok(downloaded);
  await closeDialog();
  pass("Receipt preview and local download remain available");
  failBalance = true;
  await list("merchant-2");
  await until(
    "document.body.innerText.includes('Unable to load affiliate balance')",
    "balance failure",
  );
  failBalance = false;
  await clickText("Retry");
  await until(
    "document.querySelector('[data-testid=affiliate-balance]')?.textContent.includes('200')",
    "balance retry",
  );
  failList = true;
  await navigate("/affiliate-withdraw-requests/all");
  await until(
    "document.body.innerText.includes('Unable to load affiliate withdrawals')",
    "list failure",
  );
  failList = false;
  await clickText("Retry");
  await until(exists("[role=row][data-id=withdraw-1]"), "list retry");
  pass("List and balance queries recover through retry controls");
  for (const email of ["viewer@example.test", "wrong@example.test"]) {
    await login(email);
    await until("location.pathname==='/home'", "staff view");
    await list();
    assert.equal(
      await evaluate(
        "[...document.querySelectorAll('[role=row][data-id] button')].some(x=>['Accept','Refuse'].includes(x.textContent.trim()))",
      ),
      false,
    );
    await rowAction("withdraw-3", "Transaction Image");
    await closeDialog();
  }
  await login("reviewer@example.test");
  await until("location.pathname==='/home'", "legacy reviewer");
  await list();
  await rowAction("withdraw-2", "Accept");
  await closeDialog();
  await click("[data-testid=affiliate-withdraw-requests-filters]");
  await until(exists("[role=menu]"), "employee filters");
  assert.equal(
    await evaluate(
      "document.querySelector('[role=menu]').innerText.includes('Updated By')",
    ),
    false,
  );
  await escape();
  pass(
    "Legacy withdraw-update permission controls review; view-only and unrelated update grants stay read-only",
  );
  for (const email of [
    "denied@example.test",
    "noview@example.test",
    "merchant@example.test",
  ]) {
    await login(email);
    await until("location.pathname==='/home'", "denied login");
    const before = calls.filter(
      (x) =>
        x.url === "/v1/requests" ||
        x.url === "/v1/affiliate-transactions/balance",
    ).length;
    await navigate("/affiliate-withdraw-requests/all");
    await until(
      "location.pathname==='/home'||document.body.innerText.includes('Unauthorized Access')",
      "denied route",
    );
    assert.equal(
      calls.filter(
        (x) =>
          x.url === "/v1/requests" ||
          x.url === "/v1/affiliate-transactions/balance",
      ).length,
      before,
    );
  }
  pass("Denied staff and non-affiliate merchants cannot query the feature");
  await login("affiliate@example.test");
  await until("location.pathname==='/home'", "affiliate login");
  await list("merchant-2");
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('[role=row][data-id] button')].some(x=>['Accept','Refuse'].includes(x.textContent.trim()))",
    ),
    false,
  );
  assert.equal(
    await evaluate(exists("[data-testid=add-affiliate-withdraw-request]")),
    false,
  );
  assert.equal(
    calls
      .filter((x) => x.url === "/v1/requests" && x.query.pageSize === "10")
      .at(-1).query.userId,
    undefined,
  );
  await detail();
  await until(
    "document.body.innerText.includes('already pending review')",
    "pending guard",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=send-affiliate-withdraw-request]').disabled",
    ),
    true,
  );
  pass(
    "Affiliate lists ignore route ownership, remain read-only and prevent another pending submission",
  );
  await detail("withdraw-1");
  assert.equal(
    await evaluate("document.querySelector('input[name=amount]').disabled"),
    true,
  );
  assert.equal(
    await evaluate(exists("[data-testid=send-affiliate-withdraw-request]")),
    false,
  );
  await navigate("/affiliate-withdraw-requests/all/withdraw-2");
  await until(
    "document.body.innerText.includes('No such withdraw request')",
    "foreign ownership",
  );
  await navigate("/affiliate-withdraw-requests/all/missing");
  await until(
    "document.body.innerText.includes('No such withdraw request')",
    "missing request",
  );
  pass(
    "Existing submissions are read-only; foreign and missing IDs expose an error and back link",
  );
  await login("fresh@example.test");
  await until("location.pathname==='/home'", "new affiliate");
  await list();
  await until(
    exists("[data-testid=add-affiliate-withdraw-request]"),
    "new request action",
  );
  await click("[data-testid=add-affiliate-withdraw-request]");
  await until(exists("input[name=amount]"), "new form");
  await until(
    "!document.querySelector('[data-testid=send-affiliate-withdraw-request]').disabled",
    "balance and pending ready",
  );
  failPending = true;
  await navigate("/affiliate-withdraw-requests/pending-check/new");
  await until(
    "document.body.innerText.includes('Unable to check pending requests')",
    "pending-check failure",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=send-affiliate-withdraw-request]').disabled",
    ),
    true,
  );
  failPending = false;
  await clickText("Retry");
  await until(
    "!document.querySelector('[data-testid=send-affiliate-withdraw-request]').disabled",
    "pending-check retry",
  );
  pass("Pending-check failures disable creation until a successful retry");
  let creates = calls.filter(
    (x) => x.method === "POST" && x.url === "/v1/requests",
  ).length;
  await fillField("amount", "301");
  await click("[data-testid=send-affiliate-withdraw-request]");
  await until(
    "document.body.innerText.includes('Should be less than or equals to')",
    "balance cap",
  );
  assert.equal(
    calls.filter((x) => x.method === "POST" && x.url === "/v1/requests").length,
    creates,
  );
  await fillField("amount", "0");
  await click("[data-testid=send-affiliate-withdraw-request]");
  await until(
    "document.body.innerText.includes('Required field')",
    "positive amount",
  );
  assert.equal(
    calls.filter((x) => x.method === "POST" && x.url === "/v1/requests").length,
    creates,
  );
  pass(
    "Merchant submission rejects zero and over-balance amounts without writes",
  );
  failBalance = true;
  await navigate("/affiliate-withdraw-requests/other/new");
  await until(
    "document.body.innerText.includes('Unable to load affiliate balance')",
    "balance failed draft",
  );
  await fillField("amount", "125");
  await fillField("description", "IBAN new affiliate");
  assert.equal(
    await evaluate("document.querySelector('input[name=amount]').value"),
    "125",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=send-affiliate-withdraw-request]').disabled",
    ),
    true,
  );
  failBalance = false;
  await clickText("Retry");
  await until(
    "!document.body.innerText.includes('Unable to load affiliate balance')",
    "balance recovered draft",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=amount]').value"),
    "125",
  );
  pass(
    "Balance failure disables submission and retry preserves entered amount and banking details",
  );
  failCreate = true;
  await click("[data-testid=send-affiliate-withdraw-request]");
  await until(
    "document.body.innerText.includes('Unable to submit affiliate withdrawal')",
    "create failure",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=amount]').value"),
    "125",
  );
  failCreate = false;
  failRefresh = true;
  await click("[data-testid=send-affiliate-withdraw-request]");
  await until(
    "location.pathname==='/affiliate-withdraw-requests/all'",
    "create accepted",
  );
  await until(
    "document.body.innerText.includes('the account could not be refreshed')",
    "post-submit account refresh failure",
  );
  failRefresh = false;
  assert.equal(records.filter((x) => x.userId === "merchant-3").length, 1);
  const created = calls
    .filter((x) => x.method === "POST" && x.url === "/v1/requests")
    .at(-1);
  assert.deepEqual(created.body, {
    amount: 125,
    description: "IBAN new affiliate",
    userId: "merchant-3",
    type: "affiliateWithdraw",
    status: "pending",
  });
  await until(exists("[role=row][data-id=withdraw-16]"), "created row");
  pass(
    "Failed creation retains drafts; retry fixes current owner/type/status and account-refresh failure never repeats creation",
  );
  records.find((x) => x.id === "withdraw-16").status = "approved";
  balances["merchant-3"] = 0;
  await detail();
  await until(
    "document.querySelector('[data-testid=affiliate-balance]')?.textContent.includes('0')",
    "zero balance",
  );
  await fillField("amount", "1");
  creates = calls.filter(
    (x) => x.method === "POST" && x.url === "/v1/requests",
  ).length;
  await click("[data-testid=send-affiliate-withdraw-request]");
  await until(
    "document.body.innerText.includes('A positive available balance is required')",
    "zero balance validation",
  );
  assert.equal(
    calls.filter((x) => x.method === "POST" && x.url === "/v1/requests").length,
    creates,
  );
  pass("Zero balance stays visible and cannot produce a withdrawal");
  await login("admin@example.test");
  await until("location.pathname==='/home'", "mobile admin");
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
  await list();
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  await screenshot("affiliate-withdraw-ar-mobile");
  await rowAction("withdraw-2", "قبول");
  await until(exists("[role=dialog]"), "mobile approval");
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  await screenshot("affiliate-withdraw-approval-ar-mobile");
  await closeDialog();
  pass("Arabic mobile list and approval fit the viewport with RTL direction");
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks: passed, exceptions, calls }, null, 2),
  );
  console.log(
    `${passed}/${passed} affiliate withdrawal browser checks passed; no uncaught exceptions.`,
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
