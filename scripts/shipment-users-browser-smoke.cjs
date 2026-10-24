// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/shipment-users-browser");
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
  failRemove = false,
  failPlaces = false,
  sequence = 26;
const countryA = {
    id: "65fd1a1c1fdbc094e3369b29",
    name: { en: "Country Alpha", ar: "الدولة ألف" },
  },
  countryB = {
    id: "country-2",
    name: { en: "Country Beta", ar: "الدولة باء" },
  };
const states = [
  { id: "state-1", countryId: countryA.id, name: { en: "State Alpha" } },
  { id: "state-2", countryId: countryA.id, name: { en: "State Second" } },
  { id: "state-3", countryId: countryB.id, name: { en: "State Beta" } },
];
const cities = [
  {
    id: "city-1",
    countryId: countryA.id,
    stateId: "state-1",
    name: { en: "City Alpha" },
    postalCode: "11111",
  },
  {
    id: "city-2",
    countryId: countryA.id,
    stateId: "state-2",
    name: { en: "City Second" },
    postalCode: "22222",
  },
  {
    id: "city-3",
    countryId: countryB.id,
    stateId: "state-3",
    name: { en: "City Beta" },
    postalCode: "33333",
  },
];
const marker = " - العنوان الوطني: ";
const records = Array.from({ length: 26 }, (_, i) => ({
  id: "contact-" + (i + 1),
  fullName: "Contact " + String(i + 1).padStart(2, "0"),
  type: i % 2 ? "receiver" : "sender",
  phone: "+966-501234567",
  phone1: "+1-2025550123",
  email: "contact@example.test",
  address: {
    countryId: countryA.id,
    stateId: "state-1",
    cityId: "city-1",
    street: "Main Street" + marker + "ABCD1234",
    zipCode: "custom-zip",
  },
  ...(i === 0 ? { country: countryA, state: states[0], city: cities[0] } : {}),
  senderShipmentsCount: 7,
  receiverShipmentsCount: 3,
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
  const request = event.request,
    url = new URL(request.url),
    method = request.method;
  if (method === "OPTIONS") return fulfill(event, 204, "");
  if (!url.pathname.includes("/v1/"))
    return send("Fetch.continueRequest", { requestId: event.requestId });
  const body = JSON.parse(request.postData || "{}"),
    query = Object.fromEntries(url.searchParams);
  calls.push({ url: url.pathname, method, body, query });
  let result = {},
    status = 200;
  if (url.pathname.endsWith("/auth-sessions/login")) {
    const viewer = body.email.startsWith("viewer"),
      denied = body.email.startsWith("denied"),
      merchant = body.email.startsWith("merchant");
    account = {
      ...normal,
      id: merchant ? "merchant-1" : "staff-1",
      role: merchant ? "user" : viewer || denied ? "employee" : "admin",
    };
    if (viewer)
      account.features = [
        {
          feature: "shipment-users",
          accessView: true,
          accessCreate: false,
          accessUpdate: false,
          accessDelete: false,
        },
      ];
    if (denied) account.features = [{ feature: "merchants", accessView: true }];
    result = {
      user: account,
      accessToken: "contacts-access",
      refreshToken: "contacts-refresh",
    };
  } else if (url.pathname.endsWith("/users/me"))
    result = account || { ...normal, role: "admin" };
  else if (/^\/v1\/(countries|states|cities)(\/.*)?$/.test(url.pathname)) {
    const [, kind, id] = url.pathname.split("/").slice(1);
    const list =
      kind === "countries"
        ? [countryA, countryB]
        : kind === "states"
          ? states
          : cities;
    if (failPlaces) {
      status = 500;
      result = { message: "Places failed" };
    } else if (id)
      result = list.find((x) => x.id === id) || { ...countryA, id };
    else {
      const filtered = list.filter(
        (x) =>
          (!query.countryId || x.countryId === query.countryId) &&
          (!query.stateId || x.stateId === query.stateId) &&
          (!query.search ||
            JSON.stringify(x.name)
              .toLowerCase()
              .includes(query.search.toLowerCase())),
      );
      result = { results: filtered, total: filtered.length };
    }
  } else if (url.pathname === "/v1/shipping-users") {
    if (method === "POST") {
      if (failSave) {
        status = 500;
        result = { message: "Save failed" };
      } else {
        result = { ...body, id: "contact-" + ++sequence };
        records.push(result);
      }
    } else if (failList) {
      status = 500;
      result = { message: "List failed" };
    } else {
      const list = records.filter(
        (x) =>
          (!query.type || x.type === query.type) &&
          (!query.search ||
            x.fullName.toLowerCase().includes(query.search.toLowerCase())),
      );
      result = {
        results: list.slice(
          Number(query.page) * Number(query.pageSize),
          (Number(query.page) + 1) * Number(query.pageSize),
        ),
        total: list.length,
      };
    }
  } else if (url.pathname.startsWith("/v1/shipping-users/")) {
    const id = url.pathname.split("/").at(-1),
      index = records.findIndex((x) => x.id === id);
    if (index < 0) {
      status = 404;
      result = { message: "Missing contact" };
    } else if (method === "DELETE") {
      if (failRemove) {
        status = 500;
        result = { message: "Delete failed" };
      } else {
        records.splice(index, 1);
        status = 204;
      }
    } else if (method === "PATCH") {
      if (failSave) {
        status = 500;
        result = { message: "Save failed" };
      } else {
        records[index] = { ...records[index], ...body };
        result = records[index];
      }
    } else result = records[index];
  } else {
    status = 404;
    result = { message: "Unexpected mock URL " + url.pathname };
  }
  return fulfill(event, status, result);
}
async function click(selector) {
  await evaluate(
    `(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(x=>x.getClientRects().length);if(!e)throw Error('Missing visible '+${JSON.stringify(selector)});e.click()})()`,
  );
}
async function fillField(name, value) {
  await evaluate(
    `(()=>{const input=[...document.querySelectorAll('[name=${JSON.stringify(name)}]')].find(x=>x.getClientRects().length);if(!input)throw Error('Missing visible field '+${JSON.stringify(name)});const proto=input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
}
async function field(name) {
  return evaluate(
    `(()=>{const input=[...document.querySelectorAll('[name=${JSON.stringify(name)}]')].find(x=>x.getClientRects().length);return input?.value})()`,
  );
}
async function place(name, text) {
  await evaluate(
    `(()=>{const input=[...document.querySelectorAll('[name=${JSON.stringify(name)}]')].find(x=>x.getClientRects().length);input.focus();input.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',code:'ArrowDown',bubbles:true}));})()`,
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
async function editor(id) {
  await navigate("/shipment-users/all/" + id);
  await until(
    `Boolean([...document.querySelectorAll('input[name=fullName]')].find(x=>x.getClientRects().length))`,
    "editor " + id,
  );
}
async function saved() {
  await click("[data-testid=save-shipment-user]");
}
async function confirmDelete() {
  await until(
    "Boolean(document.querySelector('[role=dialog] button'))",
    "confirmation",
  );
  await clickText("Yes", "[role=dialog] button");
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
  await reset("/shipment-users/all");
  await until(
    "location.pathname==='/sign-in' && Boolean(document.querySelector('input[name=email]'))",
    "guest protection",
  );
  pass("Guests must authenticate before opening the address book");
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin login");
  await navigate("/shipment-users/all");
  await until(
    "Boolean(document.querySelector('[data-testid=shipment-user-contact-1]'))",
    "address book",
  );
  assert.equal(
    await evaluate(
      "document.querySelectorAll('[data-testid^=shipment-user-contact-]').length",
    ),
    16,
  );
  pass("Staff list and original sixteen-card pagination");
  await click('button[aria-label="Go to page 2"]');
  await until(
    "Boolean(document.querySelector('[data-testid=shipment-user-contact-17]'))",
    "second page",
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/shipping-users").at(-1).query.page,
    "1",
  );
  await click('a[href="/shipment-users/all/contact-17"]');
  await until(
    "Boolean(document.querySelector('input[name=fullName]'))",
    "sidebar",
  );
  await click("[data-testid=close-shipment-user]");
  await until("location.pathname==='/shipment-users/all'", "close sidebar");
  assert.ok(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=shipment-user-contact-17]'))",
    ),
  );
  pass("Opening and closing the sidebar preserves list pagination");
  await fillSelector("[data-testid=shipment-users-search]", "Contact 01");
  await until(
    "Boolean(document.querySelector('[data-testid=shipment-user-contact-1]')) && !document.querySelector('[data-testid=shipment-user-contact-17]')",
    "search",
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/shipping-users").at(-1).query.page,
    "0",
  );
  pass("Search resets pagination and uses backend filtering");
  await editor("contact-1");
  assert.equal(await field("address.street"), "Main Street");
  assert.equal(await field("address.nationalAddress"), "ABCD1234");
  assert.equal(await field("address.zipCode"), "custom-zip");
  assert.ok((await field("phone")).replace(/\D/g, "").includes("501234567"));
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('input[name=fullName]')].filter(x=>x.getClientRects().length).length",
    ),
    1,
  );
  await screenshot("desktop-editor");
  pass("Stored phones, national address and custom ZIP restore in the sidebar");
  await fillField("fullName", "Unsaved Contact");
  failRemove = true;
  await click("[data-testid=close-shipment-user]");
  await navigate("/shipment-users/all");
  await until(
    "Boolean(document.querySelector('[data-testid=shipment-user-contact-2]'))",
    "list",
  );
  await editor("contact-1");
  await fillField("fullName", "Unsaved Contact");
  await click("[data-testid=remove-shipment-user-contact-2]");
  await until(
    "Boolean(document.querySelector('[role=dialog]'))",
    "delete dialog",
  );
  await clickText("No", "[role=dialog] button");
  assert.equal(calls.filter((x) => x.method === "DELETE").length, 0);
  await click("[data-testid=remove-shipment-user-contact-2]");
  await confirmDelete();
  await until("!document.querySelector('[role=dialog]')", "failed delete ends");
  assert.equal(await field("fullName"), "Unsaved Contact");
  assert.ok(records.some((x) => x.id === "contact-2"));
  failRemove = false;
  await click("[data-testid=remove-shipment-user-contact-2]");
  await confirmDelete();
  await until(
    "!document.querySelector('[data-testid=shipment-user-contact-2]')",
    "remove other contact",
  );
  assert.equal(
    calls.filter((x) => x.method === "DELETE").at(-1).url,
    "/v1/shipping-users/contact-2",
  );
  assert.equal(await field("fullName"), "Unsaved Contact");
  pass(
    "Delete cancellation, failure and explicit row ID preserve another editor draft",
  );
  failSave = true;
  await saved();
  await until(
    "document.body.innerText.includes('Something went wrong')",
    "failed save",
  );
  assert.equal(await field("fullName"), "Unsaved Contact");
  failSave = false;
  await saved();
  await until("location.pathname==='/shipment-users/all'", "successful update");
  const update = calls.filter((x) => x.method === "PATCH").at(-1).body;
  assert.equal(update.phone, "+966-501234567");
  assert.equal(update.phone1, "+1-2025550123");
  assert.equal(update.address.street, "Main Street" + marker + "ABCD1234");
  assert.equal(update.userId, undefined);
  pass(
    "Failed updates keep drafts; retry preserves backend phone and address formats",
  );
  await editor("contact-3");
  await until(
    "document.querySelector('[name=\"address.cityId\"]')?.value.includes('City Alpha')",
    "fallback lookup",
  );
  assert.equal(await field("address.zipCode"), "custom-zip");
  pass(
    "Unpopulated geography loads selected IDs without overwriting a custom ZIP",
  );
  await place("address.cityId", "City Second");
  assert.ok((await field("address.stateId")).includes("State Second"));
  assert.equal(await field("address.zipCode"), "22222");
  await place("address.countryId", "Country Beta");
  assert.equal(await field("address.stateId"), "");
  assert.equal(await field("address.cityId"), "");
  assert.equal(await field("address.zipCode"), "");
  await place("address.cityId", "City Beta");
  assert.ok((await field("address.stateId")).includes("State Beta"));
  assert.equal(await field("address.zipCode"), "33333");
  await saved();
  await until("location.pathname==='/shipment-users/all'", "geography save");
  const geo = calls.filter((x) => x.method === "PATCH").at(-1).body.address;
  assert.equal(geo.countryId, "country-2");
  assert.equal(geo.stateId, "state-3");
  assert.equal(geo.cityId, "city-3");
  pass("City supplies state and ZIP; changing country clears dependent fields");
  await navigate("/shipment-users/sender/new");
  await until(
    "Boolean(document.querySelector('input[name=fullName]'))",
    "new sender",
  );
  await saved();
  await until(
    "document.querySelectorAll('.Mui-error').length>0",
    "required validation",
  );
  const writes = calls.filter(
    (x) => x.method === "POST" && x.url === "/v1/shipping-users",
  ).length;
  assert.equal(writes, 0);
  await fillField("fullName", "New Sender");
  await fillField("phone", "+966501234567");
  await place("address.countryId", "Country Alpha");
  await place("address.stateId", "State Alpha");
  await fillField("address.nationalAddress", "EFGH5678");
  await saved();
  await until(
    "location.pathname==='/shipment-users/sender'",
    "state-only create",
  );
  const created = calls
    .filter((x) => x.method === "POST" && x.url === "/v1/shipping-users")
    .at(-1).body;
  assert.equal(created.type, "sender");
  assert.equal(created.address.cityId, "");
  assert.equal(created.address.stateId, "state-1");
  assert.equal(created.phone, "+966-501234567");
  assert.equal(created.address.street, marker + "EFGH5678");
  assert.equal(created.phone1, "");
  pass(
    "New sender validates required fields and supports optional city/street",
  );
  await navigate("/shipment-users/receiver/new");
  await until(
    "Boolean(document.querySelector('input[name=type]'))",
    "new receiver",
  );
  assert.equal(
    await evaluate("document.querySelector('input[name=type]').value"),
    "receiver",
  );
  await click("[data-testid=close-shipment-user]");
  await until(
    "location.pathname==='/shipment-users/receiver'",
    "receiver filter",
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/shipping-users").at(-1).query.type,
    "receiver",
  );
  pass(
    "Sender/receiver routes provide matching filters and new-record defaults",
  );
  await navigate("/shipment-users/bad/contact-1");
  await until(
    "location.pathname==='/shipment-users/all/contact-1' && Boolean(document.querySelector('input[name=fullName]'))",
    "invalid type redirect",
  );
  pass("Invalid type routes preserve the selected backend ID");
  await navigate("/shipment-users/all/missing");
  await until("document.body.innerText.includes('Retry')", "missing detail");
  pass("Missing detail exposes recovery without a stale record form");
  failList = true;
  await navigate("/shipment-users/all");
  await until("document.body.innerText.includes('Retry')", "list error");
  failList = false;
  await clickText("Retry");
  await until(
    "Boolean(document.querySelector('[data-testid=shipment-user-contact-1]'))",
    "list retry",
  );
  pass("List errors offer a working retry");
  await editor("contact-3");
  await fillField("fullName", "Draft during lookup failure");
  failPlaces = true;
  await fillField("address.countryId", "Retry country");
  await until(
    "document.body.innerText.includes('Unable to load address options')",
    "lookup failure",
  );
  failPlaces = false;
  await clickText("Retry");
  await until(
    "!document.body.innerText.includes('Unable to load address options')",
    "lookup recovery",
  );
  assert.equal(await field("fullName"), "Draft during lookup failure");
  assert.equal(await field("address.zipCode"), "33333");
  pass("Address lookup errors retry without resetting draft fields or ZIP");
  records.splice(17);
  await navigate("/shipment-users/all");
  await until(
    "Boolean(document.querySelector('button[aria-label=\"Go to page 2\"]'))",
    "last page available",
  );
  await click('button[aria-label="Go to page 2"]');
  const lastId = records.at(-1).id;
  await until(
    `Boolean(document.querySelector('[data-testid=shipment-user-${lastId}]'))`,
    "last contact",
  );
  await click(`a[href="/shipment-users/all/${lastId}"]`);
  await until(
    "Boolean(document.querySelector('input[name=fullName]'))",
    "last contact editor",
  );
  await click("[data-testid=remove-shipment-user]");
  await confirmDelete();
  await until(
    "location.pathname==='/shipment-users/all' && Boolean(document.querySelector('[data-testid=shipment-user-contact-1]'))",
    "last page clamp",
  );
  assert.equal(records.length, 16);
  assert.equal(
    calls.filter((x) => x.url === "/v1/shipping-users").at(-1).query.page,
    "0",
  );
  pass(
    "Deleting the open last-page record closes its editor and returns to a valid page",
  );
  await login("viewer@example.test");
  await until("location.pathname==='/home'", "viewer login");
  await editor("contact-1");
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=save-shipment-user]'))",
    ),
    false,
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=remove-shipment-user]'))",
    ),
    false,
  );
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('input[name=phone]')].find(x=>x.getClientRects().length)?.disabled",
    ),
    true,
  );
  await navigate("/shipment-users/all/new");
  await until(
    "document.body.innerText.includes('Unauthorized Access')",
    "viewer create blocked",
  );
  pass(
    "View-only employees cannot create, edit, delete or change phone fields",
  );
  await login("denied@example.test");
  await until("location.pathname==='/home'", "denied login");
  const beforeDenied = calls.filter((x) =>
    x.url.includes("/shipping-users"),
  ).length;
  await navigate("/shipment-users/all/contact-1");
  await until(
    "document.body.innerText.includes('Unauthorized Access')",
    "denied route blocked",
  );
  assert.equal(
    calls.filter((x) => x.url.includes("/shipping-users")).length,
    beforeDenied,
  );
  pass("Denied employees are blocked before feature data loads");
  await login("merchant@example.test");
  await until("location.pathname==='/home'", "merchant login");
  await editor("contact-1");
  assert.ok(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=save-shipment-user]'))",
    ),
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/shipping-users").at(-1).query.userId,
    undefined,
  );
  pass(
    "Merchant access retains server-scoped ownership without client owner overrides",
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
  await editor("contact-1");
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  assert.equal(
    await evaluate(
      "getComputedStyle([...document.querySelectorAll('input[name=phone]')].find(x=>x.getClientRects().length)).direction",
    ),
    "ltr",
  );
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"),
  );
  await screenshot("arabic-mobile-editor");
  await click(".FusePageSimple-backdrop");
  await until(
    "location.pathname==='/shipment-users/all'",
    "mobile backdrop closes route",
  );
  pass(
    "Arabic mobile sidebar is RTL, phones stay LTR, and backdrop closes the route",
  );
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks: passed, exceptions, calls }, null, 2),
  );
  console.log(
    `${passed}/${passed} shipment-user browser checks passed; no uncaught JavaScript exceptions.`,
  );
}
main()
  .catch(async (error) => {
    try {
      await screenshot("failure");
      console.error(
        await evaluate(
          "JSON.stringify([...document.querySelectorAll('input')].map(x=>({name:x.name,value:x.value,visible:!!x.getClientRects().length})))",
        ),
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
