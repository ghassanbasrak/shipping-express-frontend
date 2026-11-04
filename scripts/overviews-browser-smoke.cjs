// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/overviews-browser");
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

let passed = 0;
const pass = (name) => {
  passed++;
  console.log("PASS " + name);
};
const failures = new Set();
let missingMetrics = false,
  emptyRanking = false,
  emptyShipments = false,
  malformedLists = false,
  foreignAccount = false,
  delayOldPeriod = false,
  wallet = 1360.5;
const carriers = [
  {
    id: "carrier-1",
    name: "Aramex",
    isActive: true,
    localPrice: 25,
    codPrice: 30,
    fuelPercentage: 11.5,
    shippingMethods: ["local", "international"],
  },
  {
    id: "carrier-2",
    name: "SMSA",
    isActive: true,
    localPrice: 23,
    codPrice: 27,
    shippingMethods: ["local", "cashOnDelivery"],
  },
  {
    id: "carrier-3",
    name: "DHL Express",
    isActive: true,
    shippingMethods: ["international"],
  },
  {
    id: "carrier-4",
    name: "Inactive carrier",
    isActive: false,
    localPrice: 1,
    shippingMethods: ["local"],
  },
];
const ownAccount = () => ({
  ...account,
  id: foreignAccount ? "foreign-account" : account?.id,
  balance: wallet,
  codBalance: 2450,
  loyaltyType: "custom",
  prices: [{ shippingCompanyId: "carrier-1", localPrice: 18 }],
});
const shipments = () => [
  {
    id: "shipment-1",
    userId: account.id,
    shippingCompanyId: "carrier-1",
    shippingCompany: carriers[0],
    method: "local",
    trackingNumber: "AX-104928",
    status: "processing",
    shipmentDetails: { id: "detail-1", receiverName: "Sara Al-Qahtani" },
    createdAt: "2026-10-25T12:00:00Z",
  },
  {
    id: "shipment-2",
    userId: account.id,
    shippingCompanyId: "carrier-2",
    shippingCompany: carriers[1],
    method: "local",
    trackingNumber: "SM-104903",
    status: "delivered",
    shipmentDetails: { receiverName: "Omar Khaled" },
    createdAt: "2026-10-24T12:00:00Z",
  },
  {
    id: "shipment-3",
    userId: account.id,
    shippingCompanyId: "carrier-3",
    shippingCompany: carriers[2],
    method: "international",
    trackingNumber: "DH-104877",
    status: "pending",
    shipmentDetails: { receiverName: "Lina Hassan" },
    createdAt: "2026-10-23T12:00:00Z",
  },
  {
    id: "foreign-shipment",
    userId: "someone-else",
    trackingNumber: "FOREIGN-SECRET",
    shipmentDetails: { receiverName: "Foreign name" },
  },
  {
    id: "shipment-4",
    userId: account.id,
    shippingCompanyId: "carrier-1",
    shippingCompany: carriers[0],
    method: "local",
    trackingNumber: "AX-104821",
    status: "returned",
    shipmentDetails: { receiverName: "Khaled Ali" },
    createdAt: "2026-10-22T12:00:00Z",
  },
];
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
  calls.push({ url: url.pathname, method, query, body });
  let result = {},
    status = 200;
  if (url.pathname === "/v1/auth-sessions/login") {
    const kind = body.email.split("@")[0];
    account = {
      ...normal,
      id:
        kind === "merchant2"
          ? "merchant-2"
          : kind.startsWith("merchant")
            ? "merchant-1"
            : "staff-1",
      email: body.email,
      firstName: kind.startsWith("merchant") ? "Noura" : "Majd",
      lastName: "Merchant",
      role: kind.startsWith("merchant")
        ? "user"
        : kind === "employee"
          ? "employee"
          : "admin",
    };
    if (kind === "restricted")
      account.features = [
        { feature: "dashboard", accessView: true },
        { feature: "shipments", accessView: true },
      ];
    if (kind === "noview")
      account.features = [{ feature: "dashboard", accessUpdate: true }];
    if (kind === "employee")
      account.features = [
        { feature: "shipments", accessView: true },
        { feature: "transactions", accessView: true },
        { feature: "dashboard", accessView: true },
      ];
    result = {
      user: account,
      accessToken: "overview-access",
      refreshToken: "overview-refresh",
    };
  } else if (failures.has(url.pathname)) {
    status = 500;
    result = { message: "Unavailable" };
  } else if (url.pathname === "/v1/users/me") {
    if (!account) status = 401;
    else result = ownAccount();
  } else if (url.pathname === "/v1/admin/merchants/active-summary") {
    result = missingMetrics
      ? {}
      : {
          activeMerchants: query.period === "today" ? 5 : 42,
          activeMerchantsChange: 12.5,
        };
  } else if (url.pathname === "/v1/shipments/admin/shipments/total-summary") {
    if (delayOldPeriod && query.period === "last_month") await sleep(650);
    result = missingMetrics
      ? { total: 0 }
      : {
          total:
            query.status === "delivered"
              ? 310
              : query.period === "today"
                ? 111
                : query.period === "last_month"
                  ? 905
                  : 1284,
          change: 8.2,
        };
  } else if (url.pathname === "/v1/admin/revenue/summary") {
    result = missingMetrics
      ? { revenue: 0 }
      : { revenue: 36500.5, currency: "EUR", change: -2.3 };
  } else if (url.pathname === "/v1/admin/revenue/growth") {
    result = missingMetrics ? {} : { growth: 12.4, period: query.period };
  } else if (url.pathname === "/v1/shipments/admin/shipments/process-flow") {
    result = {
      local: {
        order: 500,
        processing: 120,
        delivered: 310,
        canceled: 20,
        returned: 7,
      },
      international: {
        order: 180,
        processing: 28,
        delivered: 140,
        canceled: 3,
        returned: 2,
      },
      cod: {
        order: 260,
        processing: 60,
        delivered: 170,
        canceled: 12,
        returned: 8,
        refundedToCustomer: 90,
      },
    };
  } else if (url.pathname === "/v1/admin/merchants/top-performance") {
    result = {
      data: emptyRanking
        ? []
        : [
            {
              merchant_name: "Al Noor Trading",
              orders_count: 320,
              total_sales: 15400.25,
              growth_percentage: 12.5,
            },
            {
              merchant_name: "Riyadh Supplies",
              orders_count: 240,
              total_sales: 11240.5,
              growth_percentage: 7.4,
              currency: "SAR",
            },
            {
              merchant_name: "Blue Palm Store",
              orders_count: 186,
              total_sales: 8900,
              growth_percentage: -2.1,
            },
            {
              merchant_name: "Madar Company",
              orders_count: 152,
              total_sales: 7240,
              growth_percentage: 4.8,
            },
            {
              merchant_name: "Nakhla Trading",
              orders_count: 118,
              total_sales: 6080,
              growth_percentage: 0,
            },
          ],
    };
  } else if (url.pathname === "/v1/admin/dashboard/alerts") {
    result = {
      data: {
        urgent_support_tickets: 0,
        shipments_delayed: 4,
        merchants_need_approval: 3,
      },
    };
  } else if (url.pathname === "/v1/admin/dashboard/recent-activity") {
    result = {
      new_orders: 134,
      shipments_sent: 99,
      deliveries_completed: 75,
      new_merchants: 7,
      time_filter: query.time_filter,
    };
  } else if (url.pathname === "/v1/shipping-companies") {
    result = malformedLists
      ? { results: {} }
      : { results: carriers, total: carriers.length };
  } else if (url.pathname === "/v1/configs") {
    result = missingMetrics
      ? { activeShipments: 0, localShipments: 0 }
      : {
          activeShipments: 24,
          canceledShipments: 3,
          localShipments: 186,
          internationalShipments: 42,
        };
  } else if (url.pathname === "/v1/shipments") {
    result = malformedLists
      ? {}
      : { results: emptyShipments ? [] : shipments(), total: 5 };
  }
  return fulfill(event, status, result);
}
const adminReads = () =>
  calls.filter(
    (c) =>
      c.url.startsWith("/v1/admin/") ||
      c.url.startsWith("/v1/shipments/admin/"),
  );
