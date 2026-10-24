// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/foundations-browser");
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
  checks = 0;
const pass = (label) => {
  checks++;
  console.log("PASS " + label);
};
const carrierA = {
  id: "carrier-a",
  name: "Carrier Alpha",
  shippingMethods: ["local", "cashOnDelivery"],
  localPrice: 15,
  codPrice: 5,
  returnFees: 3,
};
const carrierB = {
  id: "carrier-b",
  name: "Carrier Beta",
  shippingMethods: ["local", "cashOnDelivery"],
  localPrice: 32,
  codPrice: 8,
  returnFees: 0,
};
const companies = [carrierA, carrierB];
const plans = Array.from({ length: 25 }, (_, index) => ({
  id: "plan-" + (index + 1),
  name: "Plan " + (index + 1),
  description: "Shipping plan",
  price: 100,
  status: "active",
  features: ["Customer support"],
  prices: index
    ? []
    : [
        {
          id: "price-b",
          shippingCompanyId: "carrier-b",
          shippingCompany: carrierB,
          localPrice: 21,
          codPrice: 6,
          returnFees: 0,
        },
        {
          _id: "price-a",
          shippingCompanyId: "carrier-a",
          shippingCompany: carrierA,
          localPrice: 12,
          codPrice: 4,
          returnFees: 2,
        },
        {
          id: "price-legacy",
          shippingCompanyId: "carrier-legacy",
          shippingCompany: { id: "carrier-legacy", name: "Stored Carrier" },
          localPrice: 18,
          internationalDiscountRate: 10,
        },
      ],
}));
const grant = (feature, extras = {}) => ({
  feature,
  accessView: true,
  accessCreate: false,
  accessUpdate: false,
  accessDelete: false,
  ...extras,
});
const admins = Array.from({ length: 12 }, (_, index) => ({
  id: "staff-" + (index + 1),
  firstName: "Staff",
  lastName: String(index + 1),
  email: `staff${index + 1}@example.test`,
  phone: "+966-555123456",
  role: "employee",
  isBlocked: false,
  features: [
    grant("plans", { id: "grant-plans" }),
    grant("future-feature", { _id: "grant-future" }),
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
}));
async function intercept(event) {
  const request = event.request,
    url = new URL(request.url);
  if (request.method === "OPTIONS") return fulfill(event, 204, "");
  if (!url.pathname.includes("/v1/"))
    return send("Fetch.continueRequest", { requestId: event.requestId });
  const body = JSON.parse(request.postData || "{}"),
    query = Object.fromEntries(url.searchParams);
  calls.push({
    url: url.pathname,
    method: request.method,
    body,
    query,
    roles: url.searchParams.getAll("role"),
  });
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
    if (viewer) account.features = [grant("plans"), grant("admins")];
    if (denied) account.features = [grant("merchants")];
    result = {
      user: account,
      accessToken: "foundation-access",
      refreshToken: "foundation-refresh",
    };
  } else if (url.pathname === "/v1/users/me")
    result = account || { ...normal, role: "admin" };
  else if (url.pathname === "/v1/shipping-companies")
    result = { results: companies, total: companies.length };
  else if (
    url.pathname === "/v1/payment-plans" ||
    url.pathname === "/v1/users"
  ) {
    const isPlans = url.pathname === "/v1/payment-plans",
      collection = isPlans ? plans : admins;
    if (request.method === "POST") {
      assert(isPlans, "Staff creation must stay unavailable");
      if (failSave) {
        status = 500;
        result = { message: "Save failed" };
      } else {
        result = { ...body, id: "plan-" + (plans.length + 1) };
        plans.push(result);
        status = 201;
      }
    } else if (failList === (isPlans ? "plans" : "admins")) {
      status = 500;
      result = { message: "List failed" };
    } else {
      const list = collection.filter(
        (row) =>
          !query.search ||
          `${row.name || ""} ${row.firstName || ""} ${row.lastName || ""}`
            .toLowerCase()
            .includes(query.search.toLowerCase()),
      );
      const page = +query.page || 0,
        pageSize = +query.pageSize || (isPlans ? 16 : 10);
      result = {
        results: list.slice(page * pageSize, (page + 1) * pageSize),
        total: list.length,
      };
    }
  } else if (
    url.pathname.startsWith("/v1/payment-plans/") ||
    url.pathname.startsWith("/v1/users/")
  ) {
    const collection = url.pathname.startsWith("/v1/payment-plans/")
      ? plans
      : admins;
    const row = collection.find(
      (item) => item.id === url.pathname.split("/").at(-1),
    );
    if (!row) {
      status = 404;
      result = { message: "Missing" };
    } else if (request.method === "PATCH" && failSave) {
      status = 500;
      result = { message: "Save failed" };
    } else {
      if (request.method === "PATCH") Object.assign(row, body);
      result = row;
    }
  } else {
    status = 404;
    result = { message: "Unhandled mock" };
  }
  return fulfill(event, status, result);
}
const selectorExists = (selector) =>
  `Boolean(document.querySelector(${JSON.stringify(selector)}))`;
