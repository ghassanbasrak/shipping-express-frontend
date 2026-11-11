// Run after npm run build:demo. Requires a Chromium-family browser.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const os = require("node:os");
const { spawn } = require("node:child_process");
const esbuild = require("esbuild");
const WebSocket = globalThis.WebSocket || require("undici").WebSocket;

const root = path.resolve(__dirname, "..");
const build = path.resolve(
  root,
  process.env.DEMO_BUILD_DIR || "build/storage-demo",
);
const browserPath =
  process.env.BROWSER_PATH ||
  (process.platform === "win32"
    ? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
    : "/snap/bin/chromium");
const output = path.join(root, "test-results/storage-browser");
fs.mkdirSync(output, { recursive: true });
const profile = path.join(output, "profile-" + Date.now());
const port = 3146;
const debugPort = 9346;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let browser;
let server;
let socket;
let sequence = 0;
const pending = new Map();
const exceptions = [];
const externalRequests = [];
const apiErrors = [];
let routeChecks = 0;

function send(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 20000);
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
    socket.send(JSON.stringify({ id, method, params }));
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
      result.exceptionDetails.exception?.description ||
        result.exceptionDetails.text,
    );
  return result.result.value;
}
async function until(expression, label) {
  for (let n = 0; n < 100; n++) {
    if (await evaluate(expression)) return;
    await sleep(100);
  }
  throw new Error(
    `Timed out: ${label}\n${await evaluate("document.body.innerText.slice(0, 500)")}`,
  );
}
async function navigate(route) {
  await send("Page.navigate", { url: `http://127.0.0.1:${port}${route}` });
  await until(
    "document.readyState === 'complete' && document.body && document.body.innerText.length > 30",
    route,
  );
  await sleep(450);
  const body = await evaluate("document.body.innerText");
  if (process.env.DEMO_BROWSER_VERBOSE)
    console.log(route, body.replace(/\s+/g, " ").slice(0, 220));
  assert(
    !body.includes("No demo handler for"),
    `Missing demo handler on ${route}`,
  );
  assert(!body.includes("Something went wrong!"), `Page error on ${route}`);
  assert(!body.includes("404 - Page Not Found"), `Missing route ${route}`);
  assert(!body.includes("Page not found"), `Missing route ${route}`);
  assert(
    !body.includes("تعذر تحميل الحساب"),
    `Account lookup failed on ${route}`,
  );
  routeChecks++;
}

