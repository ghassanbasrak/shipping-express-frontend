// Run after npm run build:demo. Requires a Chromium-family browser.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const os = require("node:os");
const { spawn } = require("node:child_process");
const WebSocket = globalThis.WebSocket || require("undici").WebSocket;

const root = path.resolve(__dirname, "..");
const build = path.resolve(root, process.env.DEMO_BUILD_DIR || "build");
const browserPath =
  process.env.BROWSER_PATH ||
  (process.platform === "win32"
    ? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
    : "/snap/bin/chromium");
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "ashamco-demo-browser-"));
const port = 3139;
const debugPort = 9339;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const routes = [
  "/home",
  "/dashboard",
  "/merchants",
  "/merchants/demo-merchant/view",
  "/affiliate-merchants",
  "/affiliate-merchants/demo-affiliate/customers",
  "/affiliate-merchants/demo-affiliate/transactions",
  "/topup-requests/all",
  "/topup-requests/all/demo-payment-1-1",
  "/withdraw-requests/all",
  "/withdraw-requests/all/demo-withdraw-request-1",
  "/merchant-dues/all/all",
  "/cancel-shipment-requests/all",
  "/logs",
  "/logs/demo-log-demo-shipment-1-1",
  "/shipments/all/all",
  "/shipments/all/all/demo-shipment-1-1",
  "/shipments/all/international/demo-shipment-1-3",
  "/shipping-price-calculator",
  "/countries/all",
  "/shipping-companies",
  "/states/all/all",
  "/cities/all/all",
  "/plans",
  "/admins",
  "/coupons/all/all",
  "/alerts",
  "/shipment-users/all",
  "/applications",
  "/bank-transfers/all",
  "/affiliate-withdraw-requests/all",
  "/merchant-statistics",
  "/transactions/all/wallet",
  "/transactions/all/cod",
  "/transaction-reports/all",
  "/plans/demo-plan-1",
  "/states/all/all/demo-state-EG-0-0",
  "/cities/all/all/demo-city-demo-state-EG-0-0",
  "/applications/demo-application-1",
  "/transactions/all/wallet/demo-transaction-2",
];
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
async function retiredVerificationRoutes() {
  assert.equal(
    await evaluate(
      "document.querySelectorAll('a[href^=\"/verification-requests\"]').length",
    ),
    0,
    "Workspace has no retired verification links",
  );
  for (const route of [
    "/verification-requests/all",
    "/verification-requests/demo-merchant",
    "/verification-requests/all?updatedById=demo-admin",
  ]) {
    await send("Page.navigate", { url: `http://127.0.0.1:${port}${route}` });
    await until(
      "location.pathname === '/error/404' && document.readyState === 'complete'",
      `Retired verification URL ${route}`,
    );
    assert.equal(
      await evaluate(
        "document.querySelectorAll('a[href^=\"/verification-requests\"]').length",
      ),
      0,
      "No retired verification navigation links",
    );
    routeChecks++;
  }
}
async function main() {
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
    { stdio: "ignore" },
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
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "localStorage.setItem('my-language','en');",
  });
  await navigate("/home");
  await retiredVerificationRoutes();
  for (const route of routes.slice(1)) await navigate(route);
  await evaluate("localStorage.setItem('ashamco-demo-identity','merchant')");
  await navigate("/home");
  assert(
    (await evaluate("document.body.innerText")).includes("Merchant"),
    "Merchant identity missing",
  );
  await retiredVerificationRoutes();
  for (const route of [
    "/profile",
    "/edit-profile",
    "/verify-account",
    "/shipments/all/all",
    "/shipments/all/all/new",
    "/shipping-price-calculator",
    "/topup-requests/all",
    "/withdraw-requests/all",
    "/withdraw-requests/all/new",
    "/merchant-dues/all/all",
    "/cancel-shipment-requests/all",
    "/shipment-users/all",
    "/transactions/all/wallet",
    "/transaction-reports/all",
  ])
    await navigate(route);
  await navigate("/topup-requests/all/new");
  const balanceBefore = await evaluate(
    "JSON.parse(localStorage.getItem('ashamco-demo-data-v1')).users.find(u => u.id === 'demo-merchant').balance",
  );
  await evaluate(`(() => {
    const input = document.querySelector('input[name="amount"]');
    if (!input) throw new Error('Top-up amount field missing');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '115');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await until(
    "document.querySelector('[data-testid=create-topup]') && !document.querySelector('[data-testid=create-topup]').disabled",
    "Top-up form ready",
  );
  await evaluate(
    "document.querySelector('[data-testid=create-topup]').click()",
  );
  await until(
    "document.querySelector('[data-testid=payment-callback]')?.dataset.status === 'success'",
    "Local checkout callback success",
  );
  const readBalance =
    "JSON.parse(localStorage.getItem('ashamco-demo-data-v1')).users.find(u => u.id === 'demo-merchant').balance";
  assert.equal(
    await evaluate(readBalance),
    balanceBefore + 100,
    "Local checkout wallet credit",
  );
  await send("Page.reload");
  await until(
    "document.querySelector('[data-testid=payment-callback]')?.dataset.status === 'success'",
    "Callback replay success",
  );
  assert.equal(
    await evaluate(readBalance),
    balanceBefore + 100,
    "Callback replay cannot double-credit",
  );
  await evaluate("localStorage.setItem('ashamco-demo-identity','affiliate')");
  await navigate("/home");
  assert(
    (await evaluate("document.body.innerText")).includes("Affiliate"),
    "Affiliate identity missing",
  );
  await navigate("/affiliate-withdraw-requests/all");
  for (const route of [
    "/affiliate-profile",
    "/affiliate-profile/customers",
    "/affiliate-profile/transactions",
    "/affiliate-profile/withdraw-requests",
    "/shipments/all/all",
    "/topup-requests/all",
  ])
    await navigate(route);
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: "localStorage.setItem('my-language','ar');",
  });
  await navigate("/affiliate-profile/customers");
  await navigate("/home");
  assert.equal(
    await evaluate("document.documentElement.dir"),
    "rtl",
    "Arabic demo direction",
  );
  assert.deepEqual(exceptions, [], "Browser exceptions");
  assert.deepEqual(externalRequests, [], "Demo made backend requests");
  assert.deepEqual(apiErrors, [], "Missing demo handlers");
  console.log(
    `Demo browser smoke passed: ${routeChecks} route checks, 3 identities, Arabic mobile, real local checkout and replay, no backend requests`,
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const exited =
      browser &&
      new Promise((resolve) =>
        browser.exitCode !== null ? resolve() : browser.once("exit", resolve),
      );
    if (socket?.readyState === WebSocket.OPEN)
      await send("Browser.close").catch(() => {});
    if (exited) await Promise.race([exited, sleep(3000)]);
    if (socket) socket.close();
    if (browser && browser.exitCode === null) browser.kill();
    if (server) await new Promise((resolve) => server.close(resolve));
    if (
      profile.startsWith(os.tmpdir()) &&
      path.basename(profile).startsWith("ashamco-demo-browser-")
    )
      try {
        fs.rmSync(profile, {
          recursive: true,
          force: true,
          maxRetries: 10,
          retryDelay: 200,
        });
      } catch (error) {
        // Windows can briefly retain an Edge cache lock after the browser has exited.
        console.warn(`Temporary browser profile cleanup: ${error.code}`);
      }
  });
