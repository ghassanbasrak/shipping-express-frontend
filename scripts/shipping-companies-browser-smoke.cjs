// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/shipping-companies-browser");
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
  failSave = false,
  mediaSequence = 0,
  companySequence = 25;
const companies = Array.from({ length: 25 }, (_, index) => ({
  id: "carrier-" + (index + 1),
  name: index === 0 ? "Carrier One" : "Carrier " + (index + 1),
  serviceName: "carrier" + (index + 1),
  hasState: true,
  isEnglish: false,
  isActive: true,
  shippingMethods: ["local", "international", "cashOnDelivery"],
  localPrice: 15,
  codPrice: 5,
  maxWeight: 10,
  extraWeightPrice: 2,
  returnFees: 3,
  logoUrl: "/assets/images/logo123.png",
  iconUrl: "/assets/images/logo123.png",
  color: "#5DADE2",
  shipmentFees: 1,
  shipmentCodFees: 2,
  shipmentExtraWeightFees: 3,
  shipmentReturnFees: 4,
  internationalProfitsRate: 10,
  internationalProfitsExtras: 2,
  fuelPercentage: 5,
  shipmentsCount: 20,
  packageRequestsCount: 2,
  shipmentCountriesCount: 1,
  shipmentStatesCount: 3,
  shipmentCitiesCount: 4,
}));
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
  const request = event.request,
    url = new URL(request.url);
  if (request.method === "OPTIONS") return fulfill(event, 204, "");
  if (url.hostname === "uploads.example.test") {
    calls.push({
      url: url.pathname,
      method: request.method,
      headers: request.headers,
      upload: true,
    });
    return fulfill(
      event,
      request.method === "POST" ? 204 : 200,
      '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="red"/></svg>',
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
  if (url.pathname.endsWith("/auth-sessions/login")) {
    const viewer = body.email.startsWith("viewer"),
      denied = body.email.startsWith("denied"),
      merchant = body.email.startsWith("merchant");
    account = {
      ...normal,
      id: "staff-1",
      role: merchant ? "user" : viewer || denied ? "employee" : "admin",
    };
    if (viewer)
      account.features = [
        {
          feature: "shipping-companies",
          accessView: true,
          accessCreate: false,
          accessUpdate: false,
        },
      ];
    if (denied) account.features = [{ feature: "merchants", accessView: true }];
    result = {
      user: account,
      accessToken: "carrier-access",
      refreshToken: "carrier-refresh",
    };
  } else if (url.pathname.endsWith("/users/me"))
    result = account || { ...normal, role: "admin" };
  else if (url.pathname === "/v1/shipping-companies") {
    if (request.method === "POST") {
      if (failSave) {
        status = 500;
        result = { message: "Write failed" };
      } else {
        const company = {
          ...body,
          id: "carrier-" + ++companySequence,
          shipmentsCount: 0,
        };
        companies.push(company);
        result = company;
        status = 201;
      }
    } else if (failList) {
      status = 500;
      result = { message: "List failed" };
    } else {
      const list = companies.filter(
        (company) =>
          !query.search ||
          company.name.toLowerCase().includes(query.search.toLowerCase()),
      );
      const page = +query.page || 0,
        pageSize = +query.pageSize || 16;
      result = {
        results: list.slice(page * pageSize, (page + 1) * pageSize),
        total: list.length,
      };
    }
  } else if (url.pathname.startsWith("/v1/shipping-companies/")) {
    const company = companies.find(
      (value) => value.id === url.pathname.split("/").at(-1),
    );
    if (!company) {
      status = 404;
      result = { message: "Missing" };
    } else if (request.method === "PATCH" && failSave) {
      status = 500;
      result = { message: "Write failed" };
    } else {
      if (request.method === "PATCH") Object.assign(company, body);
      result = company;
    }
  } else if (url.pathname === "/v1/media/create")
    result = {
      url: "https://uploads.example.test/",
      fields: { key: "carrier-" + ++mediaSequence + ".png" },
    };
  else if (url.pathname === "/v1/countries")
    result = {
      total: 1,
      results: [
        {
          id: "country-1",
          name: { en: "Saudi Arabia", ar: "السعودية" },
          code: "SA",
          dialCode: "+966",
          shipmentCountries: [
            {
              shippingCompanyId: query.shippingCompanyId || "carrier-1",
              name: "Saudi Arabia",
              isActive: true,
            },
          ],
        },
      ],
    };
  else if (url.pathname === "/v1/languages") result = { results: ["en", "ar"] };
  else {
    status = 404;
    result = { message: "Unhandled mock" };
  }
  return fulfill(event, status, result);
}
async function uploadImage(name) {
  await evaluate(
    `(async()=>{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='red';ctx.fillRect(0,0,256,256);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));const data=new DataTransfer();data.items.add(new File([blob],${JSON.stringify(name + ".png")},{type:'image/png'}));const input=document.querySelector('[data-testid=shipping-company-${name}] input[type=file]');input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
  await until(
    "Boolean(document.querySelector('[role=dialog] .cropper-container img')?.complete)",
    "image cropper ready",
  );
  await sleep(200);
  await clickText("Upload", "[role=dialog] button");
  await until(
    `!document.querySelector('[role=dialog]') && Boolean(document.querySelector('[data-testid=shipping-company-${name}] .imageFileRemove'))`,
    "image uploaded",
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

  await login("admin@example.test");
  await until("location.pathname === '/home'", "admin sign in");
  await navigate("/shipping-companies");
  await until(
    "Boolean(document.querySelector('[data-testid=shipping-company-carrier-1]'))",
    "carrier list",
  );
  assert.ok(
    await evaluate(
      "Boolean(document.querySelector('a[href=\"/shipping-companies\"]'))",
    ),
  );
  assert.equal(
    await evaluate(
      "document.querySelectorAll('[data-testid^=shipping-company-carrier-]').length",
    ),
    16,
  );
  console.log("PASS Staff navigation and original carrier card list");

  await evaluate(
    "document.querySelector('button[aria-label=\"Go to page 2\"]').click()",
  );
  await until(
    "Boolean(document.querySelector('[data-testid=shipping-company-carrier-17]'))",
    "carrier pagination",
  );
  assert.equal(
    calls.filter((call) => call.url === "/v1/shipping-companies").at(-1).query
      .page,
    "1",
  );
  await evaluate(
    "document.querySelector('[data-testid=toggle-shipping-company-carrier-17]').click()",
  );
  await until(
    "Boolean(document.querySelector('[role=dialog]'))",
    "activation confirmation",
  );
  const patchesBeforeCancel = calls.filter(
    (call) => call.method === "PATCH",
  ).length;
  await clickText("No", "[role=dialog] button");
  assert.equal(
    calls.filter((call) => call.method === "PATCH").length,
    patchesBeforeCancel,
  );
  await evaluate(
    "document.querySelector('[data-testid=toggle-shipping-company-carrier-17]').click()",
  );
  await until(
    "Boolean(document.querySelector('[role=dialog]'))",
    "confirm activation",
  );
  await clickText("Yes", "[role=dialog] button");
  await until(
    "document.querySelector('[data-testid=toggle-shipping-company-carrier-17]')?.textContent.includes('Activate')",
    "carrier deactivated",
  );
  assert.deepEqual(
    calls.filter((call) => call.method === "PATCH").at(-1).body,
    { isActive: false },
  );
  assert.equal(
    calls.filter((call) => call.url === "/v1/shipping-companies").at(-1).query
      .page,
    "1",
  );
  console.log(
    "PASS Activation confirmation, isolated PATCH and pagination retention",
  );

  await fillSelector(
    "[data-testid=shipping-companies-search]",
    "Carrier & Express",
  );
  await until(
    "document.body.innerText.includes('There are no shipping companies')",
    "empty search results",
  );
  const search = calls
    .filter((call) => call.url === "/v1/shipping-companies")
    .at(-1).query;
  assert.equal(search.search, "Carrier & Express");
  assert.equal(search.page, "0");
  console.log(
    "PASS Encoded searches reset pagination and display empty results",
  );

  await navigate("/shipping-companies/new");
  await until(
    "Boolean(document.querySelector('input[name=serviceName]'))",
    "new carrier form",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('input[name=\"method-cashOnDelivery\"]').disabled",
    ),
    true,
  );
  await evaluate(
    "document.querySelector('[data-testid=save-shipping-company]').click()",
  );
  await until(
    "document.body.innerText.includes('You should add at least one shipping method')",
    "required validation",
  );
  console.log("PASS Shared form validations reject empty configuration");
  await fill("name", "Pilot Carrier");
  await fill("serviceName", "pilotCarrier");
  await evaluate("document.querySelector('input[name=method-local]').click()");
  await until(
    "Boolean(document.querySelector('input[name=localPrice]'))",
    "local fields",
  );
  await evaluate(
    "document.querySelector('input[name=method-cashOnDelivery]').click()",
  );
  await until(
    "Boolean(document.querySelector('input[name=codPrice]'))",
    "COD fields",
  );
  await evaluate("document.querySelector('input[name=method-local]').click()");
  assert.equal(
    await evaluate(
      "document.querySelector('input[name=method-cashOnDelivery]').checked",
    ),
    false,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('input[name=method-cashOnDelivery]').disabled",
    ),
    true,
  );
  console.log("PASS Removing local shipping also removes COD atomically");
  await evaluate(
    "document.querySelector('input[name=method-international]').click()",
  );
  await until(
    "Boolean(document.querySelector('input[name=internationalProfitsRate]'))",
    "international fields",
  );
  await evaluate(
    "document.querySelector('input[name=method-local]').click();document.querySelector('input[name=method-cashOnDelivery]').click()",
  );
  await fill("localPrice", "0");
  await fill("maxWeight", "10");
  await fill("extraWeightPrice", "1.25");
  await fill("codPrice", "5");
  await fill("internationalProfitsRate", "10");
  await fill("internationalProfitsExtras", "2");
  await fill("shipmentFees", "3");
  await fill("shipmentCodFees", "4");
  await fill("shipmentExtraWeightFees", "5");
  await fill("shipmentReturnFees", "6");
  await fill("fuelPercentage", "7.5");
  await uploadImage("logoUrl");
  await uploadImage("iconUrl");
  const uploads = calls.filter((call) => call.upload && call.method === "POST");
  assert.equal(uploads.length, 2);
  assert.equal(
    uploads.some((call) =>
      Object.keys(call.headers).some(
        (key) => key.toLowerCase() === "authorization",
      ),
    ),
    false,
  );
  console.log(
    "PASS Logo and icon cropping use shared presigned uploads without app credentials",
  );
  await evaluate(
    "document.querySelector('[data-testid=save-shipping-company]').click()",
  );
  await until("location.pathname === '/shipping-companies'", "carrier created");
  const created = companies.find((company) => company.name === "Pilot Carrier");
  assert.ok(created);
  assert.equal(created.localPrice, 0);
  assert.equal(created.extraWeightPrice, 1.25);
  assert.equal(created.fuelPercentage, 7.5);
  assert.equal(created.shipmentFees, 3);
  assert.equal(created.shipmentCodFees, 4);
  assert.equal(created.shipmentExtraWeightFees, 5);
  assert.equal(created.shipmentReturnFees, 6);
  assert.equal(created.logoUrl, "https://uploads.example.test/carrier-1.png");
  assert.equal(created.iconUrl, "https://uploads.example.test/carrier-2.png");
  assert.deepEqual(created.shippingMethods.sort(), [
    "cashOnDelivery",
    "international",
    "local",
  ]);
  console.log(
    "PASS Creation retains all methods, fees, decimals, zero prices and appearance URLs",
  );

  await navigate("/shipping-companies/carrier-1");
  await until(
    "Boolean(document.querySelector('input[name=serviceName]'))",
    "edit carrier",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('input[name=serviceName]').disabled",
    ),
    true,
  );
  await fill("name", "Unsaved Carrier Draft");
  await fill("localPrice", "21.5");
  await evaluate(
    "document.querySelector('[data-testid=toggle-shipping-company]').click()",
  );
  await until(
    "Boolean(document.querySelector('[role=dialog]'))",
    "detail activation",
  );
  await clickText("Yes", "[role=dialog] button");
  await until(
    "document.querySelector('[data-testid=toggle-shipping-company]')?.textContent.includes('Activate')",
    "detail deactivation",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=name]').value"),
    "Unsaved Carrier Draft",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=localPrice]').value"),
    "21.5",
  );
  console.log(
    "PASS Existing service names stay locked and activation refetches preserve unsaved edits",
  );
  failSave = true;
  await evaluate(
    "document.querySelector('[data-testid=save-shipping-company]').click()",
  );
  await until(
    "document.body.innerText.includes('Something went wrong while saving the shipping company') && !document.querySelector('[data-testid=save-shipping-company]').disabled",
    "failed save",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=name]').value"),
    "Unsaved Carrier Draft",
  );
  failSave = false;
  await evaluate(
    "document.querySelector('[data-testid=save-shipping-company]').click()",
  );
  await until("location.pathname === '/shipping-companies'", "retry save");
  const saved = calls
    .filter(
      (call) =>
        call.url === "/v1/shipping-companies/carrier-1" &&
        call.method === "PATCH",
    )
    .at(-1).body;
  assert.equal(saved.shipmentsCount, undefined);
  assert.equal(saved.id, undefined);
  assert.equal(saved.localPrice, 21.5);
  assert.equal(saved.isActive, false);
  console.log(
    "PASS Failed saves preserve form data and retries send editable fields only",
  );

  await navigate("/shipping-companies/carrier-1");
  await until(
    "Boolean(document.querySelector('input[name=name]'))",
    "summary links",
  );
  await clickText("View Countries", "a");
  await until(
    "location.pathname === '/countries/carrier-1' && document.body.innerText.includes('Saudi Arabia')",
    "country drilldown",
  );
  assert.equal(
    calls.filter((call) => call.url === "/v1/countries").at(-1).query
      .shippingCompanyId,
    "carrier-1",
  );
  console.log(
    "PASS Summary country link opens the existing carrier-scoped countries feature",
  );
  await navigate("/shipping-companies/missing");
  await until(
    "document.body.innerText.includes('There is no such shipping company')",
    "missing carrier",
  );
  console.log("PASS Missing carrier has a recoverable error page");
  failList = true;
  await navigate("/shipping-companies");
  await until(
    "document.body.innerText.includes('Could not load shipping companies')",
    "list failure",
  );
  failList = false;
  await clickText("Retry");
  await until(
    "Boolean(document.querySelector('[data-testid=shipping-company-carrier-1]'))",
    "list retry",
  );
  console.log("PASS List errors support retry");

  await login("viewer@example.test");
  await until("location.pathname === '/home'", "viewer signed in");
  await navigate("/shipping-companies");
  await until(
    "Boolean(document.querySelector('[data-testid=shipping-company-carrier-1]'))",
    "viewer list",
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=add-shipping-company]'))",
    ),
    false,
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid^=toggle-shipping-company]'))",
    ),
    false,
  );
  await navigate("/shipping-companies/carrier-1");
  await until(
    "Boolean(document.querySelector('input[name=name]'))",
    "read-only carrier",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('input[name=name]').matches(':disabled')",
    ),
    true,
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=save-shipping-company]'))",
    ),
    false,
  );
  console.log(
    "PASS Employees with view permission get read-only lists and forms",
  );
  await navigate("/shipping-companies/new");
  await until(
    "location.pathname === '/home' || document.body.innerText.includes('Unauthorized Access')",
    "create permission denied",
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('input[name=serviceName]'))",
    ),
    false,
  );
  console.log("PASS Direct create routes require create permission");
  await login("denied@example.test");
  await until("location.pathname === '/home'", "restricted employee");
  await navigate("/shipping-companies");
  await until(
    "location.pathname === '/home' || document.body.innerText.includes('Unauthorized Access')",
    "feature permission denied",
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=shipping-company-carrier-1]'))",
    ),
    false,
  );
  console.log(
    "PASS Employees without carrier permissions cannot open the feature",
  );
  await login("merchant@example.test");
  await until("location.pathname === '/home'", "merchant signed in");
  await navigate("/shipping-companies");
  await until(
    "location.pathname === '/home' || document.body.innerText.includes('Unauthorized Access')",
    "merchant denied",
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=shipping-company-carrier-1]'))",
    ),
    false,
  );
  console.log("PASS Merchants cannot open staff-only carrier routes");

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
  await navigate("/shipping-companies");
  await until(
    "document.body.innerText.includes('شركات الشحن') && Boolean(document.querySelector('[data-testid=shipping-company-carrier-1]'))",
    "Arabic carrier cards",
  );
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  await sleep(1800);
  let screenshot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(output, "shipping-companies-ar-mobile.png"),
    Buffer.from(screenshot.data, "base64"),
  );
  await navigate("/shipping-companies/carrier-1");
  await until(
    "Boolean(document.querySelector('input[name=serviceName]'))",
    "Arabic mobile form",
  );
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  await sleep(600);
  screenshot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(output, "shipping-company-ar-mobile.png"),
    Buffer.from(screenshot.data, "base64"),
  );
  console.log("PASS Arabic RTL card list and detail form on mobile");
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks: 17, exceptions, calls }, null, 2),
  );
  console.log("17/17 shipping-company browser checks passed.");
}
main()
  .catch((error) => {
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
