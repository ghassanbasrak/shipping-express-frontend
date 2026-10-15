// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/countries-browser");
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
let failCountries = false;
const countries = Array.from({ length: 25 }, (_, index) => ({
  id: "country-" + (index + 1),
  name: {
    en:
      index === 0
        ? "Saudi Arabia"
        : index === 1
          ? "United Arab Emirates"
          : "Country " + (index + 1),
    ar: index === 0 ? "السعودية" : "دولة " + (index + 1),
  },
  code: index === 0 ? "SA" : "AE",
  dialCode: index === 0 ? "+966" : "+971",
  createdAt: "2026-01-05T00:00:00.000Z",
}));
const mappings = [
  {
    _id: "mapping-1",
    countryId: "country-1",
    shippingCompanyId: "carrier-1",
    name: "Saudi Arabia",
    isActive: true,
  },
  {
    _id: "mapping-2",
    countryId: "country-2",
    shippingCompanyId: "carrier-1",
    name: "United Arab Emirates",
    isActive: true,
  },
];
let mappingSequence = 2;
let failMappingSave = false,
  failCountryUpdate = false,
  failCountryRemove = false,
  countrySequence = 0;
const countryRecord = (country) => ({
  ...country,
  shipmentCountries: mappings.filter((row) => row.countryId === country.id),
});
async function intercept(event) {
  const request = event.request;
  const url = new URL(request.url);
  if (!url.pathname.includes("/v1/"))
    return send("Fetch.continueRequest", { requestId: event.requestId });
  if (request.method === "OPTIONS")
    return send("Fetch.fulfillRequest", {
      requestId: event.requestId,
      responseCode: 204,
      responseHeaders: [
        { name: "Access-Control-Allow-Origin", value: "*" },
        {
          name: "Access-Control-Allow-Methods",
          value: "GET,POST,PATCH,DELETE,OPTIONS",
        },
        { name: "Access-Control-Allow-Headers", value: "*" },
      ],
    });
  const body = JSON.parse(request.postData || "{}");
  const query = Object.fromEntries(url.searchParams);
  calls.push({ url: url.pathname, method: request.method, query, body });
  let result = {},
    status = 200;
  if (url.pathname.endsWith("/auth-sessions/login")) {
    account = {
      ...normal,
      id: "admin-1",
      role: body.email.startsWith("employee") ? "employee" : "admin",
      firstName: "Country",
      lastName: "Admin",
    };
    result = {
      user: account,
      accessToken: "country-token",
      refreshToken: "country-refresh",
    };
  } else if (url.pathname.endsWith("/users/me"))
    result = account || { ...normal, role: "admin" };
  else if (url.pathname === "/v1/countries") {
    if (request.method === "POST") {
      const row = {
        ...body,
        id: "country-created-" + ++countrySequence,
        createdAt: "2026-02-01T00:00:00.000Z",
      };
      countries.push(row);
      result = countryRecord(row);
      status = 201;
    } else if (failCountries) {
      status = 500;
      result = { message: "Mock country failure" };
    } else {
      let list = countries
        .map(countryRecord)
        .filter(
          (row) =>
            !query.search ||
            Object.values(row.name).some((name) =>
              name.toLowerCase().includes(query.search.toLowerCase()),
            ),
        );
      // Return unscoped rows to verify the source feature's client carrier filter.
      const page = +query.page || 0;
      const pageSize = +query.pageSize || 10;
      result = {
        total: list.length,
        results: list.slice(page * pageSize, (page + 1) * pageSize),
      };
    }
  } else if (url.pathname.startsWith("/v1/countries/")) {
    const id = url.pathname.split("/").at(-1);
    const index = countries.findIndex((row) => row.id === id);
    if (index < 0) {
      status = 404;
      result = { message: "Not found" };
    } else if (
      (request.method === "PATCH" && failCountryUpdate) ||
      (request.method === "DELETE" && failCountryRemove)
    ) {
      status = 500;
      result = { message: "Parent request failed" };
    } else if (request.method === "DELETE") {
      countries.splice(index, 1);
      status = 204;
    } else {
      if (request.method === "PATCH")
        countries[index] = { ...countries[index], ...body };
      result = countryRecord(countries[index]);
    }
  } else if (url.pathname === "/v1/shipment-countries") {
    if (request.method === "POST" && failMappingSave) {
      status = 500;
      result = { message: "Mapping request failed" };
    } else if (request.method === "POST") {
      const row = { ...body, _id: "mapping-" + ++mappingSequence };
      mappings.push(row);
      result = row;
      status = 201;
    } else
      result = {
        total: mappings.filter((row) => row.countryId === query.countryId)
          .length,
        results: mappings.filter((row) => row.countryId === query.countryId),
      };
  } else if (url.pathname.startsWith("/v1/shipment-countries/")) {
    const index = mappings.findIndex(
      (row) => row._id === url.pathname.split("/").at(-1),
    );
    if (index < 0) {
      status = 404;
      result = { message: "Mapping missing" };
    } else if (request.method === "DELETE") {
      mappings.splice(index, 1);
      status = 204;
    } else {
      mappings[index] = { ...mappings[index], ...body };
      result = mappings[index];
    }
  } else if (url.pathname === "/v1/shipping-companies")
    result = {
      results: [
        { id: "carrier-1", name: "Carrier One" },
        { id: "carrier-2", name: "Carrier Two" },
      ],
      total: 2,
    };
  else if (url.pathname === "/v1/languages")
    result = { results: ["en", "ar", "tr"] };
  else if (url.pathname === "/v1/states")
    result = {
      results: [
        {
          id: "state-1",
          name: { en: "Riyadh", ar: "الرياض" },
          createdAt: "2026-01-02T00:00:00.000Z",
        },
      ],
      total: 1,
    };
  else {
    status = 404;
    result = { message: "Unhandled mock endpoint" };
  }
  await send("Fetch.fulfillRequest", {
    requestId: event.requestId,
    responseCode: status,
    responseHeaders: [
      { name: "Content-Type", value: "application/json" },
      { name: "Access-Control-Allow-Origin", value: "*" },
    ],
    body:
      status === 204
        ? ""
        : Buffer.from(JSON.stringify(result)).toString("base64"),
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
  await until("location.pathname==='/home'", "admin sign-in");
  await navigate("/countries/all");
  await until(
    "Boolean(document.querySelector('[role=row][data-id=country-1]'))",
    "countries list",
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('a[href=\"/countries/all\"]'))",
    ),
    true,
  );
  console.log("PASS Admin navigation and paginated countries list");
  let screenshot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(output, "countries-en.png"),
    Buffer.from(screenshot.data, "base64"),
  );

  await evaluate(
    "document.querySelector('button[aria-label=\"Go to next page\"]').click()",
  );
  await until(
    "Boolean(document.querySelector('[role=row][data-id=country-11]'))",
    "next page",
  );
  assert.equal(
    calls
      .filter((call) => call.url === "/v1/countries" && call.method === "GET")
      .at(-1).query.page,
    "1",
  );
  console.log("PASS Server pagination remains on the requested page");
  await fillSelector("[data-testid=countries-search]", "Saudi & Bahrain");
  await until(
    "document.body.innerText.includes('There are no countries')",
    "encoded search",
  );
  assert.equal(
    calls
      .filter((call) => call.url === "/v1/countries" && call.method === "GET")
      .at(-1).query.search,
    "Saudi & Bahrain",
  );
  await fillSelector("[data-testid=countries-search]", "Saudi");
  await until(
    "Boolean(document.querySelector('[role=row][data-id=country-1]'))",
    "search result",
  );
  assert.equal(
    calls
      .filter((call) => call.url === "/v1/countries" && call.method === "GET")
      .at(-1).query.page,
    "0",
  );
  console.log("PASS Search parameters are encoded and reset pagination");
  await fillSelector("[data-testid=countries-search]", "");
  await until(
    "Boolean(document.querySelector('[role=row][data-id=country-2]'))",
    "clear search",
  );
  await evaluate(
    "document.querySelector('[data-testid=countries-header] button').click()",
  );
  await until(
    "Boolean(document.querySelector('#filters-menu [role=combobox]'))",
    "filters menu",
  );
  await evaluate(
    "document.querySelector('#filters-menu [role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0}))",
  );
  await until(
    "Boolean(document.querySelector('[role=option][data-value=carrier-1]'))",
    "carrier options",
  );
  await evaluate(
    "document.querySelector('[role=option][data-value=carrier-1]').click()",
  );
  await until(
    "document.querySelectorAll('[role=row][data-id]').length===2",
    "carrier filter",
  );
  assert.equal(
    calls
      .filter((call) => call.url === "/v1/countries" && call.method === "GET")
      .at(-1).query.shippingCompanyId,
    "carrier-1",
  );
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
  console.log("PASS Shipping-company filter uses the original API contract");

  await navigate("/countries/all/country-1");
  await until(
    "Boolean(document.querySelector('input[name=\"name.en\"]')) && Boolean(document.querySelector('[data-testid=mapping-carrier-2]'))",
    "country details",
  );
  await fill("name.en", "Unsaved Draft");
  await fill("shipmentCountries.0.name", "Carrier name one");
  await evaluate(
    "document.querySelector('[data-testid=save-mapping-carrier-1]').click()",
  );
  await until(
    "document.body.innerText.includes('Country name saved successfully')",
    "carrier saved",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=\"name.en\"]').value"),
    "Unsaved Draft",
  );
  assert.equal(
    mappings.find((row) => row._id === "mapping-1").name,
    "Carrier name one",
  );
  await fill("shipmentCountries.0.name", "Carrier name two");
  await evaluate(
    "document.querySelector('[data-testid=save-mapping-carrier-1]').click()",
  );
  await until(
    "!document.querySelector('[data-testid=save-mapping-carrier-1]').disabled",
    "second mapping save",
  );
  assert.equal(
    calls.filter(
      (call) =>
        call.url === "/v1/shipment-countries/mapping-1" &&
        call.method === "PATCH",
    ).length,
    2,
  );
  console.log(
    "PASS Existing carrier names reuse backend IDs and preserve unsaved country fields",
  );
  await evaluate(
    "document.querySelector('input[name=\"shipmentCountries.1.isActive\"]').click()",
  );
  await fill("shipmentCountries.1.name", "New carrier name");
  await evaluate(
    "document.querySelector('[data-testid=save-mapping-carrier-2]').click()",
  );
  await until(
    "!document.querySelector('[data-testid=save-mapping-carrier-2]').disabled",
    "mapping created",
  );
  const createdMapping = mappings.find(
    (row) =>
      row.shippingCompanyId === "carrier-2" && row.countryId === "country-1",
  );
  assert.ok(createdMapping);
  await fill("shipmentCountries.1.name", "New carrier renamed");
  await evaluate(
    "document.querySelector('[data-testid=save-mapping-carrier-2]').click()",
  );
  await until(
    "!document.querySelector('[data-testid=save-mapping-carrier-2]').disabled",
    "new mapping patched",
  );
  assert.equal(
    calls.filter(
      (call) =>
        call.url === "/v1/shipment-countries/" + createdMapping._id &&
        call.method === "PATCH",
    ).length,
    1,
  );
  console.log(
    "PASS A newly saved carrier mapping updates instead of creating duplicates",
  );
  await evaluate(
    "document.querySelector('input[name=\"shipmentCountries.0.isActive\"]').click()",
  );
  await until(
    "!document.querySelector('input[name=\"shipmentCountries.0.isActive\"]').checked && !document.querySelector('input[name=\"shipmentCountries.0.isActive\"]').disabled",
    "mapping disabled",
  );
  assert.equal(mappings.find((row) => row._id === "mapping-1").isActive, false);
  console.log("PASS Carrier activation changes persist independently");
  failCountryUpdate = true;
  await fill("shipmentCountries.1.name", "Pending parent save");
  const mappingWrites = () =>
    calls.filter(
      (call) =>
        call.url.startsWith("/v1/shipment-countries") && call.method !== "GET",
    ).length;
  const writesBeforeFailedParent = mappingWrites();
  await evaluate(
    "document.querySelector('[data-testid=save-country]').click()",
  );
  await until(
    "document.body.innerText.includes('Something went wrong while saving country') && !document.querySelector('[data-testid=save-country]').disabled",
    "failed parent update",
  );
  assert.equal(mappingWrites(), writesBeforeFailedParent);
  assert.equal(
    await evaluate(
      `document.querySelector('input[name="shipmentCountries.1.name"]').value`,
    ),
    "Pending parent save",
  );
  failCountryUpdate = false;
  console.log(
    "PASS Failed parent update preserves drafts and does not save child mappings",
  );
  await fill("code", "sa");
  await evaluate(
    "document.querySelector('[data-testid=save-country]').click()",
  );
  await until(
    "location.pathname==='/countries/all' && document.body.innerText.includes('Unsaved Draft')",
    "country updated",
  );
  const countryUpdate = calls
    .filter(
      (call) =>
        call.url === "/v1/countries/country-1" && call.method === "PATCH",
    )
    .at(-1);
  assert.equal(countryUpdate.body.code, "SA");
  assert.equal(countryUpdate.body.shipmentCountries, undefined);
  console.log(
    "PASS Country update saves editable fields and keeps code normalization",
  );

  await navigate("/countries/all/new");
  await until(
    "Boolean(document.querySelector('input[name=code]')) && Boolean(document.querySelector('[data-testid=mapping-carrier-1]'))",
    "new country",
  );
  await fill("name.en", "Pilot Country");
  await fill("name.ar", "دولة تجريبية");
  await fill("code", "xy");
  await fill("dialCode", "+999");
  await evaluate(
    "document.querySelector('input[name=\"shipmentCountries.0.isActive\"]').click()",
  );
  await fill("shipmentCountries.0.name", "Pilot carrier name");
  await evaluate(
    "document.querySelector('[data-testid=save-country]').click()",
  );
  await until("location.pathname==='/countries/all'", "country creation");
  const createdCountry = countries.find(
    (row) => row.name.en === "Pilot Country",
  );
  assert.ok(createdCountry);
  assert.equal(createdCountry.code, "XY");
  assert.ok(
    mappings.find(
      (row) =>
        row.countryId === createdCountry.id &&
        row.name === "Pilot carrier name",
    ),
  );
  console.log(
    "PASS Country creation includes localized fields and carrier naming",
  );

  await fillSelector("[data-testid=countries-search]", "Pilot");
  await until(
    `Boolean(document.querySelector('[role=row][data-id="${createdCountry.id}"]'))`,
    "new country row",
  );
  await evaluate(
    `document.querySelector('[role=row][data-id="${createdCountry.id}"] button[aria-label=More]').click()`,
  );
  await until(
    "[...document.querySelectorAll('[role=button]')].some(element=>element.textContent==='Edit Names')",
    "row action menu",
  );
  await clickText("Edit Names", "[role=button]");
  await until(
    "Boolean(document.querySelector('[role=dialog] input[name=\"shipmentCountries.0.name\"]'))",
    "naming dialog",
  );
  await fill("shipmentCountries.0.name", "Dialog carrier name");
  await evaluate(
    "document.querySelector('[role=dialog] [data-testid=save-mapping-carrier-1]').click()",
  );
  await until(
    "!document.querySelector('[role=dialog] [data-testid=save-mapping-carrier-1]').disabled",
    "dialog save",
  );
  assert.equal(
    mappings.find(
      (row) =>
        row.countryId === createdCountry.id &&
        row.shippingCompanyId === "carrier-1",
    ).name,
    "Dialog carrier name",
  );
  console.log(
    "PASS List naming dialog loads and saves persisted carrier mappings",
  );

  await navigate("/states/all/country-2");
  await until("document.body.innerText.includes('Riyadh')", "state preview");
  assert.equal(
    calls.filter((call) => call.url === "/v1/states").at(-1).query.countryId,
    "country-2",
  );
  console.log("PASS View States opens a working country-scoped list");
  await navigate("/countries/all/missing");
  await until(
    "document.body.innerText.includes('No such country')",
    "missing country",
  );
  console.log("PASS Missing country has a recoverable error page");
  await navigate(`/countries/all/${createdCountry.id}`);
  await until(
    "Boolean(document.querySelector('[data-testid=save-country]'))",
    "delete country",
  );
  failCountryRemove = true;
  const mappingsBeforeDelete = mappings.filter(
    (row) => row.countryId === createdCountry.id,
  ).length;
  await clickText("Remove", "button");
  await until(
    "Boolean(document.querySelector('[role=dialog]'))",
    "failed delete confirmation",
  );
  await clickText("Yes", "[role=dialog] button");
  await until(
    "document.body.innerText.includes('Something went wrong while removing country') && !document.querySelector('button.MuiLoadingButton-loading')",
    "failed parent deletion",
  );
  assert.ok(countries.some((row) => row.id === createdCountry.id));
  assert.equal(
    mappings.filter((row) => row.countryId === createdCountry.id).length,
    mappingsBeforeDelete,
  );
  failCountryRemove = false;
  console.log(
    "PASS Failed parent deletion preserves country and carrier mappings",
  );
  await clickText("Remove", "button");
  await until(
    "Boolean(document.querySelector('[role=dialog]'))",
    "delete confirmation",
  );
  await clickText("Yes", "[role=dialog] button");
  await until("location.pathname==='/countries/all'", "country removed");
  assert.equal(
    countries.some((row) => row.id === createdCountry.id),
    false,
  );
  assert.equal(
    mappings.some((row) => row.countryId === createdCountry.id),
    false,
  );
  console.log(
    "PASS Confirmed removal deletes the country and its mapping records",
  );

  await navigate("/countries/all/new");
  await until(
    "Boolean(document.querySelector('input[name=code]')) && Boolean(document.querySelector('[data-testid=mapping-carrier-1]'))",
    "partial create form",
  );
  await fill("name.en", "Recovery Country");
  await fill("code", "rc");
  await fill("dialCode", "+123");
  await evaluate(
    `document.querySelector('input[name="shipmentCountries.0.isActive"]').click()`,
  );
  await fill("shipmentCountries.0.name", "Recover this carrier");
  failMappingSave = true;
  const parentCreatesBefore = calls.filter(
    (call) => call.url === "/v1/countries" && call.method === "POST",
  ).length;
  await evaluate(
    "document.querySelector('[data-testid=save-country]').click()",
  );
  await until(
    "location.pathname.startsWith('/countries/all/country-created-') && Boolean(document.querySelector('input[name=code]'))",
    "saved parent recovery route",
  );
  await until(
    `document.querySelector('input[name="shipmentCountries.0.name"]')?.value === "Recover this carrier"`,
    "failed carrier draft restored",
  );
  failMappingSave = false;
  await evaluate(
    "document.querySelector('[data-testid=save-country]').click()",
  );
  await until(
    "location.pathname === '/countries/all'",
    "partial create retried",
  );
  assert.equal(
    calls.filter(
      (call) => call.url === "/v1/countries" && call.method === "POST",
    ).length,
    parentCreatesBefore + 1,
  );
  const recoveryCountry = countries.find(
    (row) => row.name.en === "Recovery Country",
  );
  assert.ok(
    mappings.some(
      (row) =>
        row.countryId === recoveryCountry.id &&
        row.name === "Recover this carrier",
    ),
  );
  console.log(
    "PASS Partial creation recovers the carrier draft without duplicating the country",
  );

  failCountries = true;
  await navigate("/countries/all");
  await until(
    "document.body.innerText.includes('Something went wrong while getting the countries')",
    "list error",
  );
  failCountries = false;
  await clickText("Retry", "button");
  await until(
    "Boolean(document.querySelector('[role=row][data-id=country-1]'))",
    "list retry",
  );
  console.log("PASS List failures support retry");
  await login("employee@example.test");
  await until("location.pathname==='/home'", "employee sign-in");
  await navigate("/countries/all");
  await until("location.pathname==='/home'", "employee denied");
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[role=row][data-id=country-1]'))",
    ),
    false,
  );
  console.log("PASS Employee access is denied for this admin-only feature");

  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin session");
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
  await navigate("/countries/all");
  await until(
    "document.body.innerText.includes('إضافة دولة') && Boolean(document.querySelector('[role=row][data-id=country-1]'))",
    "Arabic countries",
  );
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  screenshot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(output, "countries-ar-mobile.png"),
    Buffer.from(screenshot.data, "base64"),
  );
  console.log("PASS Arabic RTL countries page on mobile");
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks: 19, exceptions, calls }, null, 2),
  );
  console.log("19/19 country browser checks passed.");
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
