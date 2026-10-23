// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/bank-transfers-browser");
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
  failUsers = false,
  failDownload = false;
const users = [
  { ...normal, id: "merchant-1", firstName: "Account", lastName: "One" },
  { ...normal, id: "merchant-2", firstName: "Account", lastName: "Two" },
];
const records = Array.from({ length: 15 }, (_, i) => ({
  id: "transfer-" + (i + 1),
  type: "bankTransfer",
  status: i === 2 ? "approved" : i === 3 ? "rejected" : "pending",
  amount: 100 + i,
  userId: i % 2 ? "merchant-2" : "merchant-1",
  user: users[i % 2],
  updatedById: "staff-1",
  updatedBy: { id: "staff-1", firstName: "Staff", lastName: "Reviewer" },
  paymentPlanId: "plan-1",
  paymentPlan: { id: "plan-1", name: "Business Plan" },
  transactionReference: "Bank receipt " + (i + 1),
  transactionDescription: "Receipt " + String(i + 1).padStart(2, "0"),
  notes: i === 3 ? "Original reason" : "",
  bank: i === 2 ? "box" : undefined,
  transactionImageUrl:
    i === 4 ? undefined : "https://receipts.example.test/transfer.svg",
  createdAt: "2026-10-01T12:00:00Z",
  updatedAt: "2026-10-23T12:00:00Z",
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
  if (url.hostname === "receipts.example.test") {
    calls.push({ url: url.pathname, method, receipt: true });
    return fulfill(
      event,
      failDownload ? 500 : 200,
      failDownload
        ? "failed"
        : '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="white"/><text x="40" y="70" fill="black" font-size="28">Ashamco - Bank Receipt</text><text x="40" y="130" fill="black" font-size="22">Mock transfer: 100 SAR</text></svg>',
      "image/svg+xml",
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
    const viewer = body.email.startsWith("viewer"),
      denied = body.email.startsWith("denied"),
      noView = body.email.startsWith("noview"),
      employee = body.email.startsWith("employee"),
      merchant = body.email.startsWith("merchant");
    account = {
      ...normal,
      id: merchant ? "merchant-1" : "staff-1",
      role: merchant
        ? "user"
        : viewer || denied || noView || employee
          ? "employee"
          : "admin",
    };
    if (viewer || noView || employee)
      account.features = [
        {
          feature: "bank-transfers",
          accessView: !noView,
          accessCreate: false,
          accessUpdate: !viewer,
          accessDelete: false,
        },
      ];
    if (denied) account.features = [{ feature: "merchants", accessView: true }];
    result = {
      user: account,
      accessToken: "bank-transfer-access",
      refreshToken: "bank-transfer-refresh",
    };
  } else if (url.pathname.endsWith("/users/me")) result = account || normal;
  else if (url.pathname === "/v1/users") {
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
    assert.equal(query.type, "bankTransfer");
    assert.equal(method, "GET");
    if (failList) {
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
  } else if (url.pathname.startsWith("/v1/requests/")) {
    const id = url.pathname.split("/").at(-1),
      row = records.find((x) => x.id === id);
    assert.equal(method, "PATCH");
    assert.ok(row);
    assert.equal(row.status, "pending");
    if (failWrite) {
      status = 500;
      result = { message: "Write failed" };
    } else {
      Object.assign(row, body);
      result = row;
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
  await navigate("/bank-transfers/" + scope);
  await until(
    exists("[data-testid=bank-transfers-table]"),
    "bank transfer list",
  );
  await until(exists("[role=row][data-id]"), "rows");
}
async function bank(value) {
  await evaluate(
    "document.querySelector('[role=dialog] div[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))",
  );
  await until(exists(`[role=option][data-value=${value}]`), "bank options");
  await click(`[role=option][data-value=${value}]`);
}
const patches = () => calls.filter((x) => x.method === "PATCH");
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
  await reset("/bank-transfers/all");
  await until("location.pathname==='/sign-in'", "guest protection");
  pass("Guest routes require sign-in");
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin sign in");
  await list();
  assert.equal(
    await evaluate("document.querySelectorAll('[role=row][data-id]').length"),
    10,
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.type,
    "bankTransfer",
  );
  assert.ok(
    await evaluate("document.body.innerText.includes('Business Plan')"),
  );
  await screenshot("bank-transfers-desktop");
  pass(
    "Staff navigation, references, amounts and ten-row list preserve original request type",
  );
  await click('button[aria-label="Go to next page"]');
  await until(exists("[role=row][data-id=transfer-11]"), "page two");
  await fillSelector("[data-testid=bank-transfers-search]", "No & Match");
  await until(
    "document.body.innerText.includes('There are no bank transfers')",
    "empty encoded search",
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.page,
    "0",
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.search,
    "No & Match",
  );
  await clickText("Reset filters");
  await until(exists("[role=row][data-id=transfer-1]"), "search reset");
  pass("Search encoding and resets keep pagination synchronized");
  await list("merchant-1?updatedById=staff-1");
  await until(
    "document.body.innerText.includes('Account One')",
    "account scope",
  );
  let query = calls.filter((x) => x.url === "/v1/requests").at(-1).query;
  assert.equal(query.userId, "merchant-1");
  assert.equal(query.updatedById, "staff-1");
  await setStatusFilter("bank-transfers", "approved");
  await until(exists("[role=row][data-id=transfer-3]"), "approved filter");
  await exportAll("bankTransfer", {
    userId: "merchant-1",
    updatedById: "staff-1",
    status: "approved",
  });
  pass(
    "Filtered export creates Excel containing only matching merchant/reviewer/status records",
  );
  await clickText("Reset filters");
  await until(exists("[role=row][data-id=transfer-1]"), "filter reset");
  await click("[data-testid=bank-transfers-filters]");
  await until(
    exists("[role=menu] .MuiAutocomplete-root input"),
    "merchant filter",
  );
  await fillSelector("[role=menu] .MuiAutocomplete-root input", "Two");
  await until(
    "Boolean([...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes('Account Two')))",
    "merchant options",
  );
  await evaluate(
    "[...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes('Account Two')).click()",
  );
  await escape();
  await until(exists("[role=row][data-id=transfer-2]"), "changed account");
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.userId,
    "merchant-2",
  );
  await clickText("Reset filters");
  await until(exists("[role=row][data-id=transfer-1]"), "route reset");
  query = calls.filter((x) => x.url === "/v1/requests").at(-1).query;
  assert.equal(query.userId, "merchant-1");
  assert.equal(query.updatedById, "staff-1");
  pass("Remote merchant selection and reset retain route and audit filters");
  await list();
  await rowAction("transfer-1", "Accept");
  let count = patches().length;
  await closeDialog();
  assert.equal(patches().length, count);
  pass("Cancel closes approval without writing");
  await rowAction("transfer-1", "Accept");
  await click("[data-testid=bank-transfer-decision-submit]");
  await until(
    "document.querySelector('[role=dialog]')?.innerText.includes('Required field')",
    "required bank",
  );
  assert.equal(patches().length, count);
  await bank("alrajhiBank");
  failWrite = true;
  await click("[data-testid=bank-transfer-decision-submit]");
  await until(
    "document.body.innerText.includes('Something went wrong while converting to the confirmed')",
    "failed approval",
  );
  assert.ok(await evaluate(exists("[role=dialog]")));
  assert.equal(
    await evaluate("document.querySelector('input[name=bank]').value"),
    "alrajhiBank",
  );
  failWrite = false;
  await click("[data-testid=bank-transfer-decision-submit]");
  await until("!document.querySelector('[role=dialog]')", "approval closes");
  await until(
    "document.querySelector('[role=row][data-id=transfer-1]')?.innerText.includes('Confirmed')",
    "approved row",
  );
  assert.deepEqual(patches().at(-1).body, {
    status: "approved",
    bank: "alrajhiBank",
  });
  assert.equal(patches().at(-1).url, "/v1/requests/transfer-1");
  pass(
    "Approval validates bank, retains failed draft and retries exact ID with bank/status only",
  );
  assert.equal(
    await evaluate(
      "[...document.querySelector('[role=row][data-id=transfer-1]').querySelectorAll('button')].some(x=>['Accept','Refuse'].includes(x.textContent.trim()))",
    ),
    false,
  );
  pass("Decided transfers cannot be approved or rejected again");
  await rowAction("transfer-2", "Refuse");
  await fillField("notes", "Please upload the correct receipt");
  failWrite = true;
  await click("[data-testid=bank-transfer-decision-submit]");
  await until(
    "document.body.innerText.includes('Something went wrong while converting to the refused')",
    "failed rejection",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=notes]').value"),
    "Please upload the correct receipt",
  );
  failWrite = false;
  await click("[data-testid=bank-transfer-decision-submit]");
  await until("!document.querySelector('[role=dialog]')", "rejection closes");
  assert.deepEqual(patches().at(-1).body, {
    status: "rejected",
    notes: "Please upload the correct receipt",
  });
  assert.equal(patches().at(-1).url, "/v1/requests/transfer-2");
  pass("Rejection retains notes through failure and sends only notes/status");
  await rowAction("transfer-5", "Refuse");
  await click("[data-testid=bank-transfer-decision-submit]");
  await until("!document.querySelector('[role=dialog]')", "optional notes");
  assert.deepEqual(patches().at(-1).body, { status: "rejected", notes: "" });
  pass("Rejection notes remain optional");
  await rowAction("transfer-1", "Transaction Image");
  await until(exists("[data-testid=bank-transfer-image] img"), "receipt");
  await until(
    "document.querySelector('[data-testid=bank-transfer-image] img').naturalWidth>0",
    "receipt image loads",
  );
  failDownload = true;
  await clickText("Download", "[role=dialog] button");
  await until(
    "document.querySelector('[role=dialog]')?.innerText.includes('Something went wrong while downloading')",
    "download error",
  );
  await until(
    "[...document.querySelectorAll('[role=dialog] button')].some(x=>x.textContent.trim()==='Download'&&!x.disabled)",
    "download retry available",
  );
  failDownload = false;
  const started = Date.now();
  await clickText("Download", "[role=dialog] button");
  let downloaded;
  for (let i = 0; i < 100; i++) {
    downloaded = fs
      .readdirSync(output)
      .filter((name) => name.endsWith(".jpg"))
      .map((name) => path.join(output, name))
      .find((file) => fs.statSync(file).mtimeMs >= started);
    if (downloaded) break;
    await sleep(100);
  }
  assert.ok(downloaded);
  assert.ok(fs.readFileSync(downloaded, "utf8").includes("Mock transfer"));
  await closeDialog();
  pass(
    "Receipt preview and real download work, HTTP failure resets loading and retry succeeds",
  );
  failUsers = true;
  await list("merchant-2");
  await until(
    "document.body.innerText.includes('Unable to load the selected account')",
    "account error",
  );
  failUsers = false;
  await clickText("Retry");
  await until(
    "document.body.innerText.includes('Account Two')&&!document.body.innerText.includes('Unable to load the selected account')",
    "account retry",
  );
  failList = true;
  await navigate("/bank-transfers/all");
  await until(
    "document.body.innerText.includes('Unable to load bank transfers')",
    "list failure",
  );
  failList = false;
  await clickText("Retry");
  await until(exists("[role=row][data-id=transfer-1]"), "list retry");
  pass("List and selected-account lookup failures offer working retries");
  await login("viewer@example.test");
  await until("location.pathname==='/home'", "viewer login");
  await list();
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('[role=row][data-id] button')].some(x=>['Accept','Refuse'].includes(x.textContent.trim()))",
    ),
    false,
  );
  await rowAction("transfer-1", "Transaction Image");
  await until(exists("[data-testid=bank-transfer-image]"), "viewer receipt");
  await closeDialog();
  pass("View-only staff can inspect receipts without decision controls");
  await click("[data-testid=bank-transfers-filters]");
  await until(exists("[role=menu]"), "employee filter menu");
  assert.equal(
    await evaluate(
      "document.querySelector('[role=menu]').innerText.includes('Updated By')",
    ),
    false,
  );
  await escape();
  assert.equal(
    await evaluate("document.body.innerText.includes('Updated By')"),
    false,
  );
  pass("Reviewer column and picker remain administrator-only");
  for (const email of ["denied@example.test", "noview@example.test"]) {
    await login(email);
    await until("location.pathname==='/home'", "restricted login");
    count = calls.filter((x) => x.url === "/v1/requests").length;
    await navigate("/bank-transfers/all");
    await until(
      "location.pathname==='/home'||document.body.innerText.includes('Unauthorized Access')",
      "permission guard",
    );
    assert.equal(calls.filter((x) => x.url === "/v1/requests").length, count);
  }
  pass(
    "Denied staff and update-without-view grants cannot fetch bank-transfer records",
  );
  await login("merchant@example.test");
  await until("location.pathname==='/home'", "merchant login");
  await list("merchant-2");
  query = calls.filter((x) => x.url === "/v1/requests").at(-1).query;
  assert.equal(query.userId, undefined);
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('[role=row][data-id] button')].some(x=>['Accept','Refuse'].includes(x.textContent.trim()))",
    ),
    false,
  );
  assert.equal(
    await evaluate("document.body.innerText.includes('Export All Pages')"),
    false,
  );
  await click("[data-testid=bank-transfers-filters]");
  await until(exists("[role=menu]"), "merchant filters");
  assert.equal(
    await evaluate(
      "document.querySelectorAll('[role=menu] .MuiAutocomplete-root').length",
    ),
    0,
  );
  await escape();
  assert.ok(records.filter((x) => x.userId === "merchant-1").length > 0);
  pass(
    "Merchants retain read-only receipt access and backend account scope while ignoring route ownership",
  );
  await navigate("/bank-transfers/all/new");
  await until("location.pathname.includes('404')", "inactive create route");
  assert.equal(
    calls.some((x) => x.url === "/v1/requests" && x.method === "POST"),
    false,
  );
  pass("Inactive legacy create/delete flows remain unexposed");
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
  await screenshot("bank-transfers-ar-mobile");
  await rowAction("transfer-6", "قبول");
  await until(exists("[role=dialog]"), "Arabic approval");
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  await screenshot("bank-transfer-decision-ar-mobile");
  await closeDialog();
  pass(
    "Arabic mobile list and approval dialog retain RTL and fit the viewport",
  );
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks: passed, exceptions, calls }, null, 2),
  );
  console.log(
    `${passed}/${passed} bank-transfer browser checks passed; no uncaught exceptions.`,
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