let passed = 0;
function pass(name) {
  passed++;
  console.log("PASS " + name);
}
async function go(route) {
  await send("Page.navigate", { url: "http://127.0.0.1:" + port + route });
  await until(
    "document.readyState==='complete' && document.body.innerText.length>20",
    route,
  );
  await sleep(150);
}
async function click(selector) {
  await until(
    "Boolean(document.querySelector(" +
      JSON.stringify(selector) +
      ")) && !document.querySelector(" +
      JSON.stringify(selector) +
      ").disabled",
    "enabled " + selector,
  );
  await evaluate(
    "document.querySelector(" + JSON.stringify(selector) + ").click()",
  );
}
async function fill(name, value) {
  await until(
    "Boolean(document.querySelector(" +
      JSON.stringify(
        'input[name="' + name + '"],textarea[name="' + name + '"]',
      ) +
      "))",
    "field " + name,
  );
  await evaluate(
    `(()=>{const x=document.querySelector(${JSON.stringify('input[name="' + name + '"],textarea[name="' + name + '"]')});Object.getOwnPropertyDescriptor(x.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(x,${JSON.stringify(String(value))});x.dispatchEvent(new Event('input',{bubbles:true}));x.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
}
async function option(name, label) {
  await fill(name, label);
  await evaluate(
    `document.querySelector(${JSON.stringify('input[name="' + name + '"],textarea[name="' + name + '"]')}).dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',code:'ArrowDown',bubbles:true}))`,
  );
  await until(
    `[...document.querySelectorAll('[role=option]')].some(x=>x.textContent.includes(${JSON.stringify(label)}))`,
    "option " + label,
  );
  await evaluate(
    `[...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes(${JSON.stringify(label)})).click()`,
  );
  await sleep(120);
}
async function select(name, value) {
  await until(
    "!document.querySelector('[role=listbox]')",
    "closed previous menu",
  );
  await evaluate(
    `document.querySelector(${JSON.stringify('input[name="' + name + '"]')}).closest('.MuiFormControl-root').querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))`,
  );
  await until(
    `[...document.querySelectorAll('[role=option]')].some(x=>x.dataset.value===${JSON.stringify(value)})`,
    "select option",
  );
  await evaluate(
    `[...document.querySelectorAll('[role=option]')].filter(x=>x.dataset.value===${JSON.stringify(value)}).at(-1).click()`,
  );
  await until(
    `document.querySelector(${JSON.stringify('input[name="' + name + '"]')}).value===${JSON.stringify(value)}`,
    "selected " + name,
  );
  await until("!document.querySelector('[role=listbox]')", "selection closed");
}
async function tick(label) {
  await until(
    `[...document.querySelectorAll('label')].some(x=>x.textContent.includes(${JSON.stringify(label)})&&x.querySelector('input[type=checkbox]'))`,
    "checkbox " + label,
  );
  await evaluate(
    `[...document.querySelectorAll('label')].find(x=>x.textContent.includes(${JSON.stringify(label)})&&x.querySelector('input[type=checkbox]')).querySelector('input').click()`,
  );
}
async function screenshot(name) {
  await sleep(250);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(output, name + ".png"),
    Buffer.from(shot.data, "base64"),
  );
}
const dbExpression = "JSON.parse(localStorage.getItem('ashamco-demo-data-v1'))";
const db = () => evaluate(dbExpression);
async function identity(name) {
  await evaluate(
    'localStorage.setItem("ashamco-demo-identity",' +
      JSON.stringify(name) +
      ")",
  );
}
async function main() {
  // Exercise the real production widget separately from the local demo payment.
  // Provider assets are blocked; initialization is checked with a local stub.
  const widgetSource = `
    import React from "react";import {createRoot} from "react-dom/client";
    import i18n from "i18next";import {initReactI18next} from "react-i18next";
    import MoyasarCheckout from "./src/app/main/storage-app/shared/MoyasarCheckout";
    i18n.use(initReactI18next).init({lng:"en",resources:{en:{storageApp:{LOADING_CHECKOUT:"Loading secure payment",CHECKOUT_LOAD_ERROR:"Payment form failed to load",RETRY:"Retry"}}}});
    const checkout={publishable_api_key:"pk_test_fixture",amount:1545,currency:"SAR",description:"Storage subscription",callback_url:location.origin+"/storage/payment-result?paymentId=fixture",methods:["creditcard"]};
    createRoot(document.getElementById("widget-root")).render(<MoyasarCheckout checkout={checkout} paymentId="fixture" onPaymentCreated={id=>{document.body.dataset.gatewayId=id;}} />);
  `;
  fs.writeFileSync(
    path.join(build, "__storage-widget.js"),
    esbuild.buildSync({
      stdin: { contents: widgetSource, loader: "tsx", resolveDir: root },
      bundle: true,
      format: "iife",
      write: false,
      alias: { src: path.join(root, "src") },
      define: {
        "import.meta.env": JSON.stringify({ VITE_DEMO_MODE: "false" }),
      },
    }).outputFiles[0].text,
  );
  fs.writeFileSync(
    path.join(build, "__storage-widget.html"),
    '<html><body><div id="widget-root"></div><script src="/__storage-widget.js"></script></body></html>',
  );
  assert(
    fs.existsSync(path.join(build, "index.html")),
    "Run npm run build:demo first",
  );
  server = http.createServer((request, response) => {
    let file = path.join(
      build,
      decodeURIComponent(new URL(request.url, "http://localhost").pathname),
    );
    if (!file.startsWith(build)) {
      response.writeHead(403);
      response.end();
      return;
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
    response.setHeader(
      "Content-Type",
      mime[path.extname(file)] || "application/octet-stream",
    );
    response.end(fs.readFileSync(file));
  });
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  browser = spawn(
    browserPath,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-extensions",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: "ignore", windowsHide: true },
  );
  let pages;
  for (let n = 0; n < 80; n++) {
    try {
      pages = await (
        await fetch(`http://127.0.0.1:${debugPort}/json`, {
          signal: AbortSignal.timeout(500),
        })
      ).json();
      break;
    } catch {
      if (browser.exitCode !== null)
        throw new Error(`Browser exited: ${browser.exitCode}`);
      await sleep(150);
    }
  }
  assert(pages, "Browser did not start");
  socket = new WebSocket(
    pages.find((entry) => entry.type === "page").webSocketDebuggerUrl,
  );
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  socket.onmessage = (message) => {
    const event = JSON.parse(message.data);
    if (event.id) {
      const action = pending.get(event.id);
      if (action) {
        pending.delete(event.id);
        event.error
          ? action.reject(new Error(event.error.message))
          : action.resolve(event.result);
      }
    } else if (event.method === "Runtime.consoleAPICalled") {
      const message = event.params.args
        .map((arg) => arg.value || arg.description || "")
        .join(" ");
      if (/No demo handler|status code 501/.test(message))
        apiErrors.push(message);
    } else if (event.method === "Runtime.exceptionThrown")
      exceptions.push(
        event.params.exceptionDetails.exception?.description ||
          event.params.exceptionDetails.text,
      );
    else if (event.method === "Network.requestWillBeSent") {
      const url = event.params.request.url;
      if (
        /^https?:/.test(url) &&
        !url.startsWith(`http://127.0.0.1:${port}`) &&
        (new URL(url).pathname.startsWith("/v1/") ||
          new URL(url).hostname === "api.dev.gayahex.com")
      )
        externalRequests.push(url);
    }
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");

  const language = await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "localStorage.setItem('my-language','en')",
  });
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await go("/storage");
  await until(
    "Boolean(document.querySelector('[data-testid=storage-home]'))",
    "admin storage",
  );
  pass("Administrator storage workspace loads");
  await screenshot("admin-workspace-en");
  await go("/storage/warehouses/new");
  await until(
    "Boolean(document.querySelector('[data-testid=warehouse-form]'))",
    "warehouse editor",
  );
  await fill("name", "Browser Warehouse");
  await fill("address", "Warehouse test street, Riyadh");
  await fill("mapAddress", "https://www.google.com/maps?q=24.71,46.67");
  await fill("information", "Browser warehouse information");
  const seeded = await db(),
    country = seeded.countries.find((x) => x.code === "SA"),
    state = seeded.states.find((x) => x.countryId === country.id),
    city = seeded.cities.find((x) => x.stateId === state.id);
  await fill("pickup.phone", "+966-555123456");
  await option("pickup.countryId", country.name.en);
  await option("pickup.stateId", state.name.en);
  await option("pickup.cityId", city.name.en);
  await fill("pickup.street", "Warehouse pickup street");
  await fill("pickup.nationalAddress", "WH1234");
  await screenshot("warehouse-editor-en");
  await click("[data-testid=save-warehouse]");
  await until("location.pathname==='/storage/warehouses'", "warehouse save");
  let warehouse = (await db()).storage.warehouses.find(
    (x) => x.name === "Browser Warehouse",
  );
  assert(warehouse);
  assert.equal(warehouse.address, "Warehouse test street, Riyadh");
  assert(warehouse.mapAddress.includes("24.71"));
  pass(
    "Warehouse form saves the native name, address, map link and information",
  );
  await go("/storage/warehouses/" + warehouse.id);
  await until(
    "Boolean(document.querySelector('[data-testid=warehouse-form]'))",
    "warehouse reload",
  );
  assert.equal(
    await evaluate("document.querySelector('[name=name]').value"),
    "Browser Warehouse",
  );
  pass("Warehouse details hydrate saved fields");
  await go("/storage/plans/new");
  await until(
    "Boolean(document.querySelector('[data-testid=storage-plan-form]'))",
    "plan editor",
  );
  await fill("name", "Browser Storage Plan");
  await fill("price", 100);
  await fill("discountPrice", 120);
  await fill("durationDays", 30);
  await fill("featuresText", "Dry\nChilled");
  await click("[data-testid=save-storage-plan]");
  await until(
    "document.body.innerText.includes('discounted price cannot exceed')",
    "discount validation",
  );
  assert(
    !(await db()).storage.plans.some((x) => x.name === "Browser Storage Plan"),
  );
  assert.equal(
    await evaluate("document.querySelector('[name=name]').value"),
    "Browser Storage Plan",
  );
  pass("Invalid plan discount is blocked without clearing the draft");
  await fill("discountPrice", 80);
  await click("[data-testid=save-storage-plan]");
  await until("location.pathname==='/storage/plans'", "plan save");
  const plan = (await db()).storage.plans.find(
    (x) => x.name === "Browser Storage Plan",
  );
  assert(plan);
  await screenshot("admin-plans-en");
  pass(
    "Administrator creates a priced plan with duration, features and storage types",
  );
  await identity("merchant");
  await go("/storage/products");
  await until(
    "document.body.innerText.includes('active storage subscription is required')",
    "subscription gate",
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=storage-list-products]'))",
    ),
    false,
  );
  pass("Product routes remain unavailable before subscription");
  await go("/storage/warehouses");
  await until("location.pathname==='/error/401'", "merchant admin restriction");
  pass("Merchants cannot open warehouse administration");
  await go("/storage");
  await until(
    `Boolean(document.querySelector(${JSON.stringify('[data-testid="subscribe-' + plan.id + '"]')}))`,
    "subscription plans",
  );
  await screenshot("merchant-plans-en");
  const balance = (await db()).users.find(
    (x) => x.id === "demo-merchant",
  ).balance;
  await click("[data-testid=subscribe-" + plan.id + "]");
  await click("[data-testid=confirm-storage-subscription]");
  await until(
    "Boolean(document.querySelector('[data-testid=demo-storage-pay]'))",
    "card checkout",
  );
  assert.equal((await db()).storage.subscriptions.length, 0);
  assert.equal(
    (await db()).users.find((x) => x.id === "demo-merchant").balance,
    balance,
  );
  pass(
    "Checkout displays the server total and leaves subscription inactive until verified payment",
  );
  await screenshot("storage-checkout-en");
  await click("[data-testid=demo-storage-pay]");
  await until(
    "Boolean(document.querySelector('[data-testid=storage-payment-result]'))&&document.body.innerText.includes('activated')",
    "verified storage payment",
  );
  await go("/storage");
  await until(
    "Boolean(document.querySelector('[data-testid=active-storage-subscription]'))",
    "active subscription",
  );
  assert.equal(
    (await db()).users.find((x) => x.id === "demo-merchant").balance,
    balance,
  );
  pass(
    "Verified card-payment simulation activates storage without debiting the wallet",
  );
  await go("/storage/supply-requests/new");
  await until(
    "Boolean(document.querySelector('[data-testid=supply-request-form]'))",
    "supply form",
  );
  await option("warehouseId", "Browser Warehouse");
  await fill("products.0.sku", "WEB-A");
  await fill("products.0.name", "Browser Product A");
  await fill("products.0.quantity", 7);
  await fill("products.0.unitPrice", 9);
  await fill("products.0.notes", "Keep dry");
  await select("products.0.storageType", "Dry");
  await click("[data-testid=add-supply-item]");
  await fill("products.1.sku", "WEB-B");
  await fill("products.1.name", "Browser Product B");
  await fill("products.1.quantity", 3);
  await fill("products.1.unitPrice", 4);
  await select("products.1.storageType", "Dry");
  await evaluate(
    "document.querySelector('[data-testid=supply-request-form]').scrollIntoView({block:'start'})",
  );
  await screenshot("supply-create-en");
  await click("[data-testid=submit-supply-request]");
  await until(
    "location.pathname==='/storage/supply-requests'",
    "supply submitted",
  );
  let request = (await db()).storage.supplies.find((x) =>
    x.products.some((v) => v.sku === "WEB-A"),
  );
  assert(request);
  assert.equal(request.status, "pending");
  assert.equal((await db()).storage.products.length, 0);
  pass(
    "Merchant submits multiple products with SKU, quantity, price, notes and a subscribed type",
  );
  await identity("admin");
  await go("/storage/supply-requests/" + request.id);
  await until(
    "Boolean(document.querySelector('[data-testid=supply-status-approved]'))",
    "admin review",
  );
  assert(
    await evaluate(
      "[...document.querySelectorAll('a')].some(a=>a.href.startsWith('https://wa.me/'))",
    ),
  );
  await screenshot("supply-review-en");
  await click("[data-testid=supply-status-approved]");
  await click("[data-testid=confirm-supply-review]");
  await until(
    "Boolean(document.querySelector('[data-testid=supply-status-received]'))",
    "approved",
  );
  assert.equal((await db()).storage.products.length, 0);
  pass(
    "Administrator can contact the merchant and approve without prematurely adding stock",
  );
  await click("[data-testid=supply-status-received]");
  await click("[data-testid=confirm-supply-review]");
  await until(
    "document.body.innerText.includes('Receipt confirmed')",
    "warehouse received",
  );
  assert.equal(
    (await db()).storage.products.find((x) => x.sku === "WEB-A").quantity,
    7,
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=supply-status-received]'))",
    ),
    false,
  );
  pass(
    "Physical receipt adds stock once and locks completed request decisions",
  );
  await go("/storage/supply-requests");
  await until(
    "Boolean(document.querySelector('[data-testid=storage-list-supplies]'))",
    "admin supplies",
  );
  await screenshot("admin-supplies-en");
  pass("Administrative supply list shows receipt status and merchant identity");
  await identity("merchant");
  await go("/storage/products");
  await until(
    "document.body.innerText.includes('Browser Product A')",
    "merchant inventory",
  );
  await screenshot("merchant-inventory-en");
  pass("Subscribed merchant sees owned warehouse quantities");
  await go("/shipments/all/all/new");
  await until(
    "Boolean(document.querySelector('[data-testid=fulfillment-warehouse]'))",
    "warehouse fulfillment option",
  );
  await fill("senderName", "External Sender Draft");
  await click("[data-testid=fulfillment-warehouse]");
  await option("shipmentWarehouseId", "Browser Warehouse");
  await click("[data-testid=add-warehouse-product]");
  await option("warehouseItems.0.productId", "Browser Product A");
  await fill("warehouseItems.0.quantity", 2);
  await until(
    "document.querySelector('[data-testid=warehouse-sender-summary]')?.innerText.includes('Browser Warehouse')",
    "automatic warehouse sender",
  );
  assert.equal(
    await evaluate("Boolean(document.querySelector('[name=senderName]'))"),
    false,
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[name=isCommercial], [name=acceptExtraWeightTerms], [data-testid=add-shipment-product]'))",
    ),
    false,
  );
  assert.equal(
    await evaluate(
      "!!(document.querySelector('[data-testid=warehouse-fulfillment]').compareDocumentPosition(document.querySelector('#shipment-section-route')) & Node.DOCUMENT_POSITION_FOLLOWING)",
    ),
    true,
  );
  pass(
    "Fulfillment is selected first; the warehouse sender is automatic and removed shipment options stay absent",
  );
  await click("[data-testid=fulfillment-external]");
  await until(
    "document.querySelector('[name=senderName]')?.value==='External Sender Draft'",
    "external sender draft restored",
  );
  await click("[data-testid=fulfillment-warehouse]");
  await until(
    "document.querySelector('[data-testid=warehouse-sender-summary]')?.innerText.includes('Browser Warehouse')",
    "warehouse sender restored",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[name=\"warehouseItems.0.quantity\"]')?.value",
    ),
    "2",
  );
  pass(
    "Switching shipment sources restores the external sender draft and preserves warehouse product quantities",
  );
  await fill("receivers.0.receiverName", "Warehouse Receiver");
  await fill("receivers.0.receiverPhone", "+966555123456");
  await fill("receivers.0.receiverNationalAddress", "R123");
  await option("receivers.0.receiverCountryId", country.name.en);
  await option("receivers.0.receiverStateId", state.name.en);
  await option("receivers.0.receiverCityId", city.name.en);
  await fill("receivers.0.receiverStreet", "Receiver street");
  await fill("description", "Warehouse test shipment");
  await evaluate(
    "document.querySelector('[data-testid=warehouse-fulfillment]').scrollIntoView({block:'start'})",
  );
  await screenshot("warehouse-shipment-en");
  const contactsBefore = (await db()).shippingUsers.filter(
    (x) => x.type === "sender",
  ).length;
  await click("[data-testid=submit-shipment-details]");
  await until(
    "Boolean(document.querySelector('[data-testid=shipment-carrier-step]'))",
    "warehouse carrier step",
  );
  const carrier = (await db()).shippingCompanies.find(
    (x) =>
      x.isActive &&
      x.shippingMethods.includes("local") &&
      !x.isAuthorizationRequired,
  );
  await click("[data-testid=carrier-" + carrier.id + "]");
  await until(
    "Boolean(document.querySelector('[data-testid=create-shipments]'))&&!document.querySelector('[data-testid=create-shipments]').disabled",
    "warehouse price review",
  );
  await screenshot("warehouse-shipment-review-en");
  assert.equal(
    (await db()).storage.products.find((x) => x.sku === "WEB-A").quantity,
    7,
  );
  await click("[data-testid=create-shipments]");
  await until(
    "Boolean(document.querySelector('[data-testid=shipments-table]'))",
    "warehouse shipment created",
  );
  const created = (await db()).shipments.find(
    (x) => x.description === "Warehouse test shipment",
  );
  assert(created);
  assert.equal(created.senderName, "Browser Warehouse");
  assert.equal(created.warehouseId, warehouse.id);
  assert(!created.senderId);
  assert.equal(
    created.shipmentProducts[0].warehouseProductId,
    (await db()).storage.products.find((x) => x.sku === "WEB-A").id,
  );
  assert.equal(created.shipmentProducts[0].quantity, 2);
  assert.equal(
    (await db()).storage.products.find((x) => x.sku === "WEB-A").quantity,
    5,
  );
  assert.equal(
    (await db()).shippingUsers.filter((x) => x.type === "sender").length,
    contactsBefore,
  );
  pass(
    "Warehouse shipment reviews its carrier price, uses the automatic warehouse sender without creating a sender contact and submits native product IDs and quantities",
  );
  await send("Page.removeScriptToEvaluateOnNewDocument", {
    identifier: language.identifier,
  });
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "localStorage.setItem('my-language','ar')",
  });
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await go("/storage");
  await until(
    "Boolean(document.querySelector('[data-testid=storage-home]'))",
    "Arabic subscription",
  );
  assert.equal(await evaluate("document.documentElement.dir"), "rtl");
  await screenshot("storage-ar-mobile");
  await go("/storage/products");
  await until(
    "Boolean(document.querySelector('[data-testid=storage-list-products]'))",
    "Arabic inventory",
  );
  await screenshot("inventory-ar-mobile");
  assert.equal(
    await evaluate("document.documentElement.scrollWidth>innerWidth"),
    false,
  );
  pass("Arabic mobile subscription and inventory layouts fit the viewport");
  await go("/storage/supply-requests/new");
  await until(
    "Boolean(document.querySelector('[data-testid=supply-request-form]'))",
    "Arabic supply",
  );
  await screenshot("supply-create-ar-mobile");
  await evaluate(
    "(()=>{const value=" +
      dbExpression +
      ";value.storage.subscriptions.find(x=>x.userId==='demo-merchant').endsAt=new Date(Date.now()-1000).toISOString();localStorage.setItem('ashamco-demo-data-v1',JSON.stringify(value));})()",
  );
  await go("/storage/products");
  await until(
    "!document.querySelector('[data-testid=storage-list-products]')&&document.body.innerText.length>50",
    "expired gate",
  );
  pass("Expired subscriptions cannot reopen the product list");
  await send("Network.setBlockedURLs", {
    urls: ["*cdn.jsdelivr.net/npm/moyasar-payment-form*"],
  });
  await go("/__storage-widget.html");
  await until(
    "document.body.innerText.includes('Payment form failed to load')",
    "provider load failure",
  );
  await evaluate(
    "window.Moyasar={init:config=>{window.__storageCheckoutConfig={amount:config.amount,currency:config.currency,publishable_api_key:config.publishable_api_key,callback_url:config.callback_url,methods:config.methods};config.element.innerHTML='<button id=fixture-card>Provider card form</button>';config.element.querySelector('button').onclick=()=>config.on_completed({id:'11111111-1111-4111-8111-111111111111'});}}",
  );
  await evaluate(
    "[...document.querySelectorAll('button')].find(button=>button.textContent==='Retry').click()",
  );
  await until(
    "Boolean(document.querySelector('#fixture-card'))",
    "provider retry",
  );
  pass(
    "Production payment widget retains the checkout and recovers after provider-script loading fails",
  );
  const config = await evaluate("window.__storageCheckoutConfig");
  assert.equal(config.amount, 1545);
  assert.equal(config.currency, "SAR");
  assert.equal(config.publishable_api_key, "pk_test_fixture");
  assert.deepEqual(config.methods, ["creditcard"]);
  assert(config.callback_url.includes("paymentId=fixture"));
  await click("#fixture-card");
  assert.equal(
    await evaluate("document.body.dataset.gatewayId"),
    "11111111-1111-4111-8111-111111111111",
  );
  pass(
    "Production widget forwards server checkout configuration and captures the gateway payment ID",
  );
  assert.deepEqual(exceptions, [], "Uncaught browser exceptions");
  assert.deepEqual(externalRequests, [], "Backend network requests");
  assert.deepEqual(apiErrors, [], "Unimplemented demo routes");
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify(
      {
        checks: passed,
        exceptions,
        externalRequests,
        apiErrors,
        warehouseId: warehouse.id,
        planId: plan.id,
        requestId: request.id,
        shipmentId: created.id,
      },
      null,
      2,
    ),
  );
  console.log(passed + "/" + passed + " storage browser checks passed.");
}
main()
  .catch(async (error) => {
    try {
      await screenshot("failure");
      fs.writeFileSync(
        path.join(output, "failure.txt"),
        await evaluate("document.body.innerText"),
      );
      fs.writeFileSync(
        path.join(output, "failure-db.json"),
        JSON.stringify(await db(), null, 2),
      );
    } catch {}
    console.error(error);
    console.error(exceptions);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      if (socket?.readyState === WebSocket.OPEN) await send("Browser.close");
    } catch {}
    socket?.close();
    browser?.kill();
    server?.close();
  });
