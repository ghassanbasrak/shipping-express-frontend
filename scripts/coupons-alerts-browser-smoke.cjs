// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/coupons-alerts-browser");
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
    ],
    body:
      status === 204
        ? ""
        : Buffer.from(
            typeof result === "string" ? result : JSON.stringify(result),
          ).toString("base64"),
  });
}
let failList = "",
  failSave = false,
  failDelete = false,
  failDetail = false,
  failUpload = false,
  mediaSequence = 0,
  checks = 0;
const pass = (label) => {
  checks++;
  console.log("PASS " + label);
};
const companies = [
  {
    id: "carrier-1",
    name: "Carrier One",
    logoUrl: "/assets/images/logo123.png",
  },
  {
    id: "carrier-2",
    name: "Carrier Two",
    logoUrl: "/assets/images/logo123.png",
  },
];
const coupons = Array.from({ length: 25 }, (_, i) => ({
  id: "coupon-" + (i + 1),
  code: "SAVE" + (i + 1),
  type: i % 2 ? "percentage" : "fixed",
  value: 10,
  maxUsageCount: 50,
  usageCount: 2,
  isActive: true,
  expiresAt: null,
  shippingCompanyId: companies[i % 2].id,
  shippingCompany: companies[i % 2],
  createdAt: "2026-10-01T00:00:00.000Z",
}));
const alerts = Array.from({ length: 13 }, (_, i) => ({
  id: "alert-" + (i + 1),
  type: "normal",
  viewType: "popup",
  title: "Notice " + (i + 1),
  content: "Shipping update",
  imageUrl: "",
  createdAt: "2026-10-01T00:00:00.000Z",
}));
const grant = (feature) => ({
  feature,
  accessView: true,
  accessCreate: false,
  accessUpdate: false,
  accessDelete: false,
});
async function intercept(event) {
  const request = event.request,
    url = new URL(request.url);
  if (request.method === "OPTIONS") return fulfill(event, 204, "");
  if (url.hostname === "uploads.example.test") {
    calls.push({
      url: url.pathname,
      method: request.method,
      upload: true,
      headers: request.headers,
    });
    return fulfill(
      event,
      request.method === "POST" ? (failUpload ? 500 : 204) : 200,
      request.method === "POST"
        ? ""
        : '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="red"/></svg>',
      "image/svg+xml",
    );
  }
  if (!url.pathname.includes("/v1/"))
    return send("Fetch.continueRequest", { requestId: event.requestId });
  const body = JSON.parse(request.postData || "{}"),
    query = Object.fromEntries(url.searchParams);
  calls.push({ url: url.pathname, method: request.method, body, query });
  let result = {},
    status = 200;
  if (url.pathname === "/v1/auth-sessions/login") {
    const viewer = body.email.startsWith("viewer"),
      denied = body.email.startsWith("denied"),
      merchant = body.email.startsWith("merchant");
    account = {
      ...normal,
      id: "staff-1",
      role: merchant ? "user" : viewer || denied ? "employee" : "admin",
    };
    if (viewer) account.features = [grant("coupons"), grant("alerts")];
    if (denied) account.features = [grant("merchants")];
    result = {
      user: account,
      accessToken: "management-access",
      refreshToken: "management-refresh",
    };
  } else if (url.pathname === "/v1/users/me")
    result = account || { ...normal, role: "admin" };
  else if (url.pathname === "/v1/shipping-companies")
    result = { results: companies, total: companies.length };
  else if (url.pathname === "/v1/media/create")
    result = {
      url: "https://uploads.example.test/",
      fields: { key: "alert-" + ++mediaSequence + ".png" },
    };
  else if (url.pathname === "/v1/coupons" || url.pathname === "/v1/alerts") {
    const isCoupon = url.pathname === "/v1/coupons",
      collection = isCoupon ? coupons : alerts;
    if (request.method === "POST") {
      if (failSave) {
        status = 500;
        result = { message: "Save failed" };
      } else {
        result = {
          ...body,
          id: (isCoupon ? "coupon-" : "alert-") + (collection.length + 1),
          ...(isCoupon ? { isActive: true, usageCount: 0 } : {}),
        };
        collection.push(result);
        status = 201;
      }
    } else if (failList === (isCoupon ? "coupons" : "alerts")) {
      status = 500;
      result = { message: "List failed" };
    } else {
      const list = collection.filter(
        (row) =>
          (!query.search ||
            `${row.code || row.title || ""} ${row.content || ""}`
              .toLowerCase()
              .includes(query.search.toLowerCase())) &&
          (!query.shippingCompanyId ||
            row.shippingCompanyId === query.shippingCompanyId),
      );
      const page = +query.page || 0,
        pageSize = +query.pageSize || 10;
      result = {
        results: list.slice(page * pageSize, (page + 1) * pageSize),
        total: list.length,
      };
    }
  } else if (
    url.pathname.startsWith("/v1/coupons/") ||
    url.pathname.startsWith("/v1/alerts/")
  ) {
    const collection = url.pathname.startsWith("/v1/coupons/")
      ? coupons
      : alerts;
    const index = collection.findIndex(
      (item) => item.id === url.pathname.split("/").at(-1),
    );
    if (index < 0) {
      status = 404;
      result = { message: "Missing" };
    } else if (
      (request.method === "PATCH" && failSave) ||
      (request.method === "DELETE" && failDelete) ||
      (request.method === "GET" && failDetail)
    ) {
      status = 500;
      result = { message: "Failed" };
    } else if (request.method === "DELETE") {
      collection.splice(index, 1);
      result = null;
      status = 204;
    } else {
      if (request.method === "PATCH") Object.assign(collection[index], body);
      result = collection[index];
    }
  } else {
    status = 404;
    result = { message: "Unhandled mock" };
  }
  return fulfill(event, status, result);
}
const exists = (selector) =>
  `Boolean(document.querySelector(${JSON.stringify(selector)}))`;
