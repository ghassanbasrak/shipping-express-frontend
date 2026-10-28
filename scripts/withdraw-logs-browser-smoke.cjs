// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/withdraw-logs-browser");
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
  failBalance = false,
  failShipments = false,
  failLog = false,
  failRefresh = false,
  failUpload = false,
  holdUpload = false,
  releaseUpload;
const users = [
  { ...normal, id: "merchant-1", firstName: "Account", lastName: "One" },
  { ...normal, id: "merchant-2", firstName: "Account", lastName: "Two" },
];
const records = Array.from({ length: 15 }, (_, i) => ({
  id: "withdraw-" + (i + 1),
  type: i % 2 ? "walletCharge" : "withdrew",
  status: i === 2 ? "approved" : "pending",
  amount: 115,
  userId: i % 2 ? "merchant-2" : "merchant-1",
  user: users[i % 2],
  updatedById: "staff-1",
  updatedBy: { id: "staff-1", firstName: "Staff", lastName: "Reviewer" },
  description: i === 14 ? "IBAN & # special" : "IBAN account " + (i + 1),
  transactionReference: i === 2 ? "existing-ref" : "",
  transactionDescription: "Receipt " + String(i + 1).padStart(2, "0"),
  bank: i === 2 ? "box" : undefined,
  transactionImageUrl:
    i === 2 ? "https://receipts.example.test/transfer.svg" : undefined,
  createdAt: "2026-10-01T12:00:00Z",
  updatedAt: "2026-10-23T12:00:00Z",
}));
const balances = { "merchant-1": 500, "merchant-2": 200 };
let eligible = [
  {
    id: "shipment-1",
    isCod: true,
    shippingCompanyId: "carrier-1",
    method: "local",
    trackingNumber: "COD-ONE",
    status: "delivered",
    shipmentDetails: {
      id: "details-1",
      senderName: "Historical sender",
      receiverName: "Actual receiver",
    },
    shipmentCod: { id: "cod-1", codStatus: "paid", codPrice: 115 },
  },
  {
    id: "shipment-2",
    isCod: true,
    trackingNumber: "COD-TWO",
    shipmentCod: { id: "cod-2", codStatus: "paid", codPrice: 23 },
  },
];
const logs = Array.from({ length: 13 }, (_, i) => ({
  id: "log-" + (i + 1),
  message: i === 12 ? "Log & # special" : "Stored event " + (i + 1),
  modelName: "shipment",
  context: "booking-service",
  meta: {
    userId: "merchant-1",
    user: users[0],
    data: {
      id: "historical-record",
      ...(i === 0
        ? {
            shipmentId: "shipment-1",
            shippingCompanyId: "carrier-1",
            method: "local",
          }
        : {}),
      trackingNumber: "HISTORIC-" + (i + 1),
      reference: "LEDGER-" + (i + 1),
      senderName: "Stored sender",
      receiverName: "Stored receiver",
      receiverEmail: "stored@example.test",
      weight: 2,
      packagesCount: 1,
      description: "<script>stored text</script>",
    },
    response: { preserve: { raw: true } },
  },
  createdAt: "2026-10-23T12:00:00Z",
}));
logs[12]._id = logs[12].id;
delete logs[12].id;
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
  if (url.hostname === "receipts.example.test")
    return fulfill(
      event,
      200,
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="white"/><text x="20" y="60">Payment receipt</text></svg>',
      "image/svg+xml",
    );
  if (url.hostname === "uploads.example.test") {
    assert.equal(req.headers.Authorization, undefined);
    if (holdUpload) await new Promise((resolve) => (releaseUpload = resolve));
    return fulfill(event, failUpload ? 500 : 204, "");
  }
  if (!url.pathname.includes("/v1/"))
    return send("Fetch.continueRequest", { requestId: event.requestId });
  const query = Object.fromEntries(url.searchParams),
    body = JSON.parse(req.postData || "{}");
  calls.push({
    url: url.pathname,
    method,
    query,
    types: url.searchParams.getAll("type"),
    body,
  });
  let result = {},
    status = 200;
  if (url.pathname.endsWith("/auth-sessions/login")) {
    const merchant = body.email.startsWith("merchant"),
      viewer = body.email.startsWith("viewer"),
      limited = body.email.startsWith("limited"),
      denied = body.email.startsWith("denied");
    account = {
      ...normal,
      id: merchant ? "merchant-1" : "staff-1",
      role: merchant ? "user" : viewer || denied ? "employee" : "admin",
      isAffiliate: false,
    };
    if (viewer)
      account.features = [
        { feature: "withdraw-requests", accessView: true, accessUpdate: false },
      ];
    if (limited)
      account.features = [{ feature: "withdraw-requests", accessView: true }];
    if (denied)
      account.features = [
        { feature: "withdraw-requests", accessView: false, accessUpdate: true },
      ];
    result = {
      user: account,
      accessToken: "withdraw-access",
      refreshToken: "withdraw-refresh",
    };
  } else if (url.pathname === "/v1/users/me") {
    if (failRefresh) {
      status = 500;
      result = { message: "refresh failed" };
    } else result = account || normal;
  } else if (url.pathname.startsWith("/v1/requests/available-for-withdrew/")) {
    if (failBalance) {
      status = 500;
      result = { message: "balance failed" };
    } else result = { amount: balances[url.pathname.split("/").at(-1)] || 0 };
  } else if (url.pathname === "/v1/shipments") {
    if (failShipments) {
      status = 500;
      result = { message: "shipments failed" };
    } else result = { results: eligible, total: eligible.length };
  } else if (url.pathname === "/v1/shipments/shipment-1")
    result = { ...eligible[0], userId: "merchant-1" };
  else if (url.pathname === "/v1/media/create")
    result = {
      url: "https://uploads.example.test/",
      fields: { key: "receipt.png" },
    };
  else if (url.pathname === "/v1/users") {
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
    result = {
      results: source.filter(
        (x) =>
          !query.search ||
          JSON.stringify(x).toLowerCase().includes(query.search.toLowerCase()),
      ),
      total: source.length,
    };
  } else if (url.pathname.startsWith("/v1/users/"))
    result = users.find((x) => x.id === url.pathname.split("/").at(-1)) || {
      id: "staff-1",
      firstName: "Staff",
      lastName: "Reviewer",
    };
  else if (url.pathname === "/v1/requests") {
    if (method === "POST") {
      assert.equal(body.userId, account.id);
      assert(["withdrew", "walletCharge"].includes(body.type));
      assert.equal(body.status, "pending");
      if (failCreate) {
        status = 500;
        result = { message: "create failed" };
      } else {
        result = {
          ...body,
          id: "created-" + (records.length + 1),
          user: users[0],
          createdAt: "2026-10-25T12:00:00Z",
        };
        records.push(result);
      }
    } else {
      assert.deepEqual(url.searchParams.getAll("type"), [
        "withdrew",
        "walletCharge",
      ]);
      if (failList) {
        status = 500;
        result = { message: "list failed" };
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
    const row = records.find((x) => x.id === url.pathname.split("/").at(-1));
    if (!row) {
      status = 404;
      result = { message: "missing" };
    } else if (method === "GET") result = row;
    else {
      assert.equal(method, "PATCH");
      assert.equal(row.status, "pending");
      if (failWrite) {
        status = 500;
        result = { message: "write failed" };
      } else {
        Object.assign(row, body);
        result = row;
      }
    }
  } else if (url.pathname === "/v1/logs") {
    if (failLog) {
      status = 500;
      result = { message: "logs failed" };
    } else {
      const list = logs.filter(
        (x) =>
          (!query.search ||
            JSON.stringify(x)
              .toLowerCase()
              .includes(query.search.toLowerCase())) &&
          (!query.type || x.modelName === query.type) &&
          (!query.userId || x.meta.userId === query.userId),
      );
      result = {
        results: list.slice(
          Number(query.page) * Number(query.pageSize),
          (Number(query.page) + 1) * Number(query.pageSize),
        ),
        total: list.length,
      };
    }
  } else if (url.pathname.startsWith("/v1/logs/")) {
    result = logs.find(
      (x) => (x.id || x._id) === url.pathname.split("/").at(-1),
    );
    if (!result || failLog) {
      status = 404;
      result = { message: "missing" };
    }
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
    assert.ok(rows.every((row) => row.Status === "Confirmed"));
  const list = calls.filter(
    (x) => x.url === "/v1/requests" && x.query.pageSize === "500000",
  );
  assert.equal(list.length, before + 1);
  assert.deepEqual(list.at(-1).types, ["withdrew", "walletCharge"]);
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
  await navigate("/withdraw-requests/" + scope);
  await until(
    exists("[data-testid=withdraw-requests-table]"),
    "bank transfer list",
  );
  await until(
    "Boolean(document.querySelector('[role=row][data-id]')) || document.body.innerText.includes('There are no withdraw requests')",
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
  await navigate("/withdraw-requests/" + owner + "/" + id);
  await until(exists("input[name=amount]"), "withdrawal detail");
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
async function selectShipment(id) {
  await until(
    "Boolean(document.querySelector('#shipmentIds')) || Boolean(document.querySelector('input[name=shipmentIds]'))",
    "shipment selector",
  );
  await evaluate(
    "document.querySelector('input[name=shipmentIds]').previousElementSibling.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))",
  );
  await until(exists(`[role=option][data-value=${id}]`), "shipment option");
  await click(`[role=option][data-value=${id}]`);
  await escape();
  await until(
    "Number(document.querySelector('input[name=amount]').value)>0",
    "computed amount",
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

  await reset("/withdraw-requests/all");
  await until("location.pathname==='/sign-in'", "guest");
  pass("Guests must sign in");
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin");
  await list();
  assert.equal(
    await evaluate("document.querySelectorAll('[role=row][data-id]').length"),
    10,
  );
  await screenshot("withdrawals-en-desktop");
  pass("Withdrawal list shows both types with ten-row server pagination");
  await click('button[aria-label="Go to next page"]');
  await until(exists("[role=row][data-id=withdraw-11]"), "page two");
  await fillSelector(
    "[data-testid=withdraw-requests-search]",
    "IBAN & # special",
  );
  await until(exists("[role=row][data-id=withdraw-15]"), "encoded search");
  assert.equal(
    calls.filter((x) => x.url === "/v1/requests" && x.method === "GET").at(-1)
      .query.page,
    "0",
  );
  pass(
    "Encoded search resets pagination and preserves both repeated type parameters",
  );
  await clickText("Reset filters");
  await until(exists("[role=row][data-id=withdraw-1]"), "reset");
  await navigate("/withdraw-requests/merchant-1?updatedById=staff-1");
  await until(exists("[role=row][data-id=withdraw-1]"), "audit scope");
  await setStatusFilter("withdraw-requests", "approved");
  await until(exists("[role=row][data-id=withdraw-3]"), "approved filter");
  await exportAll(null, {
    userId: "merchant-1",
    updatedById: "staff-1",
    status: "approved",
  });
  pass(
    "Scoped staff audit, status filter and real Excel export preserve matching query scopes",
  );
  await navigate("/withdraw-requests/all");
  await until(exists("[role=row][data-id=withdraw-1]"), "unscoped");
  const before = patches().length;
  await rowAction("withdraw-1", "Accept");
  await closeDialog();
  assert.equal(patches().length, before);
  pass("Cancelling approval makes no write");
  await rowAction("withdraw-1", "Accept");
  await click("[data-testid=withdraw-request-decision-submit]");
  await until(
    "document.querySelector('[role=dialog]')?.innerText.includes('Required field')",
    "required bank",
  );
  assert.equal(patches().length, before);
  await bank("box");
  await fillField("transactionReference", "bank-ref");
  await fillField("transactionDescription", "receipt note");
  holdUpload = true;
  await upload();
  for (let i = 0; i < 100 && !releaseUpload; i++) await sleep(50);
  assert(releaseUpload);
  assert(
    await evaluate(
      "document.querySelector('[data-testid=withdraw-request-decision-submit]').disabled",
    ),
  );
  holdUpload = false;
  releaseUpload();
  await until(
    "document.querySelector('input[name=transactionImageUrl]')?.value==='https://uploads.example.test/receipt.png'",
    "uploaded",
  );
  pass(
    "Bank approval validates required fields and blocks submission during receipt upload",
  );
  failWrite = true;
  await click("[data-testid=withdraw-request-decision-submit]");
  await untilCall(() => patches().length === before + 1, "failed write");
  await until(
    "!document.querySelector('[data-testid=withdraw-request-decision-submit]').disabled",
    "retry enabled",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('input[name=transactionReference]').value",
    ),
    "bank-ref",
  );
  failWrite = false;
  await click("[data-testid=withdraw-request-decision-submit]");
  await until("!document.querySelector('[role=dialog]')", "approved");
  assert.deepEqual(patches().at(-1).body, {
    status: "approved",
    bank: "box",
    transactionReference: "bank-ref",
    transactionDescription: "receipt note",
    transactionImageUrl: "https://uploads.example.test/receipt.png",
  });
  pass(
    "Failed bank approval retains fields and retries the actual row with a limited payload",
  );
  await rowAction("withdraw-2", "Accept");
  assert(
    (
      await evaluate("document.querySelector('[role=dialog]').innerText")
    ).includes("confirmed status?"),
  );
  assert.equal(
    await evaluate(
      "document.querySelectorAll('[role=dialog] input[name=transactionReference]').length",
    ),
    0,
  );
  await click("[data-testid=withdraw-request-decision-submit]");
  await until("!document.querySelector('[role=dialog]')", "wallet approved");
  assert.deepEqual(patches().at(-1).body, { status: "approved" });
  pass("Wallet approval hides bank fields and sends status only");
  await rowAction("withdraw-4", "Refuse");
  await click("[data-testid=withdraw-request-decision-submit]");
  await until("!document.querySelector('[role=dialog]')", "refused");
  assert.deepEqual(patches().at(-1).body, { status: "rejected" });
  pass("Refusal sends status only");

  failList = true;
  await navigate("/withdraw-requests/all");
  await until(
    "document.body.innerText.includes('Could not load records')",
    "withdrawal read failure",
  );
  failList = false;
  await clickText("Retry");
  await until(
    exists("[role=row][data-id=withdraw-1]"),
    "withdrawal read retry",
  );
  pass("Failed withdrawal reads expose a working retry");
  await rowAction("withdraw-3", "Transaction Image");
  await until(exists("[data-testid=withdraw-request-image]"), "receipt");
  await clickText("Download", "[role=dialog] button");
  await untilCall(
    () => fs.readdirSync(output).some((x) => x === "withdraw-3.jpg"),
    "receipt download",
  );
  await closeDialog();
  pass("Receipt preview downloads a local file");
  await login("viewer@example.test");
  await until("location.pathname==='/home'", "viewer");
  await list();
  assert(
    !(await evaluate(
      "document.querySelector('[data-testid=withdraw-requests-table]').innerText.includes('Accept')",
    )),
  );
  await navigate("/withdraw-requests/all/new");
  await until(
    "location.pathname==='/home' || location.pathname.includes('403')",
    "staff detail denied",
  );
  pass("View-only employees cannot review or open merchant creation forms");
  await login("denied@example.test");
  await until("location.pathname==='/home'", "denied");
  const deniedStart = calls.length;
  await navigate("/withdraw-requests/all");
  await until(
    "location.pathname.includes('403') || location.pathname==='/home'",
    "no view",
  );
  assert(!calls.slice(deniedStart).some((x) => x.url === "/v1/requests"));
  pass("Update-only permission cannot bypass withdrawal view access");
  await login("merchant@example.test");
  await until("location.pathname==='/home'", "merchant");
  await detail("new", "foreign-owner");

  // Check initial eligibility read failure independently from balance and form drafts.
  failShipments = true;
  await navigate("/withdraw-requests/all/new");
  await until(
    "document.body.innerText.includes('Could not load eligible shipments')",
    "eligibility failure",
  );
  failShipments = false;
  await clickText("Retry");
  await until(
    "!document.querySelector('input[name=shipmentIds]').disabled",
    "eligibility retry",
  );
  pass("Failed eligibility lookup can be retried without leaving the form");
  await selectShipment("shipment-1");
  assert.equal(
    await evaluate("document.querySelector('input[name=amount]').value"),
    "115",
  );
  assert(
    (
      await evaluate(
        "document.querySelector('[data-testid=wallet-net]').textContent",
      )
    ).includes("100"),
  );
  assert(
    await evaluate("document.querySelector('input[name=amount]').readOnly"),
  );
  await fillField("description", "Merchant bank details");
  pass(
    "Merchant selects owning shipment IDs, amount is read-only and wallet preview excludes inclusive tax",
  );
  const createCount = () =>
    calls.filter((x) => x.url === "/v1/requests" && x.method === "POST").length;
  let count = createCount();
  balances["merchant-1"] = 10;
  await click("[data-testid=send-withdraw-withdrew]");
  await until(
    "!document.querySelector('[data-testid=send-withdraw-withdrew]').disabled",
    "fresh balance failed",
  );
  assert.equal(createCount(), count);
  assert.equal(
    await evaluate(
      "document.querySelector('textarea[name=description]').value",
    ),
    "Merchant bank details",
  );
  pass("Fresh insufficient balance blocks creation and preserves draft");
  balances["merchant-1"] = 500;
  await detail();
  await selectShipment("shipment-1");
  await fillField("description", "Keep draft");
  eligible[0].shipmentCod.codPrice = 120;
  await click("[data-testid=send-withdraw-withdrew]");
  await until(
    "!document.querySelector('[data-testid=send-withdraw-withdrew]').disabled",
    "stale amount rejected",
  );
  assert.equal(createCount(), count);
  assert.equal(
    await evaluate("document.querySelector('input[name=amount]').value"),
    "115",
  );
  eligible[0].shipmentCod.codPrice = 115;
  pass(
    "Changed shipment COD price blocks submission without silently changing the draft amount",
  );
  await detail();
  await selectShipment("shipment-1");
  await fillField("description", "Retry bank");
  failCreate = true;
  await click("[data-testid=send-withdraw-withdrew]");
  await untilCall(() => createCount() === count + 1, "failed creation");
  await until(
    "!document.querySelector('[data-testid=send-withdraw-withdrew]').disabled",
    "retry create",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('textarea[name=description]').value",
    ),
    "Retry bank",
  );
  failCreate = false;
  await click("[data-testid=send-withdraw-withdrew]");
  await until("location.pathname==='/withdraw-requests/all'", "created");
  let created = calls
    .filter((x) => x.method === "POST" && x.url === "/v1/requests")
    .at(-1).body;
  assert.deepEqual(created, {
    amount: 115,
    description: "Retry bank",
    userId: "merchant-1",
    type: "withdrew",
    shipmentIds: ["shipment-1"],
    status: "pending",
  });
  pass(
    "Failed creation preserves draft; bank retry fixes current ownership and pending status",
  );
  await detail();
  await selectShipment("shipment-2");
  count = createCount();
  failRefresh = true;
  await click("[data-testid=send-withdraw-walletCharge]");
  await until("location.pathname==='/withdraw-requests/all'", "wallet created");
  await sleep(400);
  failRefresh = false;
  assert.equal(createCount(), count + 1);
  created = calls
    .filter((x) => x.method === "POST" && x.url === "/v1/requests")
    .at(-1).body;
  assert.equal(created.type, "walletCharge");
  assert.equal(created.amount, 23);
  assert.deepEqual(created.shipmentIds, ["shipment-2"]);
  pass(
    "Wallet submits gross COD amount once and successful navigation survives account-refresh failure",
  );
  await detail("withdraw-1");
  assert.equal(
    await evaluate(
      "document.querySelectorAll('[data-testid^=send-withdraw-]').length",
    ),
    0,
  );
  await navigate("/withdraw-requests/all/withdraw-2");
  await until(
    "document.body.innerText.includes('No such withdraw request')",
    "foreign detail",
  );
  pass(
    "Submitted merchant details are read-only and foreign records are rejected",
  );
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin logs");
  await navigate("/logs");
  await until(exists("[role=row][data-id=log-1]"), "logs");
  assert.equal(
    await evaluate("document.querySelectorAll('[role=row][data-id]').length"),
    10,
  );
  assert(
    !(await evaluate(
      "document.querySelector('[role=row][data-id=log-2]').innerText.includes('View Shipment')",
    )),
  );
  await screenshot("logs-en-desktop");
  pass(
    "Logs list preserves source fields and hides shipment links without explicit shipment identity",
  );
  await click('button[aria-label="Go to next page"]');
  await until(exists("[role=row][data-id=log-11]"), "logs page two");
  await fillSelector("[data-testid=logs-search]", "Log & # special");
  await until(exists("[role=row][data-id=log-13]"), "log search");
  assert.equal(
    calls.filter((x) => x.url === "/v1/logs").at(-1).query.search,
    "Log & # special",
  );
  pass("Logs use server pagination and encoded search");
  await clickText("Reset filters");
  await until(exists("[role=row][data-id=log-1]"), "logs reset");
  await clickText("View", "[role=row][data-id=log-1] button");
  await until(exists("[data-testid=log-json]"), "raw modal");
  const raw = JSON.parse(
    await evaluate(
      "document.querySelector('[data-testid=log-json]').textContent",
    ),
  );
  assert.equal(raw.meta.response.preserve.raw, true);
  assert.equal(raw.meta.data.description, "<script>stored text</script>");
  await clickText("Close", "[role=dialog] button");
  pass("Raw JSON preserves full nested payload as escaped text");

  await setStatusFilter("logs", "transaction");
  await until(
    "document.body.innerText.includes('There are no logs')",
    "type filter",
  );
  assert.equal(
    calls.filter((x) => x.url === "/v1/logs").at(-1).query.type,
    "transaction",
  );
  await clickText("Reset filters");
  await until(exists("[role=row][data-id=log-1]"), "log type reset");
  pass("Log type filter and reset preserve the original backend contract");
  failLog = true;
  await navigate("/logs");
  await until(
    "document.body.innerText.includes('Could not load records')",
    "logs read failure",
  );
  failLog = false;
  await clickText("Retry");
  await until(exists("[role=row][data-id=log-1]"), "logs retry");
  pass("Failed log list reads expose a working retry");
  await clickText("View Shipment", "[role=row][data-id=log-1] button");
  await until(
    "location.pathname==='/shipments/carrier-1/local/shipment-1'",
    "actual shipment link",
  );
  await navigate("/logs");
  await until(exists("[role=row][data-id=log-1]"), "return logs");
  pass(
    "Log shipment link uses the actual shipment reference instead of the log or snapshot ID",
  );
  const beforeLogs = calls.length;
  await clickText("Details", "[role=row][data-id=log-1] button");
  await until(exists("[data-testid=log-details]"), "snapshot detail");
  assert(
    (await evaluate("document.body.innerText")).includes("Stored receiver"),
  );
  assert(!calls.slice(beforeLogs).some((x) => x.url === "/v1/shipments"));
  await clickText("Raw JSON", "[role=tab]");
  await until(exists("[data-testid=log-json]"), "detail JSON");
  pass(
    "Read-only detail shows the historical snapshot without fetching live shipment data",
  );
  await navigate("/logs/missing");
  await until("document.body.innerText.includes('No Such Log')", "missing log");
  pass("Missing log details expose retry and return to logs");
  await login("limited@example.test");
  await until("location.pathname==='/home'", "limited admin");
  await navigate("/logs");
  await until(exists("[role=row][data-id=log-1]"), "admin exception");
  assert(
    !(await evaluate(
      "document.querySelector('[role=row][data-id=log-1]').innerText.includes('View Shipment')",
    )),
  );
  pass(
    "Admins retain legacy logs access while linked shipment controls respect their own grants",
  );
  await login("viewer@example.test");
  await until("location.pathname==='/home'", "employee");
  const employeeStart = calls.length;
  await navigate("/logs");
  await until(
    "location.pathname==='/home' || location.pathname.includes('403')",
    "logs denied",
  );
  assert(!calls.slice(employeeStart).some((x) => x.url.startsWith("/v1/logs")));
  pass("Employee logs access is blocked before any log API read");
  await login("admin@example.test");
  await until("location.pathname==='/home'", "Arabic admin");
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
  await navigate("/logs");
  await until(exists("[role=row][data-id=log-1]"), "Arabic logs");
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  await screenshot("logs-ar-mobile");
  await navigate("/withdraw-requests/all");
  await until(exists("[role=row][data-id=withdraw-1]"), "Arabic withdrawals");
  await screenshot("withdrawals-ar-mobile");
  pass("Arabic RTL renders logs and withdrawals on mobile");
  assert.deepEqual(exceptions, []);
  assert(
    !calls.some((x) => x.url.startsWith("/v1/logs") && x.method !== "GET"),
  );
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks: passed, exceptions, calls }, null, 2),
  );
  console.log(
    `${passed}/${passed} withdrawal/logs browser checks passed; no uncaught exceptions.`,
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
