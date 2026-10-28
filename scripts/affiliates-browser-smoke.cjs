// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/affiliates-browser");
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
  failProfile = false,
  failWrite = false,
  failPlan = false,
  closeAccepted = false;
const country = {
    id: "65fd1a1c1fdbc094e3369b29",
    name: { en: "Saudi Arabia", ar: "السعودية" },
    code: "SA",
  },
  state = {
    id: "state-1",
    name: { en: "Riyadh", ar: "الرياض" },
    countryId: country.id,
  },
  city = {
    id: "city-1",
    name: { en: "Riyadh City", ar: "مدينة الرياض" },
    countryId: country.id,
    stateId: state.id,
    postalCode: "12345",
  };
const carriers = [
  {
    id: "carrier-1",
    name: "Carrier One",
    localPrice: 25,
    codPrice: 30,
    shippingMethods: ["local", "international"],
    hasState: true,
    isActive: true,
  },
  {
    id: "carrier-2",
    name: "Carrier Two",
    localPrice: 20,
    codPrice: 25,
    shippingMethods: ["local"],
    isActive: true,
  },
];
const records = Array.from({ length: 15 }, (_, i) => ({
  ...normal,
  id: "merchant-" + (i + 1),
  role: "user",
  firstName: "Account",
  lastName: String(i + 1).padStart(2, "0"),
  email: "account" + (i + 1) + "@example.test",
  phone: "+966-555123456",
  phone1: "other phone",
  companyName: i === 14 ? "Company & # special" : "Company " + (i + 1),
  taxNumber: "",
  loyaltyType: "custom",
  balance: 100 + i,
  codBalance: 50,
  subscriptionBalance: 0,
  shipmentsCount: 12,
  shipmentCodsCount: 1,
  isAffiliate: false,
  address: {
    countryId: country.id,
    stateId: state.id,
    cityId: city.id,
    street: "Street",
    zipCode: "12345",
  },
  country,
  state,
  city,
  prices: [
    {
      id: "price-1",
      shippingCompanyId: "carrier-1",
      shippingCompany: carriers[0],
      localPrice: 25,
      codPrice: 30,
      internationalDiscountRate: 5,
    },
    {
      id: "price-old",
      shippingCompanyId: "stored-carrier",
      shippingCompany: { id: "stored-carrier", name: "Stored carrier" },
      localPrice: 12,
    },
  ],
  createdAt: "2026-10-01T12:00:00Z",
}));
const ship = {
  id: "shipment-1",
  userId: "merchant-1",
  user: records[0],
  shippingCompanyId: "carrier-1",
  shippingCompany: carriers[0],
  method: "local",
  type: "package",
  status: "delivered",
  trackingNumber: "TRACK",
  isCod: true,
  shipmentDetails: {
    senderName: "Sender",
    receiverName: "Receiver",
    weight: 2,
    packagesCount: 1,
  },
  shipmentCod: { id: "cod-1", codStatus: "paid", codPrice: 50 },
};
let createdIdentity = "id";
let passed = 0;
function pass(name) {
  passed++;
  console.log("PASS " + name);
}
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
      { name: "Cache-Control", value: "no-store" },
    ],
    body:
      status === 204
        ? ""
        : Buffer.from(JSON.stringify(result)).toString("base64"),
  });
}

records.forEach((r, i) => {
  r.isAffiliate = true;
  r.affiliateCode = "AFF-" + i;
});
carriers[0].shippingMethods.push("cashOnDelivery");
carriers[0].serviceName = "aramex";
ship.shippingCompany = carriers[0];
const customers = Array.from({ length: 17 }, (_, i) => ({
  ...structuredClone(records[0]),
  id: "customer-" + (i + 1),
  firstName: "Customer",
  lastName: String(i + 1),
  email: "customer" + (i + 1) + "@example.test",
  isAffiliate: false,
  referredById: "merchant-1",
  prices: [
    {
      shippingCompanyId: "carrier-1",
      localPrice: 28,
      codPrice: 35,
      internationalDiscountRate: 5,
    },
    { shippingCompanyId: "stored-customer-carrier", localPrice: 9 },
  ],
}));
const ledger = Array.from({ length: 12 }, (_, i) => ({
  id: "profit-" + (i + 1),
  userId: "merchant-1",
  affiliateId: "merchant-1",
  shipment: { ...ship, id: "shipment-1", user: customers[0] },
  amount: i + 1,
  type: i === 1 ? "withdraw" : "deposit",
  status: i === 1 ? "rejected" : i === 2 ? "pending" : "success",
  notes: i === 11 ? "A & # special" : "Profit note",
  createdAt: "2026-10-20T12:00:00Z",
}));
let failSummary = false,
  failCustomers = false,
  failLedger = false,
  failSync = false,
  pendingRequest = true,
  availableBalance = 20;
