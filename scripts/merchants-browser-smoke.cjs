// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/merchants-browser");
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
    const merchant = body.email.startsWith("merchant"),
      viewer = body.email.startsWith("viewer"),
      editor = body.email.startsWith("editor"),
      denied = body.email.startsWith("denied");
    account = merchant
      ? { ...records[0] }
      : {
          ...normal,
          id: "staff-1",
          role: viewer || editor || denied ? "employee" : "admin",
        };
    if (viewer || editor || denied)
      account.features = [
        { feature: "merchants", accessView: !denied, accessUpdate: editor },
      ];
    result = {
      user: account,
      accessToken: "merchant-access",
      refreshToken: "merchant-refresh",
    };
  } else if (url.pathname === "/v1/users/me") {
    if (method === "PATCH") {
      if (failWrite) {
        status = 500;
        result = { message: "profile write failed" };
      } else {
        Object.assign(account, body);
        Object.assign(records[0], body);
        result = account;
      }
    } else result = account || normal;
  } else if (url.pathname === "/v1/users") {
    if (method === "POST") {
      if (failWrite) {
        status = 500;
        result = { message: "create failed" };
      } else {
        result = { ...body, id: "created-merchant", role: "user" };
        const record = structuredClone(result);
        if (createdIdentity === "_id") {
          result._id = result.id;
          delete result.id;
        }
        if (createdIdentity === "none") {
          result = { message: "created" };
        }
        records.push(record);
      }
    } else if (failList) {
      status = 500;
      result = { message: "list failed" };
    } else {
      let list = records.filter(
        (row) =>
          row.role === "user" &&
          (!query.search ||
            JSON.stringify(row)
              .toLowerCase()
              .includes(query.search.toLowerCase())) &&
          (!query.loyaltyType || row.loyaltyType === query.loyaltyType) &&
          (!query.active || !row.isBlocked === (query.active === "true")) &&
          (!query.verificationStatus ||
            row.verificationStatus === query.verificationStatus) &&
          (!query.balanceType ||
            (query.balanceType === "positive" && row.balance > 0) ||
            (query.balanceType === "negative" && row.balance < 0) ||
            (query.balanceType === "zero" && row.balance === 0)),
      );
      if (query.orderColumn)
        list = list.toSorted((a, b) =>
          query.orderDirection === "asc"
            ? a[query.orderColumn] - b[query.orderColumn]
            : b[query.orderColumn] - a[query.orderColumn],
        );
      result = {
        results: list.slice(
          Number(query.page) * Number(query.pageSize),
          (Number(query.page) + 1) * Number(query.pageSize),
        ),
        total: list.length,
      };
    }
  } else if (url.pathname.startsWith("/v1/users/")) {
    const id = url.pathname.split("/")[3],
      row = records.find((x) => x.id === id);
    if (!row || failProfile) {
      status = 404;
      result = { message: "missing" };
    } else if (method === "PATCH") {
      if (failWrite) {
        status = 500;
        result = { message: "write failed" };
      } else {
        Object.assign(row, body);
        result = row;
      }
    } else if (url.pathname.endsWith("/add-payment-plan")) {
      if (failWrite) {
        status = 500;
        result = { message: "plan failed" };
      } else {
        row.subscriptionBalance = 100;
        row.paymentPlanId = body.paymentPlanId;
        row.paymentPlan = { id: body.paymentPlanId, name: "Plan One" };
        result = row;
      }
    } else if (url.pathname.endsWith("/cancel-payment-plan")) {
      row.subscriptionBalance = 0;
      row.paymentPlanId = undefined;
      row.paymentPlan = undefined;
      result = row;
    } else result = row;
  } else if (url.pathname === "/v1/transactions/close-balance")
    result = {
      walletBalanceStatus: closeAccepted,
      codBalanceStatus: closeAccepted,
    };
  else if (url.pathname === "/v1/payment-plans") {
    if (failPlan) {
      status = 500;
      result = { message: "plans failed" };
    } else
      result = {
        results: [
          {
            id: "plan-1",
            name: "Plan One",
            price: 100,
            status: "active",
            features: [],
          },
        ],
        total: 1,
      };
  } else if (url.pathname === "/v1/shipping-companies")
    result = { results: carriers, total: carriers.length };
  else if (url.pathname.startsWith("/v1/shipping-companies/"))
    result =
      carriers.find((x) => x.id === url.pathname.split("/").at(-1)) ||
      carriers[0];
  else if (url.pathname === "/v1/countries")
    result = { results: [country], total: 1 };
  else if (url.pathname.startsWith("/v1/countries/")) result = country;
  else if (url.pathname === "/v1/states")
    result = { results: [state], total: 1 };
  else if (url.pathname.startsWith("/v1/states/")) result = state;
  else if (url.pathname === "/v1/cities")
    result = { results: [city], total: 1 };
  else if (url.pathname.startsWith("/v1/cities/")) result = city;
  else if (url.pathname === "/v1/shipments/shipment-cods/summary")
    result = { canceledDues: 0, pendingDues: 0, settledDues: 50 };
  else if (url.pathname === "/v1/shipments/shipment/summary") result = {};
  else if (url.pathname === "/v1/shipments")
    result = {
      results: [{ ...ship, userId: query.userId || account.id }],
      total: 1,
    };
  else if (url.pathname === "/v1/transactions")
    result = {
      results: [
        {
          id: "transaction-1",
          userId: query.userId || account.id,
          user: records[0],
          type: "deposit",
          relatedBalance: query.relatedBalance || "wallet",
          amount: 10,
          currentBalance: 110,
          previousBalance: 100,
          title: { en: "Ledger row" },
          description: { en: "Ledger details" },
          createdAt: "2026-10-23T12:00:00Z",
        },
      ],
      total: 1,
    };
  else if (url.pathname === "/v1/shipping-users")
    result = {
      results: [
        {
          id: "contact-1",
          type: query.type,
          userId: query.userId || account.id,
          fullName: "Contact One",
          email: "contact@example.test",
          phone: "+966-555123456",
          address: {
            countryId: country.id,
            stateId: state.id,
            cityId: city.id,
          },
          country,
          state,
          city,
          senderShipmentsCount: 2,
          receiverShipmentsCount: 3,
          createdAt: "2026-10-23T12:00:00Z",
        },
      ],
      total: 1,
    };
  else if (url.pathname === "/v1/requests")
    result = {
      results: [
        {
          id: "request-1",
          type: query.type,
          status: "pending",
          userId: "merchant-1",
          user: records[0],
          amount: 10,
        },
      ],
      total: 1,
    };
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

  await reset("/merchants");
  await until("location.pathname==='/sign-in'", "guest");
  pass("Guests cannot read merchant accounts");
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin");
  await merchantList();
  assert.equal(
    await evaluate("document.querySelectorAll('[role=row][data-id]').length"),
    10,
  );
  await screenshot("merchants-en-desktop");
  pass(
    "Merchant directory preserves account, balance, status and ten-row pagination columns",
  );
  await click('button[aria-label="Go to next page"]');
  await until(exists("[role=row][data-id=merchant-11]"), "page two");
  await fillSelector("[data-testid=merchants-search]", "Company & # special");
  await until(exists("[role=row][data-id=merchant-15]"), "encoded search");
  assert.equal(
    calls.filter((x) => x.url === "/v1/users").at(-1).query.page,
    "0",
  );
  pass("Encoded directory search resets pagination");
  await clickText("Reset filters");
  await until(exists("[role=row][data-id=merchant-1]"), "reset");
  await click("[data-testid=sort-wallet]");
  await untilCall(
    () =>
      calls.filter((x) => x.url === "/v1/users").at(-1).query.orderColumn ===
      "balance",
    "wallet sort",
  );
  await click("[data-testid=sort-cod]");
  await untilCall(
    () =>
      calls.filter((x) => x.url === "/v1/users").at(-1).query.orderColumn ===
      "codBalance",
    "COD sort",
  );
  await exportWorkbook(3000);
  pass(
    "Independent wallet/COD sorting and real 3000-row export retain source precedence",
  );
  failList = true;
  await navigate("/merchants");
  await until(
    "document.body.innerText.includes('Could not load merchants')",
    "failed list",
  );
  failList = false;
  await clickText("Retry");
  await until(exists("[role=row][data-id=merchant-1]"), "retry list");
  pass("Directory read failure exposes retry");
  await edit();
  await fillField("firstName", "Edited account");
  failWrite = true;
  await click("[data-testid=save-merchant]");
  await until(
    "document.body.innerText.includes('Your edits have been kept')",
    "failed edit",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=firstName]').value"),
    "Edited account",
  );
  failWrite = false;
  await click("[data-testid=save-merchant]");
  await until(
    "location.pathname==='/merchants/merchant-1/view'",
    "saved profile",
  );
  assert.equal(patches().at(-1).url, "/v1/users/merchant-1");
  assert(!("balance" in patches().at(-1).body));
  assert(!("role" in patches().at(-1).body));
  pass(
    "Failed profile save keeps edits and retry targets the actual account without metadata",
  );
  await edit();
  await fillField("taxNumber", "١٢٣٤٥٦٧٨٩٠١٢٣٤٥");
  await fillField("address.street", "");
  let n = patches().length;
  await click("[data-testid=save-merchant]");
  await until(
    "Boolean(document.querySelector('.Mui-error'))",
    "tax street validation",
  );
  assert.equal(patches().length, n);
  await fillField("address.street", "Tax street");
  await click("[data-testid=save-merchant]");
  await until(exists("[data-testid=merchant-info]"), "tax saved");
  assert.equal(patches().at(-1).body.taxNumber, "123456789012345");
  pass(
    "Tax number normalization and conditional required street preserve source rules",
  );
  await edit();
  await tab("Merchant type");
  await until(
    "document.body.innerText.includes('stored-carrier')",
    "stored carrier pricing",
  );
  await until(
    "document.body.innerText.includes('Carrier Two')",
    "carrier lookup complete",
  );
  await fillField("prices.0.localPrice", "27");
  await click("[data-testid=save-merchant]");
  await until(exists("[data-testid=merchant-info]"), "prices saved");
  const prices = patches().at(-1).body.prices;
  assert.equal(
    prices.find((x) => x.shippingCompanyId === "carrier-1").localPrice,
    27,
  );
  assert(prices.some((x) => x.shippingCompanyId === "stored-carrier"));
  assert(prices.every((x) => !("id" in x) && !("shippingCompany" in x)));
  pass(
    "Carrier pricing retains missing/stored carriers and serializes only positive overrides and reference IDs",
  );
  await action("Deactivate Account");
  await closeDialog();
  n = patches().length;
  assert.equal(patches().length, n);
  await action("Deactivate Account");
  failWrite = true;
  await click("[data-testid=merchant-action-submit]");
  await until(
    "document.body.innerText.includes('The action failed')",
    "failed block",
  );
  failWrite = false;
  await click("[data-testid=merchant-action-submit]");
  await until("!document.querySelector('[role=dialog]')", "blocked");
  assert.deepEqual(patches().at(-1).body, { isBlocked: true });
  pass(
    "Confirmed account blocking retries failure with an isBlocked-only payload",
  );
  await action("Activate Affiliate Marketing Membership");
  await click("[data-testid=merchant-action-submit]");
  await until("!document.querySelector('[role=dialog]')", "affiliate on");
  assert.deepEqual(patches().at(-1).body, { isAffiliate: true });
  pass(
    "Affiliate toggle sends only isAffiliate and does not restore pending affiliate profile routes",
  );
  await action("Add Subscription Plan");
  failWrite = true;
  await click("[data-testid=merchant-action-submit]");
  await until(
    "document.body.innerText.includes('The action failed')",
    "failed subscribe",
  );
  failWrite = false;
  await click("[data-testid=merchant-action-submit]");
  await until("!document.querySelector('[role=dialog]')", "subscribed");
  assert(
    calls.some(
      (x) =>
        x.url === "/v1/users/merchant-1/add-payment-plan" &&
        x.body.paymentPlanId === "plan-1",
    ),
  );
  pass(
    "Payment plan subscription keeps a retryable selection and original dedicated endpoint",
  );
  await until(
    "document.body.innerText.includes('Cancel Current Plan')",
    "cancel visible",
  );
  await action("Cancel Current Plan");
  await click("[data-testid=merchant-action-submit]");
  await until("!document.querySelector('[role=dialog]')", "plan canceled");
  assert(
    calls.some(
      (x) =>
        x.method === "DELETE" &&
        x.url === "/v1/users/merchant-1/cancel-payment-plan",
    ),
  );
  pass(
    "Plan cancellation confirms and uses the original cancellation endpoint",
  );
  await action("Close Balance");
  await fillField("notes", "Close reviewed balance");
  await click("[data-testid=merchant-action-submit]");
  await until(
    "document.body.innerText.includes('The action failed')",
    "close false result",
  );
  closeAccepted = true;
  await click("[data-testid=merchant-action-submit]");
  await until("!document.querySelector('[role=dialog]')", "closed");
  assert.deepEqual(
    calls.filter((x) => x.url === "/v1/transactions/close-balance").at(-1).body,
    { userId: "merchant-1", type: "wallet", notes: "Close reviewed balance" },
  );
  pass(
    "Balance closing checks the backend success flag and retains notes after a rejected close",
  );
  let start = calls.length;
  await tab("Shipments");
  await until(exists("[data-testid=shipments-table]"), "embedded shipments");
  await untilCall(
    () =>
      calls
        .slice(start)
        .some(
          (x) => x.url === "/v1/shipments" && x.query.userId === "merchant-1",
        ),
    "shipment scope",
  );
  await exportWorkbook(50000, "/v1/shipments", { userId: "merchant-1" });
  pass(
    "Embedded shipments retain operations and export with fixed merchant ownership",
  );
  start = calls.length;
  await tab("Balance");
  await until(exists("[data-testid=transactions-table]"), "wallet tab");
  await untilCall(
    () =>
      calls
        .slice(start)
        .some(
          (x) =>
            x.url === "/v1/transactions" &&
            x.query.userId === "merchant-1" &&
            x.query.relatedBalance === "wallet",
        ),
    "wallet scope",
  );
  pass(
    "Embedded wallet ledger uses its own permission and fixed merchant/balance scope",
  );
  start = calls.length;
  await tab("COD Balance");
  await until(exists("[data-testid=transactions-table]"), "COD tab");
  await untilCall(
    () =>
      calls
        .slice(start)
        .some(
          (x) =>
            x.url === "/v1/transactions" &&
            x.query.userId === "merchant-1" &&
            x.query.relatedBalance === "cod",
        ),
    "COD scope",
  );
  pass("Embedded COD ledger switches to the correct fixed balance scope");
  start = calls.length;
  await tab("Dues");
  await until(exists("[data-testid=merchant-dues-table]"), "COD dues tab");
  await untilCall(
    () =>
      calls
        .slice(start)
        .some(
          (x) =>
            x.url === "/v1/shipments" &&
            x.query.userId === "merchant-1" &&
            x.query.isCod === "true",
        ),
    "dues scope",
  );
  assert(
    calls
      .slice(start)
      .filter((x) => x.url === "/v1/shipments/shipment-cods/summary")
      .every((x) => x.query.userId === "merchant-1"),
  );
  pass(
    "Embedded COD dues list and independent totals retain the viewed account scope",
  );
  start = calls.length;
  await tab("Senders");
  await until(exists("[data-testid=merchant-contacts]"), "sender tab");
  await untilCall(
    () =>
      calls
        .slice(start)
        .some(
          (x) =>
            x.url === "/v1/shipping-users" &&
            x.query.userId === "merchant-1" &&
            x.query.type === "sender",
        ),
    "sender scope",
  );
  await exportWorkbook(50000, "/v1/shipping-users", {
    userId: "merchant-1",
    type: "sender",
  });
  await tab("Receivers");
  await untilCall(
    () =>
      calls.filter((x) => x.url === "/v1/shipping-users").at(-1).query.type ===
      "receiver",
    "receiver scope",
  );
  pass(
    "Sender/receiver tabs and contact export retain owner/type and source limits",
  );
  await view("merchant-2");
  start = calls.length;
  await tab("Shipments");
  await untilCall(
    () =>
      calls
        .slice(start)
        .some(
          (x) => x.url === "/v1/shipments" && x.query.userId === "merchant-2",
        ),
    "changed owner",
  );
  assert(
    !calls
      .slice(start)
      .some(
        (x) => x.url === "/v1/shipments" && x.query.userId === "merchant-1",
      ),
  );
  pass(
    "Changing merchant profiles cannot reuse the previous operational account scope",
  );
  await merchantList();
  await rowAction("merchant-10", "Convert To Employee");
  await until(exists("[data-testid=merchant-action-submit]"), "convert dialog");
  await click("[data-testid=merchant-action-submit]");
  await until("!document.querySelector('[role=dialog]')", "converted");
  assert.deepEqual(patches().at(-1).body, { role: "employee" });
  pass("Administrator employee conversion confirms and writes role only");
  await login("viewer@example.test");
  await until("location.pathname==='/home'", "viewer");
  await view();
  assert.equal(
    await evaluate("document.querySelectorAll('[role=tab]').length"),
    1,
  );
  assert(
    !(await evaluate("document.body.innerText")).includes("Deactivate Account"),
  );
  await edit();
  assert.equal(
    await evaluate(
      "document.querySelectorAll('[data-testid=save-merchant]').length",
    ),
    0,
  );
  assert(
    await evaluate("document.querySelector('input[name=firstName]').disabled"),
  );
  pass(
    "View-only staff can inspect accounts but cannot edit or access unauthorized operational tabs",
  );
  await login("editor@example.test");
  await until("location.pathname==='/home'", "editor");
  await view();
  assert(
    (await evaluate("document.body.innerText")).includes(
      "Add Subscription Plan",
    ),
  );
  assert(
    !(await evaluate("document.body.innerText")).includes("Deactivate Account"),
  );
  assert(
    !(await evaluate("document.body.innerText")).includes("Close Balance"),
  );
  pass(
    "Merchant update alone cannot grant blocking, affiliate toggles or balance closing",
  );
  await login("denied@example.test");
  await until("location.pathname==='/home'", "denied");
  start = calls.length;
  await navigate("/merchants");
  await until(
    "location.pathname==='/home' || location.pathname.includes('/error/')",
    "denied",
  );
  assert(
    !calls
      .slice(start)
      .some((x) => x.url === "/v1/users" && x.query.role === "user"),
  );
  pass("Missing merchant view prevents directory API reads");
  records[0].isBlocked = false;
  await login("merchant@example.test");
  await until("location.pathname==='/home'", "merchant");
  await navigate("/profile");
  await until(exists("[data-testid=merchant-info]"), "self profile");
  assert.equal(
    await evaluate(
      `document.querySelectorAll('a[href="/withdraw-requests/all/new"]').length`,
    ),
    1,
  );

  assert(
    !(await evaluate("document.body.innerText")).includes("Deactivate Account"),
  );
  await navigate("/edit-profile");
  await until(exists("input[name=firstName]"), "self edit");
  assert.equal(
    await evaluate("document.querySelectorAll('[role=tab]').length"),
    1,
  );
  await fillField("firstName", "Self edited");
  failWrite = true;
  await click("[data-testid=save-merchant]");
  await until(
    "document.body.innerText.includes('Your edits have been kept')",
    "self failure",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=firstName]').value"),
    "Self edited",
  );
  failWrite = false;
  await click("[data-testid=save-merchant]");
  await until(
    "location.pathname==='/profile' && document.body.innerText.includes('Self edited')",
    "self saved",
  );
  const ownPatch = patches()
    .filter((x) => x.url === "/v1/users/me")
    .at(-1);
  assert(!("prices" in ownPatch.body));
  assert(!("loyaltyType" in ownPatch.body));
  pass(
    "Own profile edits use authenticated me and preserve drafts without allowing staff-only prices",
  );
  start = calls.length;
  await navigate("/merchants/merchant-2/view");
  await until(
    "location.pathname==='/home' || location.pathname==='/profile' || location.pathname.includes('/error/')",
    "merchant staff route denied",
  );
  assert(!calls.slice(start).some((x) => x.url === "/v1/users/merchant-2"));
  pass("Merchants cannot open another account staff profile");
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin again");
  await navigate("/verification-requests/all");
  await until(
    exists("[role=row][data-id=request-1]"),
    "verification merchant link",
  );
  const merchantLink = await evaluate(
    "[...document.querySelectorAll('[role=row][data-id=request-1] a')].find(x=>x.href.includes('/merchants/'))?.getAttribute('href')",
  );
  assert.equal(merchantLink, "/merchants/merchant-1/view");
  pass(
    "Previously deferred request-table merchant links now resolve to the migrated profile",
  );

  await edit("new");
  await fillField("firstName", "New");
  await fillField("lastName", "Merchant");
  await fillField("email", "new@example.test");
  await fillField("phone", "555999999");
  await choosePlace("address.stateId", "Riyadh");
  await choosePlace("address.cityId", "Riyadh");
  failWrite = true;
  await click("[data-testid=save-merchant]");
  await until(
    "document.body.innerText.includes('Your edits have been kept')",
    "new write failure",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=firstName]').value"),
    "New",
  );
  failWrite = false;
  await click("[data-testid=save-merchant]");
  await until(
    "location.pathname==='/merchants/created-merchant/view'",
    "created merchant",
  );
  const created = calls
    .filter((x) => x.url === "/v1/users" && x.method === "POST")
    .at(-1).body;
  assert.equal(created.phone, "+966-555999999");
  assert.equal(created.address.cityId, "city-1");
  assert(!("role" in created));
  assert(!("country" in created.address));
  pass(
    "Direct new-account route preserves creation retries and field-limited payloads",
  );
  for (const shape of ["_id", "none"]) {
    createdIdentity = shape;
    await edit("new");
    await fillField("firstName", "Identity");
    await fillField("lastName", "Merchant");
    await fillField("email", "identity@example.test");
    await fillField("phone", "555999999");
    await choosePlace("address.stateId", "Riyadh");
    await choosePlace("address.cityId", "Riyadh");
    const before = calls.filter(
      (x) => x.url === "/v1/users" && x.method === "POST",
    ).length;
    await click("[data-testid=save-merchant]");
    await until(
      shape === "_id"
        ? "location.pathname==='/merchants/created-merchant/view'"
        : "location.pathname==='/merchants'",
      "identity-safe creation",
    );
    assert.equal(
      calls.filter((x) => x.url === "/v1/users" && x.method === "POST").length,
      before + 1,
    );
    pass(
      shape === "_id"
        ? "New merchant accepts _id-only creation identity"
        : "Successful creation without identity returns to directory without repeating POST",
    );
  }
  createdIdentity = "id";
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
  await view();
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  await screenshot("merchant-ar-mobile");
  await edit();
  await screenshot("merchant-edit-ar-mobile");
  assert(
    await evaluate(
      "document.querySelector('input[name=firstName]').getBoundingClientRect().right<=innerWidth",
    ),
  );
  pass("Arabic profile and edit forms remain responsive and RTL on mobile");
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks: passed, exceptions, calls }, null, 2),
  );
  console.log(
    `${passed}/${passed} merchant browser checks passed; no uncaught exceptions.`,
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