async function clickSelector(selector) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
}
async function screenshot(name) {
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(output, name), Buffer.from(shot.data, "base64"));
}
async function chooseRole(role) {
  await evaluate(
    "document.querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))",
  );
  await until(selectorExists("[role=option]"), "role options");
  await clickSelector(`[role=option][data-value=${role}]`);
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

  await login("admin@example.test");
  await until("location.pathname === '/home'", "admin sign in");
  await navigate("/plans");
  await until(selectorExists("[data-testid=plan-plan-1]"), "plan list");
  assert.equal(
    await evaluate(
      "document.querySelectorAll('[data-testid^=plan-plan-]').length",
    ),
    16,
  );
  assert(await evaluate(selectorExists('a[href="/admins"]')));
  pass("Navigation, plan cards and original page size");

  await clickSelector('button[aria-label="Go to page 2"]');
  await until(selectorExists("[data-testid=plan-plan-17]"), "plan page two");
  const before = calls.filter((call) => call.method === "PATCH").length;
  await clickSelector("[data-testid=toggle-plan-plan-17]");
  await until(selectorExists("[role=dialog]"), "status dialog");
  await clickText("No", "[role=dialog] button");
  assert.equal(calls.filter((call) => call.method === "PATCH").length, before);
  await clickSelector("[data-testid=toggle-plan-plan-17]");
  await until(selectorExists("[role=dialog]"), "status dialog reopened");
  await clickText("Yes", "[role=dialog] button");
  await until(
    "document.querySelector('[data-testid=toggle-plan-plan-17]')?.textContent.includes('Activate')",
    "status updated",
  );
  assert.deepEqual(
    calls.filter((call) => call.method === "PATCH").at(-1).body,
    { status: "disabled" },
  );
  assert.equal(
    calls
      .filter(
        (call) => call.url === "/v1/payment-plans" && call.method === "GET",
      )
      .at(-1).query.page,
    "1",
  );
  pass("Plan pagination and confirmed isolated status patch");

  await fillSelector("[data-testid=plans-search]", "Plan & Express");
  await until(
    "document.body.innerText.includes('There are no plans')",
    "empty plan search",
  );
  const search = calls
    .filter((call) => call.url === "/v1/payment-plans" && call.method === "GET")
    .at(-1).query;
  assert.equal(search.search, "Plan & Express");
  assert.equal(search.page, "0");
  pass("Plan search encoding and pagination reset");

  await navigate("/plans/new");
  await until(selectorExists("input[name=name]"), "new plan form");
  const createsBefore = calls.filter(
    (call) => call.method === "POST" && call.url === "/v1/payment-plans",
  ).length;
  await clickSelector("[data-testid=save-plan]");
  await until(
    "document.querySelectorAll('.Mui-error').length > 0",
    "required validation",
  );
  assert.equal(
    calls.filter(
      (call) => call.method === "POST" && call.url === "/v1/payment-plans",
    ).length,
    createsBefore,
  );
  pass("Shared plan validations prevent an empty save");

  await fill("name", "Pilot Plan");
  await fill("price", "150");
  await fillSelector("[data-testid=plan-features]", "Priority support");
  await evaluate(
    "document.querySelector('[data-testid=plan-features]').focus()",
  );
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
  });
  await clickSelector(
    "[data-testid=plan-price-carrier-b] input[type=checkbox]",
  );
  await until(
    selectorExists(
      "[data-testid=plan-price-carrier-b] input[data-price-field=localPrice]",
    ),
    "carrier beta price fields",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=plan-price-carrier-b] input[data-price-field=localPrice]').value",
    ),
    "32",
  );
  await clickSelector("[data-testid=save-plan]");
  await until("location.pathname === '/plans'", "created plan saved");
  const created = calls
    .filter(
      (call) => call.method === "POST" && call.url === "/v1/payment-plans",
    )
    .at(-1).body;
  assert.deepEqual(created.features, ["Priority support"]);
  assert.deepEqual(created.prices, [
    {
      shippingCompanyId: "carrier-b",
      localPrice: 32,
      codPrice: 8,
      returnFees: 0,
    },
  ]);
  assert.equal(created.description, undefined);
  pass(
    "Plan creation uses selected carrier defaults and retains zero return fees",
  );

  await navigate("/plans/plan-1");
  await until(
    selectorExists(
      "[data-testid=plan-price-carrier-b] input[data-price-field=localPrice]",
    ),
    "existing plan",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=plan-price-carrier-b] input[data-price-field=localPrice]').value",
    ),
    "21",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=plan-price-carrier-a] input[data-price-field=localPrice]').value",
    ),
    "12",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=plan-price-carrier-legacy] input[data-price-field=internationalDiscountRate]').value",
    ),
    "10",
  );
  pass("Stored carrier prices match by ID and absent carriers remain editable");

  await fill("name", "Unsaved Plan Name");
  await clickSelector("[data-testid=toggle-plan]");
  await until(selectorExists("[role=dialog]"), "detail status dialog");
  await clickText("Yes", "[role=dialog] button");
  await until(
    "document.querySelector('[data-testid=toggle-plan]')?.textContent.includes('Activate')",
    "detail status updated",
  );
  await sleep(300);
  assert.equal(
    await evaluate("document.querySelector('input[name=name]').value"),
    "Unsaved Plan Name",
  );
  assert.deepEqual(
    calls.filter((call) => call.method === "PATCH").at(-1).body,
    { status: "disabled" },
  );
  pass("Status refetch preserves unsaved plan fields and carrier prices");

  failSave = true;
  await clickSelector("[data-testid=save-plan]");
  await until(
    "document.body.innerText.includes('Something went wrong while saving the plan')",
    "plan save error",
  );
  assert.equal(await evaluate("location.pathname"), "/plans/plan-1");
  assert.equal(
    await evaluate("document.querySelector('input[name=name]').value"),
    "Unsaved Plan Name",
  );
  failSave = false;
  await clickSelector("[data-testid=save-plan]");
  await until("location.pathname === '/plans'", "plan retry");
  const planSaved = calls
    .filter(
      (call) =>
        call.method === "PATCH" &&
        call.url === "/v1/payment-plans/plan-1" &&
        call.body.name,
    )
    .at(-1).body;
  assert.deepEqual(
    planSaved.prices.map((row) => row.shippingCompanyId),
    ["carrier-b", "carrier-a", "carrier-legacy"],
  );
  assert.equal(planSaved.prices[0].returnFees, 0);
  assert.equal(planSaved.prices[2].internationalDiscountRate, 10);
  assert(
    planSaved.prices.every(
      (row) =>
        !("active" in row) &&
        !("shippingCompany" in row) &&
        !("id" in row) &&
        !("_id" in row),
    ),
  );
  pass(
    "Failed plan saves retain edits; retry preserves all carrier pricing and legacy payload shape",
  );

  failList = "plans";
  await navigate("/plans");
  await until(
    "document.body.innerText.includes('Unable to load this data')",
    "plan list error",
  );
  failList = "";
  await clickText("Retry");
  await until(selectorExists("[data-testid=plan-plan-1]"), "plan list retry");
  await navigate("/plans/missing");
  await until(
    "document.body.innerText.includes('There is no such plan')",
    "missing plan",
  );
  pass("Plan list retry and missing-record handling");

  await navigate("/admins");
  await until(selectorExists("[role=row][data-id=staff-1]"), "staff table");
  assert.equal(
    await evaluate("document.querySelectorAll('[role=row][data-id]').length"),
    10,
  );
  assert(
    await evaluate(
      "document.body.innerText.includes('(You)') || document.body.innerText.includes('(YOU)') || document.body.innerText.includes('(you)')",
    ),
  );
  const staffList = calls.filter((call) => call.url === "/v1/users").at(-1);
  assert.deepEqual(staffList.roles, ["admin", "employee"]);
  assert.equal(staffList.query.pageSize, "10");
  assert.equal(await evaluate(selectorExists('a[href="/admins/new"]')), false);
  pass(
    "Staff table keeps repeated role filters, page size, self label and no creation",
  );

  await clickSelector('button[aria-label="Go to next page"]');
  await until(
    selectorExists("[role=row][data-id=staff-11]"),
    "staff pagination",
  );
  await fillSelector("[data-testid=admins-search]", "Staff & Co");
  await until(
    "document.body.innerText.includes('There are no admins')",
    "empty staff search",
  );
  const staffSearch = calls
    .filter((call) => call.url === "/v1/users")
    .at(-1).query;
  assert.equal(staffSearch.search, "Staff & Co");
  assert.equal(staffSearch.page, "0");
  pass("Staff pagination and encoded search");

  await navigate("/admins/staff-1");
  await until(
    selectorExists("[data-testid=permission-plans]"),
    "staff permissions",
  );
  assert.equal(
    await evaluate(
      "['Staff 1','staff1@example.test','+966-555123456'].every(value=>[...document.querySelectorAll('input')].some(input=>input.value===value&&input.disabled))",
    ),
    true,
  );
  assert(
    await evaluate(selectorExists("[data-testid=permission-future-feature]")),
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=permission-plans] input[type=checkbox]').checked",
    ),
    true,
  );
  pass("Staff identity is read-only and stored custom grants remain intact");

  await clickSelector(
    "[data-testid=permission-plans] .MuiAccordionSummary-root",
  );
  await until(selectorExists("#plans-accessUpdate"), "operation controls");
  await clickSelector("#plans-accessView");
  await until(
    "!document.querySelector('#plans-accessView').checked",
    "view disabled",
  );
  await clickSelector("#plans-accessUpdate");
  await until(
    "document.querySelector('#plans-accessView').checked && document.querySelector('#plans-accessView').disabled",
    "view required",
  );
  pass("Write grants automatically require view permission");

  await clickSelector("[data-testid=toggle-admin]");
  await until(selectorExists("[role=dialog]"), "block confirmation");
  await clickText("Yes", "[role=dialog] button");
  await until(
    "document.querySelector('[data-testid=toggle-admin]')?.textContent.includes('Activate')",
    "blocked staff",
  );
  await sleep(300);
  assert.deepEqual(
    calls.filter((call) => call.method === "PATCH").at(-1).body,
    { isBlocked: true },
  );
  assert.equal(
    await evaluate("document.querySelector('#plans-accessUpdate').checked"),
    true,
  );
  pass("Blocking uses its own patch and preserves unsaved grants");

  failSave = true;
  await clickSelector("[data-testid=save-admin]");
  await until(
    "document.body.innerText.includes('Something went wrong while saving admin')",
    "staff save failure",
  );
  failSave = false;
  await clickSelector("[data-testid=save-admin]");
  await until("location.pathname === '/admins'", "staff save retry");
  const staffSaved = calls
    .filter(
      (call) =>
        call.method === "PATCH" &&
        call.url === "/v1/users/staff-1" &&
        call.body.features,
    )
    .at(-1).body;
  assert.deepEqual(Object.keys(staffSaved).sort(), ["features", "role"]);
  assert.equal(
    staffSaved.features.find((row) => row.feature === "plans").id,
    "grant-plans",
  );
  assert.equal(
    staffSaved.features.find((row) => row.feature === "future-feature")._id,
    "grant-future",
  );
  assert.equal(
    staffSaved.features.find((row) => row.feature === "plans").accessUpdate,
    true,
  );
  pass(
    "Staff save retry sends only permissions and retains nested/custom grants",
  );

  await navigate("/admins/staff-1");
  await until(
    selectorExists("[data-testid=permission-plans]"),
    "staff role changes",
  );
  await chooseRole("admin");
  await until(
    "document.querySelector('[data-testid=permission-admins] input')?.checked === true",
    "admin role defaults",
  );
  await chooseRole("employee");
  await until(
    "document.querySelector('[data-testid=permission-admins] input')?.checked === false",
    "employee role defaults",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=permission-package-requests] input').checked",
    ),
    true,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=permission-plans] input').checked",
    ),
    false,
  );
  await screenshot("staff-permissions-en.png");
  await clickSelector(
    "[data-testid=permission-merchants] input[type=checkbox]",
  );
  await clickSelector(
    "[data-testid=permission-shipments] .MuiAccordionSummary-root",
  );
  await until(
    selectorExists("#shipments-accessDelete"),
    "shifted permission controls",
  );
  assert.equal(
    await evaluate("document.querySelector('#shipments-accessDelete').checked"),
    true,
  );
  await clickSelector("#shipments-accessDelete");
  await clickSelector("[data-testid=save-admin]");
  await until(
    "location.pathname === '/admins'",
    "save shifted permission rows",
  );
  const shifted = calls
    .filter(
      (call) =>
        call.method === "PATCH" &&
        call.url === "/v1/users/staff-1" &&
        call.body.features,
    )
    .at(-1).body.features;
  assert(!shifted.some((row) => row.feature === "merchants"));
  assert.equal(
    shifted.find((row) => row.feature === "shipments").accessDelete,
    false,
  );
  assert.equal(
    shifted.find((row) => row.feature === "merchant-dues").accessDelete,
    true,
  );
  pass(
    "Role changes apply source defaults immediately and keep packaging permissions",
  );

  await navigate("/admins/new");
  await until("location.pathname === '/admins'", "staff create redirect");
  assert(
    !calls.some((call) => call.url === "/v1/users" && call.method === "POST"),
  );
  failList = "admins";
  await navigate("/admins");
  await until(
    "document.body.innerText.includes('Unable to load this data')",
    "staff list error",
  );
  failList = "";
  await clickText("Retry");
  await until(
    selectorExists("[role=row][data-id=staff-1]"),
    "staff list retry",
  );
  pass("Unavailable staff creation stays disabled and staff list errors retry");

  await login("viewer@example.test");
  await until("location.pathname === '/home'", "viewer login");
  await navigate("/plans/plan-1");
  await until(selectorExists("input[name=name]"), "view-only plan");
  assert.equal(
    await evaluate("document.querySelector('input[name=name]').disabled"),
    true,
  );
  assert.equal(
    await evaluate(selectorExists("[data-testid=save-plan]")),
    false,
  );
  await navigate("/admins");
  await until(
    selectorExists("[role=row][data-id=staff-1]"),
    "employee staff list",
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[role=columnheader][data-field=actions]'))",
    ),
    false,
  );
  await navigate("/admins/staff-1");
  await until(
    selectorExists("[data-testid=permission-plans]"),
    "view-only staff",
  );
  assert.equal(
    await evaluate(selectorExists("[data-testid=save-admin]")),
    false,
  );
  assert.equal(
    await evaluate(selectorExists("[data-testid=toggle-admin]")),
    false,
  );
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('[data-testid^=permission-] input')].every(input=>input.disabled)",
    ),
    true,
  );
  pass(
    "View-only staff cannot edit plans or grants, block staff or see admin list actions",
  );

  await login("denied@example.test");
  await until("location.pathname === '/home'", "denied login");
  const countBefore = calls.filter(
    (call) => call.url === "/v1/payment-plans" || call.url === "/v1/users",
  ).length;
  await navigate("/plans");
  await sleep(700);
  assert.equal(
    await evaluate(selectorExists("[data-testid=plan-plan-1]")),
    false,
  );
  await navigate("/admins");
  await sleep(700);
  assert.equal(
    await evaluate(selectorExists("[role=row][data-id=staff-1]")),
    false,
  );
  assert.equal(
    calls.filter(
      (call) => call.url === "/v1/payment-plans" || call.url === "/v1/users",
    ).length,
    countBefore,
  );
  pass("Denied permissions do not fetch feature records");

  await login("merchant@example.test");
  await until("location.pathname === '/home'", "merchant login");
  await navigate("/plans");
  await sleep(700);
  assert.equal(
    await evaluate(selectorExists("[data-testid=plan-plan-1]")),
    false,
  );
  await navigate("/admins/staff-1");
  await sleep(700);
  assert.equal(
    await evaluate(selectorExists("[data-testid=permission-plans]")),
    false,
  );
  pass("Merchants cannot open staff-only plan and staff routes");

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
  await navigate("/plans/plan-1");
  await until(
    selectorExists("[data-testid=plan-price-carrier-b]"),
    "Arabic mobile plan",
  );
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  await sleep(500);
  await screenshot("plan-ar-mobile.png");
  await navigate("/admins/staff-1");
  await until(
    selectorExists("[data-testid=permission-plans]"),
    "Arabic mobile staff",
  );
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('input')].find(input=>input.value==='+966-555123456')?.dir",
    ),
    "ltr",
  );
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  await sleep(500);
  await screenshot("staff-ar-mobile.png");
  pass("Arabic RTL detail forms work on mobile");
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks, exceptions, calls }, null, 2),
  );
  console.log(`${checks}/${checks} foundation browser checks passed.`);
}

main()
  .catch(async (error) => {
    fs.writeFileSync(
      path.join(output, "failure-calls.json"),
      JSON.stringify({ calls, exceptions }, null, 2),
    );
    try {
      await screenshot("failure.png");
      fs.writeFileSync(
        path.join(output, "failure-dom.txt"),
        await evaluate("document.body.innerText"),
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