async function clickSelector(selector) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
}
async function fillField(selector, value) {
  await evaluate(
    `(()=>{const input=document.querySelector(${JSON.stringify(selector)});if(!input)throw new Error('Missing field');const proto=input instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`,
  );
}
async function choose(name, value) {
  await evaluate(
    `document.querySelector('input[name=${JSON.stringify(name)}]').parentElement.querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))`,
  );
  await until(exists("[role=option]"), "select options");
  await clickSelector(`[role=option][data-value=${value}]`);
  await until("!document.querySelector('[role=listbox]')", "select closed");
}
async function screenshot(name) {
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(output, name), Buffer.from(shot.data, "base64"));
}
async function uploadImage() {
  await evaluate(
    `(async()=>{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='red';ctx.fillRect(0,0,256,256);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));const data=new DataTransfer();data.items.add(new File([blob],'alert.png',{type:'image/png'}));const input=document.querySelector('[data-testid=alert-image] input[type=file]');input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
  await until(
    "Boolean(document.querySelector('[role=dialog] .cropper-container img')?.complete)",
    "cropper ready",
  );
  await sleep(200);
  await clickText("Upload", "[role=dialog] button");
  await until(
    "!document.querySelector('[role=dialog]') && Boolean(document.querySelector('[data-testid=alert-image] .imageFileRemove'))",
    "image uploaded",
  );
  await until(
    "!document.querySelector('[data-testid=alert-image] [role=progressbar]') && Boolean(document.querySelector('[data-testid=alert-image] .imageFileRemove'))",
    "upload finished",
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
      { urlPattern: "https://uploads.example.test/*" },
    ],
  });
  await send("Browser.setPermission", {
    permission: { name: "notifications" },
    setting: "denied",
    origin: "http://127.0.0.1:3138",
  });
  const languageScript = await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "localStorage.setItem('my-language','en')",
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
  await login("admin@example.test");
  await until("location.pathname === '/home'", "admin login");
  await navigate("/coupons/all/all");
  await until(exists("[role=row][data-id=coupon-1]"), "coupon list");
  assert.equal(
    await evaluate("document.querySelectorAll('[role=row][data-id]').length"),
    10,
  );
  const initial = calls
    .filter((call) => call.url === "/v1/coupons")
    .at(-1).query;
  assert.equal(initial.shippingCompanyId, undefined);
  assert.equal(initial.userId, undefined);
  assert(await evaluate(exists('a[href="/alerts"]')));
  pass("Staff navigation and original coupon table pagination");

  await clickSelector('button[aria-label="Go to next page"]');
  await until(exists("[role=row][data-id=coupon-11]"), "coupon page two");
  assert.equal(
    calls.filter((call) => call.url === "/v1/coupons").at(-1).query.page,
    "1",
  );
  await fillSelector("[data-testid=coupons-search]", "SAVE & MORE");
  await until(
    "document.body.innerText.includes('There are no coupons')",
    "empty coupon search",
  );
  const searched = calls
    .filter((call) => call.url === "/v1/coupons")
    .at(-1).query;
  assert.equal(searched.search, "SAVE & MORE");
  assert.equal(searched.page, "0");
  pass("Coupon pagination and encoded searches reset the page");

  await navigate("/coupons/carrier-2/merchant-1");
  await until(exists("[role=row][data-id=coupon-2]"), "scoped coupons");
  const scoped = calls
    .filter((call) => call.url === "/v1/coupons")
    .at(-1).query;
  assert.equal(scoped.shippingCompanyId, "carrier-2");
  assert.equal(scoped.userId, "merchant-1");
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=add-coupon]').getAttribute('href')",
    ),
    "/coupons/carrier-2/merchant-1/new",
  );
  await clickText("View", "[role=row][data-id=coupon-2] button");
  await until(
    "location.pathname === '/coupons/carrier-2/merchant-1/coupon-2' && Boolean(document.querySelector('input[name=code]'))",
    "scoped detail",
  );
  assert(await evaluate(exists('a[href="/coupons/carrier-2/merchant-1"]')));
  pass("Carrier and merchant query scope survives table/detail/back links");

  await navigate("/coupons/carrier-2/merchant-1/new");
  await until(exists("input[name=code]"), "new coupon");
  assert(
    (await evaluate("document.querySelector('input[name=code]').value"))
      .length > 10,
  );
  const beforeCreate = calls.filter(
    (call) => call.url === "/v1/coupons" && call.method === "POST",
  ).length;
  await fill("code", "");
  await clickSelector("[data-testid=save-coupon]");
  await until(
    "document.querySelectorAll('.Mui-error').length > 0",
    "coupon required validation",
  );
  assert.equal(
    calls.filter((call) => call.url === "/v1/coupons" && call.method === "POST")
      .length,
    beforeCreate,
  );
  await fill("code", "PILOT");
  await fill("value", "12.5");
  await fill("maxUsageCount", "20");
  await choose("type", "percentage");
  failSave = true;
  await clickSelector("[data-testid=save-coupon]");
  await until(
    "document.body.innerText.includes('Something went wrong')",
    "coupon create failure",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=code]').value"),
    "PILOT",
  );
  failSave = false;
  await clickSelector("[data-testid=save-coupon]");
  await until(
    "location.pathname === '/coupons/carrier-2/merchant-1'",
    "coupon create retry",
  );
  const created = calls
    .filter((call) => call.url === "/v1/coupons" && call.method === "POST")
    .at(-1).body;
  assert.equal(created.shippingCompanyId, "carrier-2");
  assert.equal(created.type, "percentage");
  assert.equal(created.value, 12.5);
  assert.equal(created.maxUsageCount, 20);
  assert.equal(created.expiresAt, null);
  assert.equal(created.userId, undefined);
  pass(
    "Coupon validation, optional expiry and retry preserve typed values and route context",
  );

  await navigate("/coupons/carrier-1/merchant-1/coupon-1");
  await until(exists("input[name=code]"), "coupon edit");
  await fill("code", "DRAFT-COUPON");
  await fill("value", "25");
  const beforeToggle = calls.filter((call) => call.method === "PATCH").length;
  await clickSelector("[data-testid=toggle-coupon]");
  await until(exists("[role=dialog]"), "coupon status confirmation");
  await clickText("No", "[role=dialog] button");
  assert.equal(
    calls.filter((call) => call.method === "PATCH").length,
    beforeToggle,
  );
  await clickSelector("[data-testid=toggle-coupon]");
  await until(exists("[role=dialog]"), "coupon status confirmed");
  await clickText("Yes", "[role=dialog] button");
  await until(
    "document.querySelector('[data-testid=toggle-coupon]')?.textContent.includes('Activate')",
    "coupon deactivated",
  );
  await sleep(200);
  assert.equal(
    await evaluate("document.querySelector('input[name=code]').value"),
    "DRAFT-COUPON",
  );
  assert.deepEqual(
    calls.filter((call) => call.method === "PATCH").at(-1).body,
    { isActive: false },
  );
  pass(
    "Confirmed coupon activation patches only its status and preserves unsaved edits",
  );

  await choose("shippingCompanyId", "all");
  failSave = true;
  await clickSelector("[data-testid=save-coupon]");
  await until(
    "document.body.innerText.includes('Something went wrong')",
    "coupon edit failure",
  );
  failSave = false;
  await clickSelector("[data-testid=save-coupon]");
  await until(
    "location.pathname === '/coupons/carrier-1/merchant-1'",
    "coupon edit retry",
  );
  const updatedCoupon = calls
    .filter(
      (call) =>
        call.url === "/v1/coupons/coupon-1" &&
        call.method === "PATCH" &&
        call.body.code,
    )
    .at(-1).body;
  assert.equal(updatedCoupon.code, "DRAFT-COUPON");
  assert.equal(updatedCoupon.value, 25);
  assert.equal(updatedCoupon.shippingCompanyId, undefined);
  assert.equal(updatedCoupon.usageCount, undefined);
  assert.equal(updatedCoupon.id, undefined);
  pass(
    "Coupon updates retain the legacy all-carrier omission and exclude read-only metadata",
  );

  failList = "coupons";
  await navigate("/coupons/all/all");
  await until(
    "document.body.innerText.includes('Unable to load this data')",
    "coupon load error",
  );
  failList = "";
  await clickText("Retry");
  await until(exists("[role=row][data-id=coupon-1]"), "coupon retry");
  failDetail = true;
  await navigate("/coupons/all/all/coupon-1");
  await until(
    "document.body.innerText.includes('Unable to load this data')",
    "coupon detail error",
  );
  failDetail = false;
  await clickText("Retry");
  await until(exists("input[name=code]"), "coupon detail retried");
  await navigate("/coupons/all/all/missing");
  await until(
    "document.body.innerText.includes('No such coupon') || document.body.innerText.includes('no such coupon')",
    "missing coupon",
  );
  pass(
    "Coupon list/detail failures retry and missing records have a recovery link",
  );

  await navigate("/alerts");
  await until(exists("[role=row][data-id=alert-1]"), "alerts list");
  assert.equal(
    await evaluate("document.querySelectorAll('[role=row][data-id]').length"),
    10,
  );
  await clickSelector('button[aria-label="Go to next page"]');
  await until(exists("[role=row][data-id=alert-11]"), "alert page two");
  await fillSelector("[data-testid=alerts-search]", "Notice & More");
  await until(
    "document.body.innerText.includes('There are no alerts')",
    "empty alert search",
  );
  const alertSearch = calls
    .filter((call) => call.url === "/v1/alerts")
    .at(-1).query;
  assert.equal(alertSearch.search, "Notice & More");
  assert.equal(alertSearch.page, "0");
  pass("Alert table pagination and encoded searches");

  await navigate("/alerts/new");
  await until(exists("input[name=title]"), "new alert");
  const alertsBefore = calls.filter(
    (call) => call.url === "/v1/alerts" && call.method === "POST",
  ).length;
  await clickSelector("[data-testid=save-alert]");
  await until(
    "document.querySelectorAll('.Mui-error').length > 0",
    "text alert validation",
  );
  assert.equal(
    calls.filter((call) => call.url === "/v1/alerts" && call.method === "POST")
      .length,
    alertsBefore,
  );
  await fill("title", "Draft alert title");
  await fillField("textarea[name=content]", "Draft alert content");
  await choose("viewType", "alert");
  assert.equal(await evaluate(exists("[data-testid=alert-image]")), false);
  await choose("type", "onlyImage");
  await until(exists("[data-testid=alert-image]"), "image-only popup");
  assert.equal(
    await evaluate("document.querySelector('input[name=viewType]').value"),
    "popup",
  );
  assert.equal(await evaluate(exists("input[name=title]")), false);
  await clickSelector("[data-testid=save-alert]");
  await until(
    "document.body.innerText.includes('Required field')",
    "image-only required validation",
  );
  await choose("type", "normal");
  await until(exists("input[name=title]"), "normal mode restored");
  assert.equal(
    await evaluate("document.querySelector('input[name=title]').value"),
    "Draft alert title",
  );
  assert.equal(
    await evaluate("document.querySelector('textarea[name=content]').value"),
    "Draft alert content",
  );
  pass("Alert conditional validation and mode changes preserve text drafts");

  await choose("type", "onlyImage");
  await until(exists("[data-testid=alert-image]"), "image alert upload");
  await uploadImage();
  const uploaded = calls
    .filter((call) => call.upload && call.method === "POST")
    .at(-1);
  assert(uploaded);
  assert.equal(
    Object.keys(uploaded.headers).some(
      (key) => key.toLowerCase() === "authorization",
    ),
    false,
  );
  failSave = true;
  await clickSelector("[data-testid=save-alert]");
  await until(
    "document.body.innerText.includes('Something went wrong when creating the alert')",
    "image alert save failed",
  );
  failSave = false;
  await clickSelector("[data-testid=save-alert]");
  await until("location.pathname === '/alerts'", "image alert create retried");
  const imageAlert = calls
    .filter((call) => call.url === "/v1/alerts" && call.method === "POST")
    .at(-1).body;
  assert.deepEqual(imageAlert, {
    type: "onlyImage",
    viewType: "popup",
    imageUrl: "https://uploads.example.test/alert-1.png",
  });
  pass(
    "Cropped image upload strips app credentials and image-only save omits stale text",
  );

  await navigate("/alerts/new");
  await until(exists("input[name=title]"), "new text alert");
  await fill("title", "Text notice");
  await fillField("textarea[name=content]", "General announcement");
  await clickSelector("[data-testid=save-alert]");
  await until("location.pathname === '/alerts'", "normal popup saved");
  const textAlert = calls
    .filter((call) => call.url === "/v1/alerts" && call.method === "POST")
    .at(-1).body;
  assert.equal(textAlert.type, "normal");
  assert.equal(textAlert.imageUrl, undefined);
  assert.equal(textAlert.title, "Text notice");
  pass("Normal popup alerts save without an optional image");

  await navigate("/alerts/alert-1");
  await until(exists("input[name=title]"), "existing alert");
  await uploadImage();
  await until(
    "!document.querySelector('[data-testid=save-alert]').disabled",
    "image-only edit marks the form dirty",
  );
  await clickSelector("[data-testid=save-alert]");
  await until("location.pathname === '/alerts'", "uploaded image saved");
  assert.equal(
    calls
      .filter(
        (call) => call.url === "/v1/alerts/alert-1" && call.method === "PATCH",
      )
      .at(-1).body.imageUrl,
    "https://uploads.example.test/alert-2.png",
  );
  pass(
    "Replacing an existing alert image enables save without another field edit",
  );

  await navigate("/alerts/alert-1");
  await until(exists("input[name=title]"), "banner edit");
  await choose("viewType", "alert");
  await clickSelector("[data-testid=save-alert]");
  await until("location.pathname === '/alerts'", "banner save");
  const banner = calls
    .filter(
      (call) => call.url === "/v1/alerts/alert-1" && call.method === "PATCH",
    )
    .at(-1).body;
  assert.equal(banner.viewType, "alert");
  assert.equal(banner.imageUrl, undefined);
  assert.equal(banner.createdAt, undefined);
  assert.equal(banner.id, undefined);
  pass("Banner payloads omit hidden image fields and entity metadata");

  await navigate("/alerts/alert-2");
  await until(exists("[data-testid=remove-alert]"), "delete alert");
  const deletesBefore = calls.filter((call) => call.method === "DELETE").length;
  await clickSelector("[data-testid=remove-alert]");
  await until(exists("[role=dialog]"), "delete confirmation");
  await clickText("No", "[role=dialog] button");
  assert.equal(
    calls.filter((call) => call.method === "DELETE").length,
    deletesBefore,
  );
  failDelete = true;
  await clickSelector("[data-testid=remove-alert]");
  await until(exists("[role=dialog]"), "delete failure confirmation");
  await clickText("Yes", "[role=dialog] button");
  await until(
    "document.body.innerText.includes('Something went wrong while removing the alert')",
    "delete failure",
  );
  assert.equal(await evaluate("location.pathname"), "/alerts/alert-2");
  failDelete = false;
  await clickSelector("[data-testid=remove-alert]");
  await until(exists("[role=dialog]"), "delete retry confirmation");
  await clickText("Yes", "[role=dialog] button");
  await until("location.pathname === '/alerts'", "deleted alert");
  assert.equal(
    alerts.some((row) => row.id === "alert-2"),
    false,
  );
  pass(
    "Alert deletion supports cancellation, failure recovery and confirmed retry",
  );

  failList = "alerts";
  await navigate("/alerts");
  await until(
    "document.body.innerText.includes('Unable to load this data')",
    "alerts load error",
  );
  failList = "";
  await clickText("Retry");
  await until(exists("[role=row][data-id=alert-1]"), "alerts retry");
  await navigate("/alerts/missing");
  await until(
    "document.body.innerText.includes('No such alert')",
    "alert missing",
  );
  pass("Alert list retry and missing-record recovery");

  await login("viewer@example.test");
  await until("location.pathname === '/home'", "viewer login");
  await navigate("/coupons/all/all/coupon-1");
  await until(exists("input[name=code]"), "read-only coupon");
  assert.equal(
    await evaluate("document.querySelector('input[name=code]').disabled"),
    true,
  );
  assert.equal(await evaluate(exists("[data-testid=save-coupon]")), false);
  assert.equal(await evaluate(exists("[data-testid=toggle-coupon]")), false);
  await navigate("/alerts/alert-1");
  await until(exists("input[name=title]"), "read-only alert");
  assert.equal(
    await evaluate("document.querySelector('input[name=title]').disabled"),
    true,
  );
  assert.equal(await evaluate(exists("[data-testid=save-alert]")), false);
  assert.equal(await evaluate(exists("[data-testid=remove-alert]")), false);
  await navigate("/alerts");
  await until(exists("[role=row][data-id=alert-1]"), "read-only list");
  assert.equal(await evaluate(exists("[data-testid=add-alert]")), false);
  pass(
    "View-only permissions disable edits, activation, upload, creation and deletion",
  );

  await login("denied@example.test");
  await until("location.pathname === '/home'", "denied staff login");
  const deniedBefore = calls.filter(
    (call) => call.url === "/v1/coupons" || call.url === "/v1/alerts",
  ).length;
  for (const route of ["/coupons/all/all", "/alerts"]) {
    await navigate(route);
    await sleep(500);
    assert.equal(
      await evaluate("document.querySelectorAll('[role=row][data-id]').length"),
      0,
    );
  }
  assert.equal(
    calls.filter(
      (call) => call.url === "/v1/coupons" || call.url === "/v1/alerts",
    ).length,
    deniedBefore,
  );
  await login("merchant@example.test");
  await until("location.pathname === '/home'", "merchant login");
  for (const route of ["/coupons/all/all", "/alerts/new"]) {
    await navigate(route);
    await sleep(500);
    assert.equal(await evaluate(exists("[data-testid=save-alert]")), false);
    assert.equal(await evaluate(exists("input[name=code]")), false);
  }
  pass(
    "Denied staff and merchant accounts cannot fetch or edit staff-only features",
  );

  await login("admin@example.test");
  await until("location.pathname === '/home'", "admin restored");
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
  await navigate("/coupons/all/all/coupon-1");
  await until(exists("input[name=code]"), "Arabic coupon form");
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  await sleep(800);
  await screenshot("coupon-ar-mobile.png");
  await navigate("/alerts/alert-1");
  await until(exists("input[name=title]"), "Arabic alert form");
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  await sleep(800);
  await screenshot("alert-ar-mobile.png");
  pass("Arabic RTL coupon and alert forms work on mobile");
  assert.deepEqual(exceptions, []);
  assert.equal(
    await evaluate("document.body.innerText.includes('Something went wrong.')"),
    false,
  );
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks, exceptions, calls }, null, 2),
  );
  console.log(`${checks}/${checks} coupon/alert browser checks passed.`);
}

main()
  .catch(async (error) => {
    fs.writeFileSync(
      path.join(output, "failure-calls.json"),
      JSON.stringify({ calls, exceptions }, null, 2),
    );
    try {
      await screenshot("failure.png");
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