let requestRow = {
  id: "request-1",
  userId: "merchant-1",
  user: records[0],
  type: "affiliateWithdraw",
  status: "pending",
  amount: 10,
  description: "Bank details",
  createdAt: "2026-10-20T12:00:00Z",
};
async function intercept(event) {
  const url = new URL(event.request.url),
    method = event.request.method,
    query = Object.fromEntries(url.searchParams),
    body = event.request.postData ? JSON.parse(event.request.postData) : {};
  if (method === "OPTIONS") return fulfill(event, 204, {});
  calls.push({ url: url.pathname, method, query, body });
  let result = {},
    status = 200;
  if (url.pathname === "/v1/auth-sessions/login") {
    const kind = body.email.split("@")[0];
    account = {
      ...normal,
      ...records[0],
      email: body.email,
      role:
        kind === "merchant" || kind === "nonaffiliate"
          ? "user"
          : kind === "admin"
            ? "admin"
            : "employee",
      isAffiliate: kind !== "nonaffiliate",
    };
    if (!["merchant", "admin", "nonaffiliate"].includes(kind))
      account.features = [
        { feature: "affiliate-merchants", accessView: kind !== "denied" },
        {
          feature: "customers",
          accessView: true,
          accessUpdate: kind === "editor",
        },
        { feature: "transactions", accessView: kind !== "onlyprofile" },
        {
          feature: "withdraw-requests",
          accessView: kind !== "onlyprofile",
          accessUpdate: kind === "editor",
        },
      ];
    result = {
      user: account,
      accessToken: "fixture-access",
      refreshToken: "fixture-refresh",
    };
  } else if (url.pathname === "/v1/users/me") {
    if (!account) {
      status = 401;
      result = { message: "unauthorized" };
    } else result = account;
  } else if (url.pathname === "/v1/users/affiliates/summary") {
    if (failSummary) {
      status = 500;
    } else
      result = {
        users: 17,
        profits: 0,
        pendingProfits: 9,
        shipments: { total: 12, delivered: 6, pending: 2, processing: 1 },
      };
  } else if (url.pathname === "/v1/users") {
    if (query.referredById) {
      if (failCustomers) {
        status = 500;
      } else {
        const list = query.referredById === "merchant-1" ? customers : [],
          filtered = list.filter(
            (x) =>
              !query.search ||
              JSON.stringify(x)
                .toLowerCase()
                .includes(query.search.toLowerCase()),
          );
        result = {
          results: filtered.slice(
            Number(query.page || 0) * 16,
            (Number(query.page || 0) + 1) * 16,
          ),
          total: filtered.length,
        };
      }
    } else if (failList) {
      status = 500;
    } else {
      const list = records.filter(
        (r) =>
          (!query.isAffiliate || r.isAffiliate) &&
          r.role === "user" &&
          (!query.search ||
            JSON.stringify(r)
              .toLowerCase()
              .includes(query.search.toLowerCase())),
      );
      const size = Number(query.pageSize || 10),
        page = Number(query.page || 0);
      result = {
        results: list.slice(page * size, (page + 1) * size),
        total: list.length,
      };
    }
  } else if (url.pathname.startsWith("/v1/users/")) {
    const id = url.pathname.split("/").at(-1),
      record =
        customers.find((x) => x.id === id) || records.find((x) => x.id === id);
    if (!record || failProfile) {
      status = 404;
    } else if (method === "PATCH") {
      if (failWrite) {
        status = 500;
        result = { message: "failed" };
      } else {
        Object.assign(record, body);
        result = record;
      }
    } else result = record;
  } else if (url.pathname === "/v1/affiliate-transactions/balance") {
    result = { balance: availableBalance };
  } else if (url.pathname === "/v1/affiliate-transactions") {
    if (failLedger) status = 500;
    else {
      const list = (query.userId === "merchant-1" ? ledger : []).filter(
          (x) =>
            !query.search ||
            JSON.stringify(x)
              .toLowerCase()
              .includes(query.search.toLowerCase()),
        ),
        size = Number(query.pageSize || 10),
        page = Number(query.page || 0);
      result = {
        results: list.slice(page * size, (page + 1) * size),
        total: list.length,
      };
    }
  } else if (url.pathname.includes("/v1/shipments/shipment/tracking/")) {
    if (failSync) status = 500;
    else {
      ledger[0].shipment.trackingText = "Tracking refreshed";
      result = {};
    }
  } else if (url.pathname === "/v1/shipping-companies") {
    result = { results: carriers, total: carriers.length };
  } else if (url.pathname === "/v1/requests") {
    if (method === "POST") {
      if (failWrite) status = 500;
      else {
        requestRow = { ...requestRow, ...body, id: "request-created" };
        pendingRequest = true;
        result = requestRow;
      }
    } else {
      const list =
        pendingRequest &&
        (!query.status || query.status === requestRow.status) &&
        (!query.userId || query.userId === requestRow.userId)
          ? [requestRow]
          : [];
      result = { results: list, total: list.length };
    }
  } else if (url.pathname.startsWith("/v1/requests/")) {
    if (method === "PATCH") {
      if (failWrite) status = 500;
      else {
        Object.assign(requestRow, body);
        result = requestRow;
      }
    } else result = requestRow;
  } else if (url.pathname === "/v1/settings") {
    result = {};
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

async function merchantList() {
  await navigate("/merchants");
  await until(exists("[role=row][data-id=merchant-1]"), "merchant rows");
}
async function view(id = "merchant-1") {
  await navigate("/merchants/" + id + "/view");
  await until(exists("[data-testid=merchant-info]"), "merchant profile");
}
async function edit(id = "merchant-1") {
  await navigate("/merchants/" + id);
  await until(exists("input[name=firstName]"), "merchant edit");
}
async function tab(label) {
  await clickText(label, "[role=tab]");
}
async function action(label) {
  await clickText(label);
  await until(exists("[data-testid=merchant-action-submit]"), "action dialog");
}
async function exportWorkbook(size, endpoint = "/v1/users", scope = {}) {
  const start = Date.now(),
    before = calls.filter(
      (x) => x.url === endpoint && x.query.pageSize === String(size),
    ).length;
  await clickText("Export All Pages");
  let file;
  for (let i = 0; i < 150; i++) {
    file = fs
      .readdirSync(output)
      .filter((x) => x.endsWith(".xlsx"))
      .map((x) => path.join(output, x))
      .find((x) => fs.statSync(x).mtimeMs >= start);
    if (file) break;
    await sleep(100);
  }
  assert(file, "downloaded workbook");
  const XLSX = require(path.join(target, "node_modules/xlsx")),
    book = XLSX.readFile(file),
    rows = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]]);
  assert(rows.length > 0);
  const last = calls.filter(
    (x) => x.url === endpoint && x.query.pageSize === String(size),
  );
  assert.equal(last.length, before + 1);
  for (const [key, value] of Object.entries(scope))
    assert.equal(last.at(-1).query[key], value);
  return rows;
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
  await send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: output,
  });
  await navigate("/affiliate-merchants");
  await until(
    "location.pathname==='/sign-in' && !!document.querySelector('input[name=email]')",
    "guest denied",
  );
  assert(!calls.some((c) => c.url === "/v1/users" && c.query.isAffiliate));
  pass("Guest cannot read affiliate directory");
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin");
  await navigate("/affiliate-merchants");
  await until(exists("[role=row][data-id=merchant-1]"), "directory");
  assert.equal(
    calls.filter((c) => c.url === "/v1/users" && c.query.isAffiliate).at(-1)
      .query.role,
    "user",
  );
  pass("Affiliate directory fixes role and affiliate scope");
  await click('button[aria-label="Go to next page"]');
  await until(exists("[role=row][data-id=merchant-15]"), "page 2");
  await fillSelector(
    "[data-testid=affiliateMerchants-search]",
    "Company & # special",
  );
  await until(
    "document.querySelectorAll('[role=row][data-id]').length===1",
    "search",
  );
  assert.equal(
    calls.filter((c) => c.url === "/v1/users" && c.query.search).at(-1).query
      .page,
    "0",
  );
  pass("Encoded affiliate search resets page");
  await exportWorkbook(3000, "/v1/users", {
    isAffiliate: "true",
    search: "Company & # special",
  });
  pass("Real affiliate directory XLSX retains fixed scope and filters");
  await screenshot("affiliates-en-desktop");
  failList = true;
  await navigate("/affiliate-merchants");
  await until(
    "document.body.innerText.includes('Could not load')",
    "failed list",
  );
  failList = false;
  await clickText("Retry");
  await until(exists("[role=row][data-id=merchant-1]"), "list retry");
  pass("Directory read failure is retryable");
  const profile = async (tab = "info", id = "merchant-1") => {
    await navigate("/affiliate-merchants/" + id + "/" + tab);
    await until(
      exists(
        "[data-testid=" +
          {
            info: "affiliate-info",
            customers: "affiliate-customers",
            transactions: "affiliate-transactions",
            "withdraw-requests": "affiliate-withdraw-requests-table",
          }[tab] +
          "]",
      ),
      "affiliate " + tab,
    );
  };
  failSummary = true;
  await profile();
  await until(
    "document.body.innerText.includes('Could not load the affiliate summary')",
    "summary error",
  );
  failSummary = false;
  await clickText("Retry");
  await until("document.body.innerText.includes('17')", "summary retry");
  assert.equal(
    calls.filter((c) => c.url.endsWith("/affiliates/summary")).at(-1).body
      .affiliateId,
    "merchant-1",
  );
  pass(
    "Affiliate summary retries and preserves selected account and zero profits",
  );
  await click("[data-testid=affiliate-referral-link] button");
  assert.equal(
    await evaluate("window.__copiedText"),
    "http://127.0.0.1:3138/affiliate/AFF-0",
  );
  pass("Referral link copy retains origin and affiliate code");
  await profile("customers");
  await until(exists("[data-testid=edit-customer-customer-1]"), "customers");
  await click('button[aria-label="Go to page 2"]');
  await until(
    exists("[data-testid=edit-customer-customer-17]"),
    "customers next",
  );
  pass("Customer cards retain 16-row pagination");
  await fillSelector("[data-testid=affiliate-customers-search]", "customer17@");
  await until(
    "document.querySelectorAll('[data-testid^=edit-customer-]').length===1",
    "customer search",
  );
  assert.equal(
    calls.filter((c) => c.query.referredById && c.query.search).at(-1).query
      .page,
    "0",
  );
  pass("Customer search keeps referral owner and resets page");
  await fillSelector("[data-testid=affiliate-customers-search]", "");
  await until(
    exists("[data-testid=edit-customer-customer-1]"),
    "reset customers",
  );
  await click("[data-testid=edit-customer-customer-1]");
  await until(exists("[role=dialog]"), "price dialog");
  await fillField("prices.0.localProfits", "-1");
  await click("[data-testid=save-customer-prices]");
  await until(
    "document.body.innerText.includes('Profit cannot be negative')",
    "minimum cost",
  );
  assert(
    !calls.some(
      (c) => c.method === "PATCH" && c.url === "/v1/users/customer-1",
    ),
  );
  pass("Negative markup cannot lower customer price below affiliate cost");
  await fillField("prices.0.localProfits", "5");
  failWrite = true;
  await click("[data-testid=save-customer-prices]");
  await until(
    "document.body.innerText.includes('Your edits have been kept')",
    "price failure",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('input[name=\"prices.0.localProfits\"]').value",
    ),
    "5",
  );
  failWrite = false;
  await click("[data-testid=save-customer-prices]");
  await until("!document.querySelector('[role=dialog]')", "price retry");
  const patch = calls
    .filter((c) => c.method === "PATCH" && c.url === "/v1/users/customer-1")
    .at(-1);
  assert.equal(patch.body.prices[0].localPrice, 30);
  assert.equal(patch.body.prices[0].affiliateId, "merchant-1");
  assert.equal(patch.body.prices[0].internationalDiscountRate, 5);
  assert(
    patch.body.prices.some(
      (p) =>
        p.shippingCompanyId === "stored-customer-carrier" && p.localPrice === 9,
    ),
  );
  assert(!("mainLocalPrice" in patch.body.prices[0]));
  pass(
    "Customer pricing retries drafts, preserves stored carriers/rates and sends only owned price fields",
  );
  await until(
    exists("[data-testid=edit-customer-customer-2]"),
    "second customer",
  );
  await click("[data-testid=edit-customer-customer-2]");
  await until(exists("[role=dialog]"), "second pricing dialog");
  customers[1].referredById = "merchant-2";
  const foreignBefore = calls.filter(
    (c) => c.url === "/v1/users/customer-2" && c.method === "PATCH",
  ).length;
  await click("[data-testid=save-customer-prices]");
  await until(
    "document.body.innerText.includes('Your edits have been kept')",
    "changed referral owner",
  );
  assert.equal(
    calls.filter(
      (c) => c.url === "/v1/users/customer-2" && c.method === "PATCH",
    ).length,
    foreignBefore,
  );
  customers[1].referredById = "merchant-1";
  await clickText("Cancel", "[role=dialog] button");
  await until(
    "!document.querySelector('[role=dialog]')",
    "close changed owner",
  );
  pass(
    "Fresh referral ownership prevents saving a customer moved to another affiliate",
  );
  failCustomers = true;
  await profile("customers");
  await until(
    "document.body.innerText.includes('Could not load records')",
    "customers failure",
  );
  failCustomers = false;
  await clickText("Retry");
  await until(
    exists("[data-testid=edit-customer-customer-1]"),
    "customers retry",
  );
  pass("Customer read failure exposes retry");
  await profile("transactions");
  await until(exists("[role=row][data-id=profit-1]"), "ledger");
  assert.equal(
    calls.filter((c) => c.url === "/v1/affiliate-transactions").at(-1).query
      .userId,
    "merchant-1",
  );
  pass("Profit ledger fixes selected affiliate ownership");
  await fillSelector(
    "[data-testid=affiliate-transactions-search]",
    "A & # special",
  );
  await until(exists("[role=row][data-id=profit-12]"), "profit search");
  await exportWorkbook(50000, "/v1/affiliate-transactions", {
    userId: "merchant-1",
    search: "A & # special",
  });
  pass("Real profit XLSX retains owner and encoded search");
  await fillSelector("[data-testid=affiliate-transactions-search]", "");
  await until(
    exists("[data-testid=sync-affiliate-profit-1]"),
    "sync available",
  );
  failSync = true;
  await click("[data-testid=sync-affiliate-profit-1]");
  await until(
    "document.body.innerText.includes('Tracking could not be refreshed')",
    "sync failure",
  );
  failSync = false;
  await click("[data-testid=sync-affiliate-profit-1]");
  await until(
    "document.body.innerText.includes('Tracking refreshed')",
    "sync retry",
  );
  pass("Eligible shipment tracking sync retries and refreshes ledger");
  await profile("transactions", "merchant-2");
  await until(
    "document.body.innerText.includes('No data') || document.querySelectorAll('[role=row][data-id]').length===0",
    "second ledger empty",
  );
  assert.equal(
    calls.filter((c) => c.url === "/v1/affiliate-transactions").at(-1).query
      .userId,
    "merchant-2",
  );
  pass("Switching affiliates changes profit query ownership");
  await profile("withdraw-requests");
  await until(exists("[role=row][data-id=request-1]"), "withdrawals");
  await exportWorkbook(500000, "/v1/requests", {
    userId: "merchant-1",
    type: "affiliateWithdraw",
  });
  pass("Embedded withdrawal list and real export retain affiliate owner");
  await login("viewer@example.test");
  await until("location.pathname==='/home'", "viewer");
  await profile("customers");
  await until("document.body.innerText.includes('Customer 1')", "viewer cards");
  assert.equal(
    await evaluate(
      "document.querySelectorAll('[data-testid^=edit-customer-]').length",
    ),
    0,
  );
  pass("Customer view grant remains read only without update");
  await profile("withdraw-requests");
  await until(exists("[role=row][data-id=request-1]"), "viewer withdrawal");
  assert(!(await evaluate("document.body.innerText")).includes("Refuse"));
  pass(
    "Embedded withdrawal view works without granting standalone affiliate withdrawal access or review",
  );
  await login("editor@example.test");
  await until("location.pathname==='/home'", "editor");
  await profile("withdraw-requests");
  await until(exists("[role=row][data-id=request-1]"), "editor withdrawal");
  await rowAction("request-1", "Refuse");
  await click("[data-testid=affiliate-withdraw-request-decision-submit]");
  await until("!document.querySelector('[role=dialog]')", "refused");
  assert.deepEqual(
    calls
      .filter((c) => c.method === "PATCH" && c.url === "/v1/requests/request-1")
      .at(-1).body,
    { status: "rejected" },
  );
  pass(
    "Embedded reviews preserve original withdrawal update grant and status-only payload",
  );
  await login("onlyprofile@example.test");
  await until("location.pathname==='/home'", "restricted");
  await profile();
  assert.equal(
    await evaluate("document.querySelectorAll('[role=tab]').length"),
    2,
  );
  const before = calls.length;
  await navigate("/affiliate-merchants/merchant-1/transactions");
  await until(exists("[data-testid=affiliate-info]"), "hidden tab fallback");
  assert(
    !calls.slice(before).some((c) => c.url === "/v1/affiliate-transactions"),
  );
  pass("Missing operational grants cannot fetch hidden profit tabs");
  await login("denied@example.test");
  await until("location.pathname==='/home'", "denied");
  const deniedStart = calls.length;
  await navigate("/affiliate-merchants");
  await until(
    "location.pathname==='/home' || location.pathname.includes('/error/')",
    "feature denied",
  );
  assert(
    !calls
      .slice(deniedStart)
      .some((c) => c.url === "/v1/users" && c.query.isAffiliate),
  );
  pass("Missing affiliate view prevents directory reads");
  await login("nonaffiliate@example.test");
  await until("location.pathname==='/home'", "nonaffiliate");
  const nonStart = calls.length;
  await navigate("/affiliate-profile");
  await until(
    "location.pathname==='/home' || location.pathname.includes('/error/')",
    "nonaffiliate denied",
  );
  assert(
    !calls.slice(nonStart).some((c) => c.url.endsWith("/affiliates/summary")),
  );
  pass("Nonaffiliate merchant cannot open affiliate self service");
  await login("merchant@example.test");
  await until("location.pathname==='/home'", "affiliate merchant");
  await navigate("/affiliate-profile/customers");
  await until(
    exists("[data-testid=edit-customer-customer-1]"),
    "own customer pricing",
  );
  pass("Affiliate merchant can manage own referred customer prices");
  pendingRequest = false;
  await navigate("/affiliate-profile/withdraw-requests");
  await until(
    exists("[data-testid=add-affiliate-withdraw-request]"),
    "self withdrawals",
  );
  await click("[data-testid=add-affiliate-withdraw-request]");
  await until(exists("input[name=amount]"), "withdraw creation");
  await fillField("amount", "10");
  await evaluate(
    `(()=>{const input=document.querySelector('textarea[name=description]');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,'Bank notes');input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  );
  failWrite = true;
  await click("[data-testid=send-affiliate-withdraw-request]");
  await until(
    "document.body.innerText.includes('Unable to submit affiliate withdrawal')",
    "create failed",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=amount]').value"),
    "10",
  );
  failWrite = false;
  await click("[data-testid=send-affiliate-withdraw-request]");
  await until(
    "location.pathname==='/affiliate-profile/withdraw-requests'",
    "return own affiliate tab",
  );
  assert.equal(
    calls.filter((c) => c.url === "/v1/requests" && c.method === "POST").at(-1)
      .body.userId,
    "merchant-1",
  );
  pass(
    "Withdrawal creation retains draft after failure and returns to migrated affiliate profile",
  );
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin again");
  await profile();
  await click("[data-testid=deactivate-affiliate]");
  failWrite = true;
  await click("[data-testid=merchant-action-submit]");
  await until(
    "document.body.innerText.includes('The action failed')",
    "deactivation failed",
  );
  failWrite = false;
  await click("[data-testid=merchant-action-submit]");
  await until(
    "location.pathname==='/merchants/merchant-1/view'",
    "deactivated fallback",
  );
  assert.deepEqual(
    calls
      .filter((c) => c.method === "PATCH" && c.url === "/v1/users/merchant-1")
      .at(-1).body,
    { isAffiliate: false },
  );
  pass(
    "Confirmed affiliate deactivation retries and redirects to main profile",
  );
  records[0].isAffiliate = true;
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
  await profile();
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  await screenshot("affiliate-ar-mobile");
  await profile("customers");
  await until(
    exists("[data-testid=edit-customer-customer-1]"),
    "arabic customer",
  );
  await click("[data-testid=edit-customer-customer-1]");
  await until(exists("[role=dialog]"), "arabic prices");
  await screenshot("customer-prices-ar-mobile");
  assert(
    await evaluate(
      "document.querySelector('[role=dialog]').getBoundingClientRect().right<=innerWidth",
    ),
  );
  pass("Arabic affiliate profile and pricing dialog remain responsive and RTL");
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks: passed, exceptions, calls }, null, 2),
  );
  console.log(
    `${passed}/${passed} affiliate browser checks passed; no uncaught exceptions.`,
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