const last = (path) => calls.filter((c) => c.url === path).at(-1);
async function select(selector, value) {
  await evaluate(
    `(()=>{const input=document.querySelector(${JSON.stringify(selector)});if(!input)throw new Error('Missing select');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
}
async function loaded(selector) {
  await until(exists(selector), selector);
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
    width: 1600,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate("/dashboard");
  await until(
    "location.pathname==='/sign-in' && !!document.querySelector('input[name=email]')",
    "guest dashboard",
  );
  assert.equal(adminReads().length, 0);
  pass("Guests cannot load the administrator overview");
  await login("admin@example.test");
  await loaded("[data-testid=administrator-dashboard]");
  await until(
    "document.querySelector('[data-testid=metric-total-shipments]')?.textContent.includes('1,284')",
    "dashboard metrics",
  );
  await loaded("[data-testid=merchant-rank-0]");
  await screenshot("administrator-dashboard-en-desktop");
  pass(
    "Administrator landing renders redesigned overview and real endpoint metrics",
  );
  assert.equal(last("/v1/admin/revenue/summary").query.period, "month");
  assert.equal(
    last("/v1/admin/merchants/active-summary").query.period,
    "last_week",
  );
  assert(
    (
      await evaluate(
        "document.querySelector('[data-testid=metric-revenue]').textContent",
      )
    ).includes("EUR"),
  );
  pass("Revenue keeps independent month period and its reported currency");
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=attention-pending_payments]').textContent",
    ),
    "—",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=attention-urgent_support_tickets]').textContent",
    ),
    "0",
  );
  pass("Missing attention counts remain distinct from real zero values");
  await select("[data-testid=dashboard-period]", "yesterday");
  await until(
    "Boolean(document.querySelector('[data-testid=metric-active-merchants] .ov-updated'))",
    "period settled",
  );
  await until(
    "document.querySelector('[data-testid=dashboard-activity]')?.textContent.includes('Yesterday')",
    "activity scope",
  );
  assert.equal(
    last("/v1/admin/dashboard/recent-activity").query.time_filter,
    "yesterday",
  );
  assert.equal(last("/v1/admin/revenue/summary").query.period, "month");
  pass(
    "Operations filter changes supported activity requests without altering the financial period",
  );
  await select("[data-testid=dashboard-revenue-period]", "quarter");
  await until(
    "document.querySelector('[data-testid=metric-revenue]')?.textContent.includes('Quarter') && !!document.querySelector('[data-testid=metric-revenue] .ov-updated')",
    "revenue quarter",
  );
  assert.equal(last("/v1/admin/revenue/summary").query.period, "quarter");
  pass("Financial period uses the revenue endpoint supported quarter value");
  await fillSelector("[data-testid=dashboard-carrier]", "Aramex");
  await until(exists("[role=option]"), "carrier option");
  await click("[role=option]");
  await until(
    "document.querySelector('[data-testid=metric-active-merchants]')?.textContent.includes('Aramex') && !!document.querySelector('[data-testid=metric-active-merchants] .ov-updated')",
    "carrier metrics",
  );
  assert.equal(last("/v1/admin/revenue/summary").query.companyId, "carrier-1");
  assert.equal(
    last("/v1/admin/merchants/active-summary").query.companyId,
    "carrier-1",
  );
  assert(!("companyId" in last("/v1/admin/merchants/top-performance").query));
  assert(
    (
      await evaluate(
        "document.querySelector('[data-testid=merchant-performance]').textContent",
      )
    ).includes("All carriers"),
  );
  pass(
    "Carrier filter applies only to supported metrics and all-carrier sections retain explicit scope",
  );
  await click("[data-testid=flow-international]");
  await until(
    "document.querySelector('[data-testid=stage-order]')?.textContent.includes('180')",
    "international stages",
  );
  assert.equal(
    last("/v1/shipments/admin/shipments/process-flow").query.types,
    "international",
  );
  assert.equal(
    last("/v1/shipments/admin/shipments/process-flow").query.companyId,
    "carrier-1",
  );
  pass("Shipment stages switch cleanly between local and international counts");
  await click("[data-testid=flow-cod]");
  await until(exists("[data-testid=stage-refundedToCustomer]"), "cod stages");
  assert(
    !("companyId" in last("/v1/shipments/admin/shipments/process-flow").query),
  );
  assert(
    (
      await evaluate(
        "document.querySelector('[data-testid=shipment-stages]').textContent",
      )
    ).includes("all carriers"),
  );
  pass(
    "COD stages preserve the source all-carrier scope and show its own refund stage",
  );
  await select("[data-testid=dashboard-shipment-status]", "delivered");
  await until(
    "document.querySelector('[data-testid=metric-total-shipments]')?.textContent.includes('310')",
    "shipment status",
  );
  assert.equal(
    last("/v1/shipments/admin/shipments/total-summary").query.status,
    "delivered",
  );
  pass("Status filter changes only the shipment total query");
  await select("[data-testid=dashboard-rank-sort]", "growth");
  await select("[data-testid=dashboard-rank-limit]", "10");
  await until(
    "!document.querySelector('[data-testid=merchant-performance] .ov-update')",
    "ranking settled",
  );
  assert.equal(
    last("/v1/admin/merchants/top-performance").query.sortBy,
    "growth",
  );
  assert.equal(last("/v1/admin/merchants/top-performance").query.limit, "10");
  pass("Merchant ranking retains working sort and row limit controls");
  failures.add("/v1/admin/revenue/summary");
  await select("[data-testid=dashboard-revenue-period]", "year");
  await until(
    "document.querySelector('[data-testid=metric-revenue]')?.textContent.includes('could not be loaded')",
    "revenue failure",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=metric-revenue] .ov-metric-value').textContent",
    ),
    "—",
  );
  assert(
    (
      await evaluate(
        "document.querySelector('[data-testid=metric-total-shipments]').textContent",
      )
    ).includes("310"),
  );
  failures.delete("/v1/admin/revenue/summary");
  await clickText("Retry", "[data-testid=metric-revenue] button");
  await until(
    "document.querySelector('[data-testid=metric-revenue]')?.textContent.includes('EUR')",
    "revenue retry",
  );
  pass(
    "A failed metric shows unavailable with local retry while independent sections remain usable",
  );
  failures.add("/v1/admin/merchants/active-summary");
  await click("[data-testid=overview-refresh]");
  await until(
    "document.querySelector('[data-testid=metric-active-merchants]')?.textContent.includes('Last successful data')",
    "refresh failure",
  );
  assert(
    (
      await evaluate(
        "document.querySelector('[data-testid=metric-active-merchants] .ov-metric-value').textContent",
      )
    ).includes("42"),
  );
  failures.delete("/v1/admin/merchants/active-summary");
  await clickText("Retry", "[data-testid=metric-active-merchants] button");
  await until(
    "!document.querySelector('[data-testid=metric-active-merchants] .ov-query-error')",
    "metric recovered",
  );
  pass("Refresh failures retain clearly labeled last successful metric values");
  await select("[data-testid=dashboard-shipment-status]", "all");
  delayOldPeriod = true;
  await select("[data-testid=dashboard-period]", "last_month");
  await select("[data-testid=dashboard-period]", "today");
  await until(
    "document.querySelector('[data-testid=metric-total-shipments] .ov-metric-value')?.textContent==='111'",
    "new response",
  );
  await sleep(850);
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=metric-total-shipments] .ov-metric-value').textContent",
    ),
    "111",
  );
  delayOldPeriod = false;
  pass(
    "Late responses from previous filters cannot replace current-scope metrics",
  );
  missingMetrics = true;
  emptyRanking = true;
  await click("[data-testid=overview-refresh]");
  await until(
    "document.querySelector('[data-testid=metric-active-merchants] .ov-metric-value')?.textContent==='—'",
    "missing data",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=metric-total-shipments] .ov-metric-value').textContent",
    ),
    "0",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=metric-growth] .ov-metric-value').textContent",
    ),
    "—",
  );
  await until(
    "document.querySelector('[data-testid=merchant-performance]')?.textContent.includes('No merchant activity')",
    "empty rank",
  );
  pass(
    "Successful missing/empty payloads do not invent zero metrics or placeholder ranking rows",
  );
  missingMetrics = false;
  emptyRanking = false;
  await login("restricted@example.test");
  await loaded("[data-testid=administrator-dashboard]");
  assert.equal(
    await evaluate(
      "document.querySelectorAll('[data-testid=merchant-performance] a[href=\"/merchants\"]').length",
    ),
    0,
  );
  pass(
    "Dashboard aggregate permission does not grant unrelated merchant navigation",
  );
  await login("employee@example.test");
  await loaded("[data-testid=staff-home]");
  let start = calls.length;
  await navigate("/dashboard");
  await until(
    "location.pathname==='/home' || location.pathname.includes('/error/')",
    "employee dashboard denied",
  );
  assert.equal(
    calls
      .slice(start)
      .filter(
        (c) =>
          c.url.startsWith("/v1/admin/") || c.url.includes("/shipments/admin/"),
      ).length,
    0,
  );
  await navigate("/home");
  await loaded("[data-testid=staff-home]");
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.ov-quick-action[href=\"/merchants\"]').length",
    ),
    0,
  );
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.ov-quick-action[href=\"/shipments/all/all\"]').length",
    ),
    1,
  );
  pass(
    "Employees receive a useful permitted workspace without administrator API access",
  );
  start = calls.length;
  await login("noview@example.test");
  await loaded("[data-testid=staff-home]");
  assert(
    !calls
      .slice(start)
      .some(
        (c) =>
          c.url.startsWith("/v1/admin/") || c.url.includes("/shipments/admin/"),
      ),
  );
  pass("Administrator role without dashboard view cannot load aggregate data");
  start = calls.length;
  await login("merchant@example.test");
  await loaded("[data-testid=merchant-home]");
  await until(
    "document.querySelector('[data-testid=home-wallet]')?.textContent.includes('1,360.50')",
    "own wallet",
  );
  await loaded("[data-testid=home-shipment-shipment-1]");
  await until(
    "document.querySelector('[data-testid=home-carrier-options]')?.textContent.includes('18.00')",
    "custom price",
  );
  assert(
    !calls
      .slice(start)
      .some(
        (c) =>
          c.url.startsWith("/v1/admin/") || c.url.includes("/shipments/admin/"),
      ),
  );
  await screenshot("merchant-home-en-desktop");
  pass(
    "Merchant home loads fresh own-account balances, totals, recent shipments and carrier options",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=home-new-shipment]').getAttribute('href')",
    ),
    "/shipments/all/all/new",
  );
  assert.equal(
    await evaluate(
      "document.querySelectorAll('a[href=\"/withdraw-requests/all/new\"]').length",
    ),
    1,
  );
  assert(
    (
      await evaluate(
        "document.querySelector('[data-testid=home-cod-balance]').textContent",
      )
    ).includes("can differ"),
  );
  pass(
    "Create, quote, top-up and withdrawal actions use migrated routes with clear COD eligibility wording",
  );
  assert(
    !(
      await evaluate(
        "document.querySelector('[data-testid=home-recent-shipments]').textContent",
      )
    ).includes("FOREIGN-SECRET"),
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=home-shipment-shipment-1] a').getAttribute('href')",
    ),
    "/shipments/carrier-1/local/shipment-1/view",
  );
  pass(
    "Recent shipments preserve owning IDs and never display explicit foreign account rows",
  );
  assert(
    !(
      await evaluate(
        "document.querySelector('[data-testid=home-carrier-options]').textContent",
      )
    ).includes("Inactive carrier"),
  );
  assert(
    (
      await evaluate(
        "document.querySelector('[data-testid=home-carrier-options]').textContent",
      )
    ).includes("indicative"),
  );
  pass(
    "Shipping options use active carriers, custom starting prices and final-quote guidance",
  );
  const ownRequests = calls
    .slice(start)
    .filter((c) => ["/v1/configs", "/v1/shipments"].includes(c.url));
  assert(ownRequests.length > 0);
  assert(ownRequests.every((c) => !("userId" in c.query)));
  pass(
    "Merchant overview reads rely on authenticated ownership without route owner overrides",
  );
  assert(
    await evaluate(
      "getComputedStyle(document.querySelector('.ov-text-link svg')).transform === 'none'",
    ),
  );
  const carrierReadsBeforeRefresh = calls.filter(
    (c) => c.url === "/v1/shipping-companies",
  ).length;
  wallet = 0;
  missingMetrics = true;
  await click("[data-testid=overview-refresh]");
  await until(
    "document.querySelector('[data-testid=home-wallet] .ov-hero-wallet-value')?.textContent.includes('0.00')",
    "zero wallet",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=home-metric-ACTIVE_SHIPMENTS] .ov-metric-value').textContent",
    ),
    "0",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=home-metric-INTERNATIONAL_SHIPMENTS] .ov-metric-value').textContent",
    ),
    "—",
  );
  assert(
    calls.filter((c) => c.url === "/v1/shipping-companies").length >
      carrierReadsBeforeRefresh,
  );
  pass(
    "Merchant zero balances/counts remain distinct from missing summary values; refresh includes carrier options",
  );
  missingMetrics = false;
  wallet = 1360.5;
  failures.add("/v1/configs");
  await click("[data-testid=overview-refresh]");
  await until(
    "document.querySelector('[data-testid=home-shipping-summary]')?.textContent.includes('Last successful data')",
    "home summary failure",
  );
  assert(await evaluate(exists("[data-testid=home-shipment-shipment-1]")));
  failures.delete("/v1/configs");
  await clickText("Retry", "[data-testid=home-shipping-summary] button");
  await until(
    "document.querySelector('[data-testid=home-metric-ACTIVE_SHIPMENTS] .ov-metric-value')?.textContent==='24'",
    "summary retry",
  );
  pass(
    "Home panels fail and recover independently without clearing other account data",
  );
  foreignAccount = true;
  await click("[data-testid=overview-refresh]");
  await until(
    "document.querySelector('[data-testid=home-wallet]')?.textContent.includes('could not be verified')",
    "foreign account rejected",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=home-wallet] .ov-hero-wallet-value').textContent",
    ),
    "—",
  );
  foreignAccount = false;
  await click("[data-testid=overview-refresh]");
  await until(
    "document.querySelector('[data-testid=home-wallet]')?.textContent.includes('1,360.50')",
    "own account restored",
  );
  pass("Unexpected account identity cannot populate the merchant wallet");
  malformedLists = true;
  await click("[data-testid=overview-refresh]");
  await until(
    "document.querySelector('[data-testid=home-carrier-options]')?.textContent.includes('data is unavailable') && document.querySelector('[data-testid=home-recent-shipments]')?.textContent.includes('activity is unavailable')",
    "malformed lists unavailable",
  );
  assert(await evaluate(exists("[data-testid=home-wallet]")));
  malformedLists = false;
  await click("[data-testid=overview-refresh]");
  await loaded("[data-testid=home-shipment-shipment-1]");
  pass(
    "Malformed carrier and shipment responses remain local unavailable states and recover without crashing authentication or home",
  );
  emptyShipments = true;
  await click("[data-testid=overview-refresh]");
  await until(
    "document.querySelector('[data-testid=home-recent-shipments]')?.textContent.includes('Your first shipment')",
    "empty shipments",
  );
  pass("A new merchant receives a clear first-shipment empty state");
  emptyShipments = false;
  await login("merchant2@example.test");
  await loaded("[data-testid=merchant-home]");
  await loaded("[data-testid=home-shipment-shipment-1]");
  assert(!calls.slice(-12).some((c) => c.query.userId === "merchant-1"));
  pass("Signing in as another merchant starts an independently keyed overview");
  const beforeUnauthorized = adminReads().length;
  await navigate("/dashboard");
  await until(
    "location.pathname==='/home'||location.pathname.includes('/error/')",
    "merchant dashboard denied",
  );
  assert.equal(adminReads().length, beforeUnauthorized);
  pass("Merchant accounts cannot access the administrator route or data");
  await login("admin@example.test");
  await loaded("[data-testid=administrator-dashboard]");
  await loaded("[data-testid=merchant-rank-0]");
  await evaluate(
    "document.querySelector('[data-testid=merchant-performance]').scrollIntoView({block:'start'})",
  );
  await screenshot("administrator-insights-en-desktop");
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
  await navigate("/dashboard");
  await loaded("[data-testid=administrator-dashboard]");
  await loaded("[data-testid=merchant-rank-0]");
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  assert(
    await evaluate(
      "[...document.querySelectorAll('.ov-toolbar input,.ov-toolbar select')].every(e=>e.getBoundingClientRect().right<=innerWidth)",
    ),
  );
  await screenshot("administrator-dashboard-ar-mobile");
  await evaluate(
    "document.querySelector('[data-testid=merchant-performance]').scrollIntoView({block:'start'})",
  );
  await screenshot("administrator-ranking-ar-mobile");
  assert(
    await evaluate(
      "document.querySelector('.ov-root').scrollWidth<=document.querySelector('.ov-root').clientWidth+1",
    ),
  );
  pass(
    "Administrator filters, stage counts and ranking remain readable on Arabic mobile without horizontal overflow",
  );
  await login("merchant@example.test");
  await loaded("[data-testid=merchant-home]");
  await evaluate("localStorage.setItem('my-language','ar')");
  await navigate("/home");
  await loaded("[data-testid=merchant-home]");
  await loaded("[data-testid=home-shipment-shipment-1]");
  assert.equal(
    await evaluate(
      "getComputedStyle(document.querySelector('.ov-text-link svg')).transform",
    ),
    "matrix(-1, 0, 0, -1, 0, 0)",
  );
  await screenshot("merchant-home-ar-mobile");
  await evaluate(
    "document.querySelector('[data-testid=home-recent-shipments]').scrollIntoView({block:'start'})",
  );
  await screenshot("merchant-activity-ar-mobile");
  assert(
    await evaluate(
      "document.querySelector('.ov-root').scrollWidth<=document.querySelector('.ov-root').clientWidth+1",
    ),
  );
  pass(
    "Merchant balances, recent shipment links and account actions remain responsive in Arabic",
  );
  assert(
    calls
      .filter((c) => !c.url.includes("/auth-sessions/"))
      .every((c) => c.method === "GET"),
  );
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks: passed, exceptions, calls }, null, 2),
  );
  console.log(
    `${passed}/${passed} overview browser checks passed; no uncaught exceptions.`,
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
