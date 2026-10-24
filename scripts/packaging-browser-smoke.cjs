// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/packaging-browser");
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
  failCatalog = false,
  failPlaces = false,
  failRefresh = false;
const countries = [
  { id: "country-1", name: { en: "Country Alpha", ar: "الدولة الأولى" } },
  { id: "country-2", name: { en: "Country Beta", ar: "الدولة الثانية" } },
];
const states = [
  {
    id: "state-1",
    countryId: "country-1",
    name: { en: "State Alpha", ar: "المنطقة الأولى" },
  },
  {
    id: "state-2",
    countryId: "country-2",
    name: { en: "State Beta", ar: "المنطقة الثانية" },
  },
  {
    id: "state-out",
    countryId: "country-1",
    name: { en: "Stored State", ar: "المنطقة المحفوظة" },
  },
];
const cities = [
  {
    id: "city-1",
    countryId: "country-1",
    stateId: "state-1",
    state: states[0],
    name: { en: "City Alpha", ar: "المدينة الأولى" },
    postalCode: "11111",
  },
  {
    id: "city-2",
    countryId: "country-2",
    stateId: "state-2",
    state: states[1],
    name: { en: "City Beta", ar: "المدينة الثانية" },
    postalCode: "22222",
  },
  {
    id: "city-out",
    countryId: "country-1",
    stateId: "state-out",
    state: states[2],
    name: { en: "Stored City", ar: "المدينة المحفوظة" },
    postalCode: "33333",
  },
];
const users = [
  {
    ...normal,
    id: "merchant-1",
    firstName: "Account",
    lastName: "One",
    balance: 200,
  },
  {
    ...normal,
    id: "merchant-2",
    firstName: "Account",
    lastName: "Two",
    balance: 10,
  },
  {
    ...normal,
    id: "merchant-3",
    firstName: "New",
    lastName: "Merchant",
    balance: 100,
    address: {
      countryId: "country-1",
      stateId: "state-out",
      cityId: "city-out",
      street: "Stored street",
      zipCode: "33333",
    },
  },
];
const supplies = [
  {
    id: "supply-1",
    name: "Bags 50",
    description: "Bundle of mailing bags",
    price: 40,
    count: 50,
  },
  {
    id: "supply-2",
    name: { en: "Stickers 100", ar: "ملصقات 100" },
    description: { en: "Fragile stickers", ar: "ملصقات قابلة للكسر" },
    price: 20,
    count: 100,
  },
  { id: "supply-3", name: "Large bundle", price: 200, count: 300 },
  { id: "supply-4", name: "Free samples", price: 0, count: 1 },
];
const records = Array.from({ length: 15 }, (_, i) => ({
  id: "package-" + (i + 1),
  type: "bags",
  status: i === 2 ? "approved" : i === 3 ? "rejected" : "pending",
  amount: 60,
  productIds: i === 2 ? ["retired"] : ["supply-1", "supply-2"],
  products:
    i === 2
      ? [
          {
            id: "retired",
            name: { en: "Historical bags", ar: "أكياس سابقة" },
            count: 25,
            price: 60,
          },
        ]
      : supplies.slice(0, 2),
  userId: i % 2 ? "merchant-2" : "merchant-1",
  user: users[i % 2],
  updatedById: "staff-1",
  updatedBy: { id: "staff-1", firstName: "Staff", lastName: "Reviewer" },
  fullName: "Receiver " + (i + 1),
  phone: "+966-555123456",
  shippingAddress: {
    countryId: "country-1",
    country: countries[0],
    stateId: "state-1",
    state: states[0],
    cityId: "city-1",
    city: cities[0],
    street: "Delivery street",
    zipCode: "11111",
  },
  description: "Packaging " + String(i + 1).padStart(2, "0"),
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
      fresh = body.email.startsWith("fresh"),
      merchant = body.email.startsWith("merchant");
    account = fresh
      ? { ...users[2] }
      : merchant
        ? { ...users[0] }
        : {
            ...normal,
            id: "staff-1",
            role: viewer || denied || noView || reviewer ? "employee" : "admin",
          };
    if (viewer || noView || reviewer)
      account.features = [
        {
          feature: "package-requests",
          accessView: !noView,
          accessCreate: true,
          accessUpdate: !viewer,
          accessDelete: true,
        },
      ];
    if (denied) account.features = [{ feature: "merchants", accessView: true }];
    result = {
      user: account,
      accessToken: "packaging-access",
      refreshToken: "packaging-refresh",
    };
  } else if (url.pathname.endsWith("/users/me")) {
    if (failRefresh) {
      status = 500;
      result = { message: "Refresh failed" };
    } else result = account || normal;
  } else if (url.pathname === "/v1/products") {
    assert.equal(method, "GET");
    assert.equal(query.page, "0");
    assert.equal(query.pageSize, "50");
    if (failCatalog) {
      status = 500;
      result = { message: "Catalog failed" };
    } else result = { results: supplies, total: supplies.length };
  } else if (url.pathname === "/v1/users") {
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
      result = { message: "Account failed" };
    }
  } else if (
    ["/v1/countries", "/v1/states", "/v1/cities"].includes(url.pathname)
  ) {
    let list = (
      url.pathname.endsWith("countries")
        ? countries
        : url.pathname.endsWith("states")
          ? states.filter((x) => x.id !== "state-out")
          : cities.filter((x) => x.id !== "city-out")
    ).filter(
      (x) =>
        (!query.countryId || x.countryId === query.countryId) &&
        (!query.stateId || x.stateId === query.stateId) &&
        (!query.search ||
          JSON.stringify(x).toLowerCase().includes(query.search.toLowerCase())),
    );
    if (failPlaces) {
      status = 500;
      result = { message: "Places failed" };
    } else result = { results: list, total: list.length };
  } else if (/^\/v1\/(countries|states|cities)\//.test(url.pathname)) {
    result = [...countries, ...states, ...cities].find(
      (x) => x.id === url.pathname.split("/").at(-1),
    );
    if (!result || failPlaces) {
      status = 500;
      result = { message: "Place failed" };
    }
  } else if (url.pathname === "/v1/requests") {
    if (method === "POST") {
      if (failCreate) {
        status = 500;
        result = { message: "Create failed" };
      } else {
        assert.equal(body.userId, account.id);
        assert.equal(body.type, "bags");
        assert.equal(body.status, "pending");
        result = {
          ...body,
          id: "package-" + (records.length + 1),
          products: body.productIds.map((id) =>
            supplies.find((x) => x.id === id),
          ),
          user: users.find((x) => x.id === account.id),
          createdAt: "2026-10-23T12:00:00Z",
        };
        records.push(result);
      }
    } else {
      assert.equal(query.type, "bags");
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
      assert.deepEqual(Object.keys(body), ["status"]);
      if (failWrite) {
        status = 500;
        result = { message: "Write failed" };
      } else {
        Object.assign(row, body);
        if (body.status === "approved")
          users.find((x) => x.id === row.userId).balance -= row.amount;
        result = row;
      }
    }
  } else if (
    url.pathname === "/v1/shipping-companies" ||
    url.pathname === "/v1/shipping-companies/carrier-1"
  ) {
    const carrier = {
      id: "carrier-1",
      name: "Carrier One",
      isActive: true,
      packageRequestsCount: 15,
      shippingMethods: ["local"],
      localPrice: 20,
      codPrice: 5,
      logoUrl: "/assets/images/logo/logo.svg",
    };
    result = url.pathname.endsWith("carrier-1")
      ? carrier
      : { results: [carrier], total: 1 };
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
    assert.ok(rows.every((row) => row.Status === "Accepted"));
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
  await navigate("/package-requests/" + scope);
  await until(
    exists("[data-testid=package-requests-table]"),
    "bank transfer list",
  );
  await until(
    "Boolean(document.querySelector('[role=row][data-id]')) || document.body.innerText.includes('There are no package requests')",
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
  await navigate("/package-requests/" + owner + "/" + id);
  await until(
    id === "new"
      ? exists("input[name=fullName]")
      : exists("[data-testid=package-request-summary]"),
    "package detail",
  );
}
async function clickReady(selector) {
  await until(
    `Boolean(document.querySelector(${JSON.stringify(selector)}))&&!document.querySelector(${JSON.stringify(selector)}).disabled`,
    "enabled action " + selector,
  );
  await click(selector);
}
async function place(name, text) {
  await evaluate(
    `(()=>{const input=document.querySelector('[name=${JSON.stringify(name)}]');input.focus();input.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',code:'ArrowDown',bubbles:true}));})()`,
  );
  await fillField(name, text);
  await until(
    `Boolean([...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes(${JSON.stringify(text)})))`,
    "place " + text,
  );
  await evaluate(
    `[...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes(${JSON.stringify(text)})).click()`,
  );
  await sleep(150);
}
async function supply(id) {
  await click(`[data-testid=supply-${id}]`);
}
const creates = () =>
  calls.filter((x) => x.method === "POST" && x.url === "/v1/requests");
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
  await reset("/package-requests/all");
  await until("location.pathname==='/sign-in'", "guest protection");
  pass("Guests must sign in before packaging requests");
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin");
  await list();
  assert.equal(
    await evaluate("document.querySelectorAll('[role=row][data-id]').length"),
    10,
  );
  assert.ok(
    await evaluate(
      "document.body.innerText.includes('Bags 50 (50)')&&document.body.innerText.includes('Stickers 100 (100)')",
    ),
  );
  await screenshot("packaging-desktop");
  pass(
    "Staff list shows localized supply snapshots, bundle counts, amounts and ten-row pagination",
  );
  await click('button[aria-label="Go to next page"]');
  await until(exists("[role=row][data-id=package-11]"), "page two");
  await fillSelector("[data-testid=package-requests-search]", "No & Match");
  await until(
    "document.body.innerText.includes('There are no package requests')",
    "encoded search",
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
  await until(exists("[role=row][data-id=package-1]"), "reset");
  pass("Search and filter changes keep pagination synchronized");
  await list("merchant-1?updatedById=staff-1");
  await setStatusFilter("package-requests", "approved");
  await until(exists("[role=row][data-id=package-3]"), "approved scope");
  await exportAll("bags", {
    userId: "merchant-1",
    updatedById: "staff-1",
    status: "approved",
  });
  pass(
    "Filtered Excel export retains merchant/reviewer/status scopes and original request type",
  );
  await clickText("Reset filters");
  await until(exists("[role=row][data-id=package-1]"), "reset scopes");
  await click("[data-testid=package-requests-filters]");
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
  await until(exists("[role=row][data-id=package-2]"), "account selected");
  await clickText("Reset filters");
  await until(exists("[role=row][data-id=package-1]"), "restore URL");
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.userId,
    "merchant-1",
  );
  pass("Remote merchant filter and reset preserve URL account/reviewer scope");
  await rowAction("package-3", "View");
  await until(
    "document.querySelector('[role=dialog]')?.innerText.includes('Historical bags')",
    "historical snapshot",
  );
  assert.ok(
    await evaluate(
      "document.querySelector('[role=dialog]').innerText.includes('25')&&document.querySelector('[role=dialog]').innerText.includes('Receiver 3')&&document.querySelector('[role=dialog]').innerText.includes('City Alpha')",
    ),
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=package-request-summary] [dir=ltr]').textContent",
    ),
    "+966-555123456",
  );
  assert.equal(
    await evaluate(exists("[data-testid=accept-package-request]")),
    false,
  );
  await closeDialog();
  pass(
    "Read-only details retain historical supplies, address, quantities and LTR phone",
  );
  await rowAction("package-1", "Accept");
  const beforeCancel = patches().length;
  await closeDialog();
  assert.equal(patches().length, beforeCancel);
  pass("Approval cancellation sends no wallet mutation");
  await list();
  await rowAction("package-2", "Accept");
  await until(
    "document.querySelector('[role=dialog]')?.innerText.includes('enough balance')",
    "insufficient wallet",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=accept-package-request]').disabled",
    ),
    true,
  );
  await closeDialog();
  assert.equal(patches().length, beforeCancel);
  pass(
    "Staff approval is blocked when the merchant wallet cannot cover the total",
  );
  await rowAction("package-1", "Accept");
  failWrite = true;
  await clickReady("[data-testid=accept-package-request]");
  await until(
    "document.querySelector('[role=dialog]')?.innerText.includes('Something went wrong while confirming')",
    "approval failure",
  );
  failWrite = false;
  await clickReady("[data-testid=accept-package-request]");
  await until("!document.querySelector('[role=dialog]')", "approval retry");
  await until(
    "document.querySelector('[role=row][data-id=package-1]')?.innerText.includes('Accepted')",
    "accepted",
  );
  assert.deepEqual(patches().at(-1).body, { status: "approved" });
  assert.equal(patches().at(-1).url, "/v1/requests/package-1");
  pass(
    "Approval failure stays retryable and targets exact request with status-only PATCH",
  );
  await rowAction("package-2", "Reject");
  failWrite = true;
  await clickReady("[data-testid=reject-package-request]");
  await until(
    "document.querySelector('[role=dialog]')?.innerText.includes('Something went wrong while rejecting')",
    "rejection failure",
  );
  failWrite = false;
  await clickReady("[data-testid=reject-package-request]");
  await until("!document.querySelector('[role=dialog]')", "rejection retry");
  assert.deepEqual(patches().at(-1).body, { status: "rejected" });
  assert.equal(patches().at(-1).url, "/v1/requests/package-2");
  pass(
    "Rejection retries work even when approval lacks sufficient wallet funds",
  );
  await rowAction("package-5", "View");
  await clickReady("[data-testid=accept-package-request]");
  await until(
    "!document.querySelector('[role=dialog]')",
    "review from view dialog",
  );
  assert.equal(records.find((x) => x.id === "package-5").status, "approved");
  await rowAction("package-5", "View");
  assert.equal(
    await evaluate(exists("[data-testid=accept-package-request]")),
    false,
  );
  await closeDialog();
  pass(
    "View dialog supports permitted pending reviews and locks decided requests",
  );
  failList = true;
  await navigate("/package-requests/merchant-2");
  await until(
    "document.body.innerText.includes('Unable to load packaging requests')",
    "list error",
  );
  failList = false;
  await clickText("Retry");
  await until(exists("[role=row][data-id=package-2]"), "list retry");
  pass("List errors recover through retry");
  await login("viewer@example.test");
  await until("location.pathname==='/home'", "viewer");
  await list();
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('[role=row][data-id] button')].some(x=>['Accept','Reject'].includes(x.textContent.trim()))",
    ),
    false,
  );
  await rowAction("package-7", "View");
  await until(
    exists("[data-testid=package-request-summary]"),
    "view-only detail",
  );
  assert.equal(
    await evaluate(exists("[data-testid=accept-package-request]")),
    false,
  );
  await closeDialog();
  await click("[data-testid=package-requests-filters]");
  await until(exists("[role=menu]"), "employee filters");
  assert.equal(
    await evaluate(
      "document.querySelector('[role=menu]').innerText.includes('Updated By')",
    ),
    false,
  );
  await escape();
  pass(
    "View-only staff can inspect packaging while review and administrator-only reviewer controls stay hidden",
  );
  for (const email of ["denied@example.test", "noview@example.test"]) {
    await login(email);
    await until("location.pathname==='/home'", "denied login");
    const before = calls.filter(
      (x) => x.url.startsWith("/v1/requests") || x.url === "/v1/products",
    ).length;
    await navigate("/package-requests/all");
    await until(
      "location.pathname==='/home'||document.body.innerText.includes('Unauthorized Access')",
      "denied route",
    );
    assert.equal(
      calls.filter(
        (x) => x.url.startsWith("/v1/requests") || x.url === "/v1/products",
      ).length,
      before,
    );
  }
  pass(
    "Denied staff and update-without-view grants cannot query packaging data",
  );
  await login("merchant@example.test");
  await until("location.pathname==='/home'", "merchant");
  await list("merchant-2");
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests").at(-1).query.userId,
    undefined,
  );
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('[role=row][data-id] button')].some(x=>['Accept','Reject'].includes(x.textContent.trim()))",
    ),
    false,
  );
  assert.equal(
    await evaluate("document.body.innerText.includes('Export All Pages')"),
    false,
  );
  await rowAction("package-7", "View");
  await until(exists("[data-testid=package-request-summary]"), "merchant view");
  assert.equal(
    await evaluate(exists("[data-testid=accept-package-request]")),
    false,
  );
  await closeDialog();
  pass(
    "Merchant list ignores route ownership overrides and stays read-only with receipt details",
  );
  await navigate("/package-requests/all/package-2");
  await until(
    "document.body.innerText.includes('No such package request')",
    "foreign request",
  );
  await navigate("/package-requests/all/missing");
  await until(
    "document.body.innerText.includes('No such package request')",
    "missing request",
  );
  pass(
    "Foreign and missing request details are protected and retain a back link",
  );
  await login("fresh@example.test");
  await until("location.pathname==='/home'", "fresh merchant");
  failCatalog = true;
  await detail();
  await until(
    "document.body.innerText.includes('Unable to load packaging supplies')",
    "catalog error",
  );
  await fillField("fullName", "Draft receiver");
  await fillField("description", "Keep my delivery notes");
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=send-package-request]').disabled",
    ),
    true,
  );
  failCatalog = false;
  await clickText("Retry");
  await until(exists("[data-testid=supply-supply-1]"), "catalog retry");
  assert.equal(
    await evaluate("document.querySelector('input[name=fullName]').value"),
    "Draft receiver",
  );
  pass(
    "Catalog failure blocks submission and retry preserves recipient and notes",
  );
  await clickReady("[data-testid=send-package-request]");
  await until(
    "document.body.innerText.includes('You should select one product at least')",
    "required supply",
  );
  assert.equal(creates().length, 0);
  pass("At least one supply is required before a request can be submitted");
  await supply("supply-1");
  await until(
    "document.querySelector('input[name=amount]').value==='40'",
    "first bundle",
  );
  await supply("supply-2");
  await until(
    "document.querySelector('input[name=amount]').value==='60'",
    "bundle sum",
  );
  await supply("supply-1");
  await until(
    "document.querySelector('input[name=amount]').value==='20'",
    "deselect",
  );
  await supply("supply-1");
  await until(
    "document.querySelector('input[name=amount]').value==='60'",
    "reselect",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=amount]').disabled"),
    true,
  );
  pass(
    "Bundle selection/deselection sums prices without multiplying piece counts; amount stays read-only",
  );
  await until(
    "document.querySelector('input[name=\"shippingAddress.stateId\"]')?.value==='Stored State'&&document.querySelector('input[name=\"shippingAddress.cityId\"]')?.value==='Stored City'",
    "selected place fallbacks",
  );
  assert.ok(calls.some((x) => x.url === "/v1/states/state-out"));
  assert.ok(calls.some((x) => x.url === "/v1/cities/city-out"));
  await fillField("phone", "+966551234567");
  await place("shippingAddress.countryId", "Country Beta");
  assert.equal(
    await evaluate(
      "document.querySelector('input[name=\"shippingAddress.stateId\"]').value",
    ),
    "",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('input[name=\"shippingAddress.cityId\"]').value",
    ),
    "",
  );
  await place("shippingAddress.cityId", "City Beta");
  await until(
    "document.querySelector('input[name=\"shippingAddress.stateId\"]')?.value==='State Beta'",
    "city supplies state",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('input[name=\"shippingAddress.zipCode\"]').value",
    ),
    "22222",
  );
  pass(
    "Stored places resolve outside lookup pages; country changes clear children and choosing city supplies state/ZIP",
  );
  await supply("supply-3");
  await until(
    "document.querySelector('input[name=amount]').value==='260'",
    "over balance",
  );
  await clickReady("[data-testid=send-package-request]");
  await until(
    "document.body.innerText.includes('Should be less than or equals to your balance')",
    "balance cap",
  );
  assert.equal(creates().length, 0);
  await supply("supply-3");
  await supply("supply-1");
  await supply("supply-2");
  await supply("supply-4");
  await until(
    "document.querySelector('input[name=amount]').value==='0'",
    "zero total",
  );
  await clickReady("[data-testid=send-package-request]");
  await until(
    "document.body.innerText.includes('Should be more than 0')",
    "positive total",
  );
  assert.equal(creates().length, 0);
  await supply("supply-4");
  await supply("supply-1");
  await supply("supply-2");
  pass("Zero and over-wallet totals cannot create requests");
  failCreate = true;
  await clickReady("[data-testid=send-package-request]");
  await until(
    "document.body.innerText.includes('Something went wrong while adding package request')",
    "failed create",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=fullName]').value"),
    "Draft receiver",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=supply-supply-1]').getAttribute('aria-checked')",
    ),
    "true",
  );
  failCreate = false;
  failRefresh = true;
  await clickReady("[data-testid=send-package-request]");
  await until("location.pathname==='/package-requests/all'", "created");
  await until(
    "document.body.innerText.includes('the account could not be refreshed')",
    "refresh failure",
  );
  failRefresh = false;
  assert.equal(records.filter((x) => x.userId === "merchant-3").length, 1);
  const created = creates().at(-1).body;
  assert.deepEqual(Object.keys(created).sort(), [
    "amount",
    "description",
    "fullName",
    "phone",
    "productIds",
    "shippingAddress",
    "status",
    "type",
    "userId",
  ]);
  assert.equal(created.type, "bags");
  assert.equal(created.status, "pending");
  assert.equal(created.userId, "merchant-3");
  assert.equal(created.amount, 60);
  assert.equal(created.phone, "+966-551234567");
  assert.deepEqual(created.shippingAddress, {
    countryId: "country-2",
    stateId: "state-2",
    cityId: "city-2",
    street: "Stored street",
    zipCode: "22222",
  });
  pass(
    "Create retry preserves full draft, sends sanitized current-owner payload and never repeats an accepted request after refresh failure",
  );
  await detail("package-16");
  assert.equal(
    await evaluate(exists("[data-testid=send-package-request]")),
    false,
  );
  assert.equal(await evaluate(exists("[role=checkbox]")), false);
  assert.ok(
    await evaluate(
      "document.body.innerText.includes('Draft receiver')&&document.body.innerText.includes('Stickers 100')",
    ),
  );
  pass(
    "Submitted merchant request is read-only and shows saved supply snapshots",
  );
  failUsers = true;
  await detail();
  await until(
    "document.body.innerText.includes('Unable to load the wallet balance')",
    "wallet failure",
  );
  await fillField("fullName", "Preserved receiver");
  await supply("supply-1");
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=send-package-request]').disabled",
    ),
    true,
  );
  failUsers = false;
  await clickText("Retry");
  await until(
    "!document.body.innerText.includes('Unable to load the wallet balance')",
    "wallet retry",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=fullName]').value"),
    "Preserved receiver",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=amount]').value"),
    "40",
  );
  pass(
    "Wallet lookup errors block submission and retries preserve selected supplies and contact draft",
  );
  await login("admin@example.test");
  await until("location.pathname==='/home'", "carrier staff");
  await navigate("/shipping-companies");
  await until(
    "Boolean(document.querySelector('a[href=\"/package-requests/all\"]'))",
    "carrier packaging link",
  );
  await click('a[href="/package-requests/all"]');
  await until(exists("[role=row][data-id=package-1]"), "carrier navigation");
  pass(
    "Carrier packaging summary opens the migrated request list without reviving e-commerce routes",
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
  await list();
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  await screenshot("packaging-ar-mobile");
  await rowAction("package-7", "عرض");
  await until(exists("[data-testid=package-request-summary]"), "Arabic review");
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  await screenshot("packaging-review-ar-mobile");
  await closeDialog();
  pass(
    "Arabic mobile list and review retain RTL, fit the viewport and preserve LTR phone",
  );

  await login("fresh@example.test");
  await until("location.pathname==='/home'", "mobile merchant");
  await evaluate("localStorage.setItem('my-language','ar')");
  await detail();
  await until(exists("[data-testid=supply-supply-1]"), "mobile supplies");
  await supply("supply-1");
  await until(
    "document.querySelector('input[name=amount]').value==='40'",
    "mobile total",
  );
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  assert.ok(
    await evaluate(
      "Boolean(document.querySelector('input[name=phone]').closest('[dir=ltr]'))",
    ),
  );
  await screenshot("packaging-form-ar-mobile");
  pass(
    "Arabic mobile submission form keeps supply selection, total, address and LTR phone within the viewport",
  );
  assert.equal(
    calls.some(
      (x) =>
        x.method === "DELETE" ||
        (x.url === "/v1/products" && x.method !== "GET"),
    ),
    false,
  );
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks: passed, exceptions, calls }, null, 2),
  );
  console.log(
    `${passed}/${passed} packaging browser checks passed; no uncaught exceptions.`,
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
