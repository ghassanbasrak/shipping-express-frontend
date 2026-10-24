// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/transactions-browser");
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

const users = [
  {
    ...normal,
    id: "merchant-1",
    firstName: "Merchant",
    lastName: "Alpha",
    email: "alpha@example.test",
    balance: 100,
    codBalance: 20,
  },
  {
    ...normal,
    id: "merchant-2",
    firstName: "Merchant",
    lastName: "Beta",
    email: "beta@example.test",
    balance: 300,
    codBalance: 70,
  },
];
const records = Array.from({ length: 30 }, (_, i) => ({
  id: "tx-" + (i + 1),
  reference: "TX-" + String(i + 1).padStart(3, "0"),
  userId: i < 24 ? "merchant-1" : "merchant-2",
  user: users[i < 24 ? 0 : 1],
  createdById: i % 2 ? "staff-2" : "staff-1",
  createdBy: {
    id: i % 2 ? "staff-2" : "staff-1",
    firstName: "Staff",
    lastName: i % 2 ? "Two" : "One",
  },
  type: i % 2 ? "withdraw" : "deposit",
  relatedBalance: i % 3 === 0 ? "cod" : "wallet",
  transactionTitle:
    i % 3 === 0
      ? "cod shipment payment"
      : i % 2
        ? "bags request"
        : "new shipment",
  title: {
    en: "Transaction " + String(i + 1).padStart(2, "0"),
    ar: "معاملة " + (i + 1),
  },
  description: {
    en: "Ledger entry " + (i + 1),
    ar: "تفاصيل المعاملة " + (i + 1),
  },
  amount: 100,
  previousBalance: 100,
  currentBalance: i % 2 ? 0 : 200,
  operationType: "custom",
  applyTax: false,
  taxable: true,
  invoiceId: i % 2 ? undefined : "invoice-" + i,
  invoiceUrl:
    i % 2 ? undefined : "https://reports.example.test/invoice-" + i + ".pdf",
  zohoCreditId: "CREDIT-" + i,
  notes: i === 2 ? "A & B accounting" : "Ledger note " + (i + 1),
  createdAt: i === 4 ? "2025-05-31T12:00:00Z" : "2026-10-01T12:00:00Z",
}));
let failList = false,
  failAccount = false,
  failSearch = false,
  failWrite = false,
  failFile = false,
  failDownload = false,
  missingUrl = false,
  delayList = false,
  delayWrite = false,
  failRefreshAfterCreate = false;
const fixtureErrors = [],
  files = new Map();
let fileSequence = 0,
  passed = 0;
function pass(name) {
  passed++;
  console.log("PASS " + name);
}
function scopedRows(query, titles = []) {
  return records.filter(
    (row) =>
      (account?.role !== "user" || row.userId === account.id) &&
      (!query.userId || row.userId === query.userId) &&
      (!query.relatedBalance || row.relatedBalance === query.relatedBalance) &&
      (!query.createdById || row.createdById === query.createdById) &&
      (!query.search ||
        JSON.stringify(row)
          .toLowerCase()
          .includes(query.search.toLowerCase())) &&
      (!query.type || row.type === query.type) &&
      (!titles.length || titles.includes(row.transactionTitle)) &&
      (!query.dateFrom ||
        new Date(row.createdAt) >= new Date(query.dateFrom)) &&
      (!query.dateTo || new Date(row.createdAt) <= new Date(query.dateTo)),
  );
}
async function binary(event, status, bytes, type) {
  return send("Fetch.fulfillRequest", {
    requestId: event.requestId,
    responseCode: status,
    responseHeaders: [
      { name: "Content-Type", value: type },
      { name: "Access-Control-Allow-Origin", value: "*" },
      { name: "Cache-Control", value: "no-store" },
    ],
    body: Buffer.from(bytes).toString("base64"),
  });
}
function effect(value) {
  const amount =
    value.type === "deposit" &&
    value.relatedBalance === "wallet" &&
    value.applyTax
      ? Math.round((value.amount / 1.15) * 100) / 100
      : value.amount;
  return value.type === "withdraw" ? -amount : amount;
}
async function intercept(event) {
  const req = event.request,
    url = new URL(req.url),
    method = req.method;
  if (method === "OPTIONS") return fulfill(event, 204, "");
  if (url.hostname === "reports.example.test") {
    if (failDownload) return binary(event, 500, "failed", "text/plain");
    const file = files.get(url.pathname);
    if (!file) return binary(event, 404, "missing", "text/plain");
    if (file.type === "pdf") {
      const { jsPDF } = require(
        path.join(target, "node_modules/jspdf/dist/jspdf.node.min.js"),
      );
      const pdf = new jsPDF();
      pdf.text("Ashamco Finance Report", 10, 10);
      pdf.text(
        "Account " + file.owner + " / " + file.rows.length + " transactions",
        10,
        20,
      );
      return binary(event, 200, pdf.output("arraybuffer"), "application/pdf");
    }
    const XLSX = require(path.join(target, "node_modules/xlsx")),
      book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(
        file.rows.map((row) => ({
          Reference: row.reference,
          Merchant: row.userId,
          Balance: row.relatedBalance,
          Amount: row.amount,
          Notes: row.notes,
        })),
      ),
      "Transactions",
    );
    return binary(
      event,
      200,
      XLSX.write(book, { type: "buffer", bookType: "xlsx" }),
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  }
  const query = Object.fromEntries(url.searchParams),
    titles = url.searchParams.getAll("transactionTitle"),
    body = JSON.parse(req.postData || "{}");
  calls.push({ url: url.pathname, method, query, titles, body });
  let result = {},
    status = 200;
  try {
    if (url.pathname.endsWith("/auth-sessions/login")) {
      const kind = body.email.split("@")[0];
      account = { ...normal, id: "staff-1", role: "admin" };
      if (kind === "merchant") account = { ...users[0] };
      if (
        ["viewer", "wallet", "cod", "editor", "noview", "denied"].includes(kind)
      ) {
        account.role = "employee";
        account.features =
          kind === "denied"
            ? [{ feature: "merchants", accessView: true }]
            : [
                ...(kind !== "cod"
                  ? [
                      {
                        feature: "transactions",
                        accessView: kind !== "noview",
                        accessCreate: ["wallet", "noview"].includes(kind),
                        accessUpdate: kind === "editor",
                      },
                    ]
                  : []),
                ...(["cod", "viewer", "noview"].includes(kind)
                  ? [
                      {
                        feature: "cod-transactions",
                        accessView: kind !== "noview",
                        accessCreate: kind === "cod",
                        accessUpdate: false,
                      },
                    ]
                  : []),
                {
                  feature: "merchants",
                  accessView: true,
                  accessUpdate: ["wallet", "cod"].includes(kind),
                },
              ];
      }
      result = {
        user: account,
        accessToken: "transactions-access",
        refreshToken: "transactions-refresh",
      };
    } else if (url.pathname === "/v1/users/me") {
      result =
        account?.role === "user"
          ? users.find((x) => x.id === account.id)
          : account || normal;
    } else if (url.pathname === "/v1/users") {
      const list =
        query.type === "user"
          ? users
          : [
              {
                id: "staff-1",
                firstName: "Staff",
                lastName: "One",
                role: "admin",
              },
              {
                id: "staff-2",
                firstName: "Staff",
                lastName: "Two",
                role: "employee",
              },
            ];
      if (failSearch) {
        status = 500;
        result = { message: "Search failed" };
      } else {
        const results = list.filter(
          (x) =>
            !query.search ||
            JSON.stringify(x)
              .toLowerCase()
              .includes(query.search.toLowerCase()),
        );
        result = { results, total: results.length };
      }
    } else if (url.pathname.startsWith("/v1/users/")) {
      result = users.find((x) => x.id === url.pathname.split("/").at(-1)) || {
        id: "staff-1",
        firstName: "Staff",
        lastName: "One",
        role: "admin",
      };
      if (failAccount) {
        status = 500;
        result = { message: "Account failed" };
      }
    } else if (url.pathname === "/v1/transactions/report") {
      assert.equal(method, "GET");
      assert.equal(query.page, "0");
      assert.equal(query.pageSize, "50000");
      if (failFile) {
        status = 500;
        result = { message: "Report generation failed" };
      } else if (missingUrl) result = {};
      else {
        const name = "/finance-" + ++fileSequence + "." + query.reportType;
        files.set(name, {
          type: query.reportType,
          owner: query.userId || account.id,
          rows: structuredClone(scopedRows(query, titles)),
        });
        result = { url: "https://reports.example.test" + name };
      }
    } else if (url.pathname === "/v1/transactions") {
      if (method === "GET") {
        if (delayList) await sleep(350);
        if (failList) {
          status = 500;
          result = { message: "List failed" };
        } else {
          const list = scopedRows(query, titles),
            start = Number(query.page) * Number(query.pageSize);
          result = {
            results: list.slice(start, start + Number(query.pageSize)),
            total: list.length,
          };
        }
      } else {
        assert.equal(method, "POST");
        assert.notEqual(account.role, "user");
        assert.ok(users.some((x) => x.id === body.userId));
        assert.deepEqual(
          Object.keys(body).filter(
            (key) =>
              ![
                "userId",
                "type",
                "relatedBalance",
                "amount",
                "notes",
                "operationType",
                "applyTax",
              ].includes(key),
          ),
          [],
        );
        if (delayWrite) await sleep(450);
        if (failWrite) {
          status = 500;
          result = { message: "Create failed" };
        } else {
          const owner = users.find((x) => x.id === body.userId),
            balanceKey =
              body.relatedBalance === "cod" ? "codBalance" : "balance";
          const row = {
            ...body,
            id: "tx-" + (records.length + 1),
            reference: "NEW-" + (records.length + 1),
            user: owner,
            previousBalance: owner[balanceKey],
            createdAt: "2026-10-23T12:00:00Z",
            title: "Staff transaction",
            description: "Created adjustment",
          };
          owner[balanceKey] += effect(body);
          row.currentBalance = owner[balanceKey];
          records.unshift(row);
          result = row;
          status = 201;
          if (failRefreshAfterCreate) failAccount = true;
        }
      }
    } else if (url.pathname.startsWith("/v1/transactions/")) {
      const id = url.pathname.split("/").at(-1),
        row = records.find((x) => x.id === id);
      if (!row) {
        status = 404;
        result = { message: "Not found" };
      } else if (method === "GET") result = row;
      else {
        assert.equal(method, "PATCH");
        assert.notEqual(account.role, "user");
        assert.deepEqual(
          Object.keys(body).filter(
            (key) =>
              ![
                "userId",
                "type",
                "relatedBalance",
                "amount",
                "notes",
                "operationType",
                "applyTax",
              ].includes(key),
          ),
          [],
        );
        if (failWrite) {
          status = 500;
          result = { message: "Update failed" };
        } else {
          Object.assign(row, body);
          result = row;
        }
      }
    } else {
      status = 404;
      result = { message: "Unexpected fixture " + url.pathname };
    }
  } catch (error) {
    fixtureErrors.push(error.stack);
    status = 500;
    result = { message: error.message };
  }
  return fulfill(event, status, result);
}
const exists = (selector) =>
  `Boolean(document.querySelector(${JSON.stringify(selector)}))`;
async function click(selector) {
  await until(exists(selector), "action " + selector);
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
}
async function clickReady(selector) {
  await until(
    `${exists(selector)}&&!document.querySelector(${JSON.stringify(selector)}).disabled`,
    "enabled " + selector,
  );
  await click(selector);
}
async function fillField(name, value) {
  await until(exists(`[name="${name}"]`), "field " + name);
  await evaluate(
    `(()=>{const input=document.querySelector('[name=${JSON.stringify(name)}]');Object.getOwnPropertyDescriptor(input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));input.dispatchEvent(new FocusEvent('blur',{bubbles:true}));})()`,
  );
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
async function choose(name, value) {
  await evaluate(
    `document.querySelector('[name=${JSON.stringify(name)}]').closest('.MuiFormControl-root').querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))`,
  );
  await until(
    exists(`[role=option][data-value="${value}"]`),
    "select " + value,
  );
  await click(`[role=option][data-value="${value}"]`);
}
async function selectUser(name, text) {
  await evaluate(
    `(()=>{const input=document.querySelector('[name=${JSON.stringify(name)}]');input.focus();input.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',code:'ArrowDown',bubbles:true}));})()`,
  );
  await fillField(name, text);
  await until(
    `Boolean([...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes(${JSON.stringify(text)})))`,
    "account " + text,
  );
  await evaluate(
    `[...document.querySelectorAll('[role=option]')].find(x=>x.textContent.includes(${JSON.stringify(text)})).click()`,
  );
}
async function ledger(owner = "all", balance = "wallet", query = "") {
  await navigate(`/transactions/${owner}/${balance}${query}`);
  await until(exists("[data-testid=transactions-table]"), "ledger");
  await until(
    "Boolean(document.querySelector('[role=row][data-id]'))||document.body.innerText.includes('There are no transactions')",
    "ledger rows",
  );
}
async function reports(owner = "all") {
  await navigate("/transaction-reports/" + owner);
  await until(exists("[data-testid=transaction-reports-table]"), "report");
}
async function detail(id = "new", owner = "merchant-1", balance = "all") {
  await navigate(`/transactions/${owner}/${balance}/${id}`);
  await until(exists("[name=amount]"), "transaction form");
}
async function filterControl(label) {
  return evaluate(
    `(()=>{const title=[...document.querySelectorAll('[role=menu] p')].find(x=>x.textContent.toLowerCase()===${JSON.stringify(label.toLowerCase())});if(!title)throw new Error('Missing filter '+${JSON.stringify(label)});title.parentElement.querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));})()`,
  );
}
async function chooseFilter(label, value) {
  await filterControl(label);
  await until(
    exists(`[role=option][data-value="${value}"]`),
    "filter option " + value,
  );
  await click(`[role=option][data-value="${value}"]`);
}
async function screenshot(name) {
  await sleep(400);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    path.join(output, name + ".png"),
    Buffer.from(shot.data, "base64"),
  );
}
const listCalls = () =>
  calls.filter((x) => x.url === "/v1/transactions" && x.method === "GET");
const creates = () =>
  calls.filter((x) => x.url === "/v1/transactions" && x.method === "POST");
const fileCalls = () =>
  calls.filter((x) => x.url === "/v1/transactions/report");
async function downloadedSince(start, type) {
  let file;
  for (let i = 0; i < 150; i++) {
    file = fs
      .readdirSync(output)
      .filter((x) => x.endsWith("." + type))
      .map((x) => path.join(output, x))
      .find((x) => fs.statSync(x).mtimeMs >= start);
    if (file && !fs.existsSync(file + ".crdownload")) break;
    await sleep(100);
  }
  assert.ok(file, "new " + type + " download");
  return file;
}
async function exportReport(type) {
  const start = Date.now();
  await clickReady("[data-testid=download-report-" + type + "]");
  const file = await downloadedSince(start, type);
  await until(
    "!document.querySelector('[data-testid=download-report-pdf]').disabled&&!document.querySelector('[data-testid=download-report-xlsx]').disabled",
    "export released",
  );
  return file;
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
      { urlPattern: "https://reports.example.test/*" },
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

  await reset("/transactions/all/wallet");
  await until("location.pathname==='/sign-in'", "guest");
  pass("Guests must sign in before ledger access");
  await login("denied@example.test");
  await until("location.pathname==='/home'", "denied login");
  let before = listCalls().length;
  await navigate("/transactions/all/wallet");
  await sleep(500);
  assert.equal(listCalls().length, before);
  pass("Staff without a ledger grant cannot fetch transactions");
  await login("noview@example.test");
  await until("location.pathname==='/home'", "no view");
  before = listCalls().length;
  await navigate("/transaction-reports/all");
  await sleep(500);
  assert.equal(listCalls().length, before);
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=download-report-pdf]'))",
    ),
    false,
  );
  pass("View permission is required for ledger data and report exports");
  await login("viewer@example.test");
  await until("location.pathname==='/home'", "viewer");
  await ledger();
  assert.equal(
    await evaluate("document.querySelectorAll('[role=row][data-id]').length"),
    10,
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=new-transaction]'))",
    ),
    false,
  );
  assert.equal(
    await evaluate(
      `Boolean(document.querySelector('[data-field="createdBy.firstName"]'))`,
    ),
    false,
  );
  pass(
    "Read-only staff retain ten-row ledger access without mutation controls or admin-only staff columns",
  );
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin");
  await ledger();
  await until(exists("[role=row][data-id=tx-3]"), "taxed transaction");
  assert.ok(
    await evaluate(
      "document.querySelector('[role=row][data-id=tx-3] [data-field=taxable]').innerText.includes('115.00')",
    ),
  );
  assert.ok(
    await evaluate(
      "Boolean(document.querySelector('a[href=\"https://reports.example.test/invoice-2.pdf\"]'))",
    ),
  );
  pass(
    "Wallet ledger retains historical tax display, accounting IDs and existing invoice links",
  );
  delayList = true;
  await click('button[aria-label="Go to next page"]');
  await until(
    "Boolean(document.querySelector('[role=row][data-id=tx-17]'))",
    "second page",
  );
  delayList = false;
  assert.equal(listCalls().at(-1).query.page, "1");
  await sleep(150);
  assert.equal(listCalls().at(-1).query.page, "1");
  pass(
    "Server pagination keeps the requested page while the next response loads",
  );
  await fillSelector("[data-testid=transactions-search]", "A & B");
  await until(exists("[role=row][data-id=tx-3]"), "search result");
  assert.equal(listCalls().at(-1).query.search, "A & B");
  assert.equal(listCalls().at(-1).query.page, "0");
  const exportStart = Date.now();
  await clickText("Export All Pages");
  const exported = await downloadedSince(exportStart, "xlsx");
  const XLSX = require(path.join(target, "node_modules/xlsx")),
    book = XLSX.readFile(exported),
    sheet = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]]);
  assert.equal(sheet.length, 1);
  assert.ok(JSON.stringify(sheet).includes("A & B accounting"));
  assert.equal(listCalls().at(-1).query.pageSize, "50000");
  assert.equal(listCalls().at(-1).query.search, "A & B");
  pass(
    "Encoded search resets pagination and filtered export-all downloads the actual workbook content",
  );
  await ledger("all", "wallet", "?createdById=staff-1");
  assert.equal(listCalls().at(-1).query.createdById, "staff-1");
  await click("[data-testid=transactions-filters]");
  await chooseFilter("Transaction Type", "new shipment");
  await escape();
  await escape();
  await until(
    "Boolean(document.querySelector('[role=row][data-id=tx-3]'))",
    "title filter",
  );
  assert.ok(listCalls().at(-1).titles.includes("new shipment"));
  await screenshot("transactions-desktop");
  pass(
    "Admin audit query scope and repeated transaction-title filters reach the ledger API",
  );
  failList = true;
  await fillSelector("[data-testid=transactions-search]", "failed");
  await until(
    "document.body.innerText.includes('Unable to load transactions')",
    "list error",
  );
  failList = false;
  await clickText("Retry");
  await until(
    "!document.body.innerText.includes('Unable to load transactions')",
    "list recovery",
  );
  pass("List failures expose a retry without losing filter state");
  await login("wallet@example.test");
  await until("location.pathname==='/home'", "wallet staff");
  await ledger("merchant-1");
  await click("[data-testid=new-transaction]");
  await until(exists("[name=amount]"), "new adjustment");
  assert.equal(
    await evaluate("document.querySelector('[name=relatedBalance]').value"),
    "wallet",
  );
  await evaluate(
    "document.querySelector('[name=relatedBalance]').closest('.MuiFormControl-root').querySelector('[role=combobox]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true}))",
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[role=option][data-value=cod]'))",
    ),
    false,
  );
  await escape();
  pass("Wallet-only creators can adjust wallet balances without selecting COD");
  await fillField("amount", "0");
  before = creates().length;
  await clickReady("[data-testid=save-transaction]");
  await sleep(200);
  assert.equal(creates().length, before);
  pass("Zero amounts cannot create financial transactions");
  await fillField("amount", "115");
  await fillField("notes", "Staff deposit");
  await until(
    "document.querySelector('[data-testid=transaction-preview-after]').innerText.includes('200.00')",
    "net credit preview",
  );
  assert.ok(
    await evaluate(
      "document.querySelector('[data-testid=transaction-preview-tax]').innerText.includes('15.00')",
    ),
  );
  failWrite = true;
  await clickReady("[data-testid=save-transaction]");
  await until(
    "document.body.innerText.includes('Unable to save the transaction')",
    "write error",
  );
  assert.equal(
    await evaluate("document.querySelector('[name=notes]').value"),
    "Staff deposit",
  );
  assert.equal(
    await evaluate("document.querySelector('[name=amount]').value"),
    "115",
  );
  pass(
    "Tax-inclusive deposits preview net credit and retain amount/notes after failed writes",
  );
  failWrite = false;
  delayWrite = true;
  failRefreshAfterCreate = true;
  before = creates().length;
  await evaluate(
    "document.querySelector('[data-testid=save-transaction]').click();document.querySelector('[data-testid=save-transaction]').click()",
  );
  await until(
    "location.pathname==='/transactions/merchant-1/wallet'",
    "create success",
  );
  delayWrite = false;
  assert.equal(creates().length, before + 1);
  assert.deepEqual(creates().at(-1).body, {
    userId: "merchant-1",
    type: "deposit",
    relatedBalance: "wallet",
    amount: 115,
    notes: "Staff deposit",
    operationType: "custom",
    applyTax: true,
  });
  assert.equal(users[0].balance, 200);
  pass(
    "Retry submits one exact deposit payload and returns to the working account ledger",
  );
  await until(
    "document.body.innerText.includes('Unable to load the account')",
    "post-save account refresh failure",
  );
  assert.equal(creates().length, before + 1);
  failRefreshAfterCreate = false;
  failAccount = false;
  pass(
    "A balance-refresh failure after a successful write does not repeat the financial transaction",
  );
  await detail("tx-3", "merchant-1", "wallet");
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=save-transaction]'))",
    ),
    false,
  );
  assert.equal(
    await evaluate("document.querySelector('[name=amount]').disabled"),
    true,
  );
  pass("Create-only staff cannot edit existing financial records");
  await login("editor@example.test");
  await until("location.pathname==='/home'", "update staff");
  await detail("tx-3", "merchant-1", "wallet");
  await fillField("amount", "80");
  await fillField("notes", "Updated existing record");
  await evaluate("window.dispatchEvent(new Event('focus'))");
  await sleep(150);
  assert.equal(
    await evaluate("document.querySelector('[name=notes]').value"),
    "Updated existing record",
  );
  await clickReady("[data-testid=save-transaction]");
  await until(
    "location.pathname==='/transactions/merchant-1/wallet'",
    "update success",
  );
  const patch = calls.filter((x) => x.method === "PATCH").at(-1);
  assert.equal(patch.url, "/v1/transactions/tx-3");
  assert.equal(patch.body.amount, 80);
  assert.equal("id" in patch.body, false);
  pass(
    "Update-granted staff PATCH the real transaction ID and preserve editable drafts",
  );
  await login("cod@example.test");
  await until("location.pathname==='/home'", "COD staff");
  await ledger("merchant-1", "cod");
  await click("[data-testid=new-transaction]");
  await until(exists("[name=amount]"), "COD adjustment");
  assert.equal(
    await evaluate("document.querySelector('[name=relatedBalance]').value"),
    "cod",
  );
  await choose("type", "withdraw");
  await fillField("amount", "25");
  await fillField("notes", "COD withdrawal");
  assert.equal(
    await evaluate("Boolean(document.querySelector('[name=applyTax]'))"),
    false,
  );
  assert.equal(
    await evaluate("Boolean(document.querySelector('[name=operationType]'))"),
    false,
  );
  await clickReady("[data-testid=save-transaction]");
  await until(
    "location.pathname==='/transactions/merchant-1/cod'",
    "COD create",
  );
  assert.deepEqual(creates().at(-1).body, {
    userId: "merchant-1",
    type: "withdraw",
    relatedBalance: "cod",
    amount: 25,
    notes: "COD withdrawal",
  });
  assert.equal(users[0].codBalance, -5);
  pass(
    "COD withdrawal keeps its own permissions and omits wallet tax/operation fields",
  );
  await reports("merchant-1");
  await until(exists("[role=row][data-id]"), "COD report");
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=report-balance-wallet]'))",
    ),
    false,
  );
  assert.equal(listCalls().at(-1).query.relatedBalance, "cod");
  pass("COD-only staff reports cannot fetch wallet transactions");
  await login("merchant@example.test");
  await until("location.pathname==='/home'", "merchant");
  await ledger("merchant-2", "wallet");
  assert.equal(listCalls().at(-1).query.userId, undefined);
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=new-transaction]'))",
    ),
    false,
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-field=zohoCreditId]'))",
    ),
    false,
  );
  pass(
    "Merchant ledger ignores spoofed account routes and hides staff accounting/mutation controls",
  );
  await reports("merchant-2");
  await until(exists("[data-testid=download-report-pdf]"), "merchant report");
  assert.equal(listCalls().at(-1).query.userId, undefined);
  const merchantPdf = await exportReport("pdf");
  assert.equal(fs.readFileSync(merchantPdf).subarray(0, 5).toString(), "%PDF-");
  assert.equal(fileCalls().at(-1).query.userId, undefined);
  pass(
    "Merchant report downloads use backend current-account scope rather than route ownership",
  );
  await login("admin@example.test");
  await until("location.pathname==='/home'", "report admin");
  before = listCalls().length;
  await reports();
  await until(
    "document.body.innerText.includes('Select a merchant to view or export')",
    "report selection requirement",
  );
  await sleep(200);
  assert.equal(listCalls().length, before);
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=download-report-pdf]'))",
    ),
    false,
  );
  pass("Staff report lists and exports require a selected merchant");
  await selectUser("reportUserId", "Alpha");
  await until(exists("[role=row][data-id]"), "selected merchant report");
  await fillField("reportDateFrom", "01/01/2026");
  await fillField("reportDateTo", "10/23/2026");
  await until(
    "Boolean(document.querySelector('[role=row][data-id]'))",
    "dated report",
  );
  await click('button[aria-label="Go to next page"]');
  await until(
    "Boolean(document.querySelector('[role=row][data-id=tx-18]'))",
    "report second page",
  );
  assert.equal(listCalls().at(-1).query.page, "1");
  const reportXlsx = await exportReport("xlsx"),
    reportBook = XLSX.readFile(reportXlsx),
    reportRows = XLSX.utils.sheet_to_json(
      reportBook.Sheets[reportBook.SheetNames[0]],
    );
  assert.ok(reportRows.length > 10);
  assert.ok(
    reportRows.every(
      (row) => row.Merchant === "merchant-1" && row.Balance === "wallet",
    ),
  );
  assert.equal(fileCalls().at(-1).query.page, "0");
  assert.ok(fileCalls().at(-1).query.dateFrom);
  assert.ok(fileCalls().at(-1).query.dateTo);
  pass(
    "Server-generated Excel reports export every filtered page and preserve account/date scope",
  );
  const reportPdf = await exportReport("pdf");
  assert.equal(fs.readFileSync(reportPdf).subarray(0, 5).toString(), "%PDF-");
  pass("Server-generated PDF reports download as real files");
  failFile = true;
  await clickReady("[data-testid=download-report-pdf]");
  await until(
    "document.body.innerText.includes('Unable to generate or download')",
    "report generation error",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=download-report-pdf]').disabled",
    ),
    false,
  );
  failFile = false;
  missingUrl = true;
  await clickReady("[data-testid=download-report-pdf]");
  await until(
    "document.body.innerText.includes('Unable to generate or download')",
    "missing file URL",
  );
  await until(
    "!document.querySelector('[data-testid=download-report-pdf]').disabled",
    "missing URL loading released",
  );
  missingUrl = false;
  failDownload = true;
  await clickReady("[data-testid=download-report-pdf]");
  await until(
    "document.body.innerText.includes('Unable to generate or download')",
    "HTTP download error",
  );
  await until(
    "!document.querySelector('[data-testid=download-report-pdf]').disabled",
    "download error loading released",
  );
  failDownload = false;
  await exportReport("pdf");
  pass(
    "Report generation failures, missing URLs and failed HTTP downloads release loading and allow retry",
  );
  await fillField("reportDateTo", "01/01/2025");
  before = fileCalls().length;
  await until(
    "document.body.innerText.includes('Enter valid dates')",
    "invalid dates",
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('[data-testid=download-report-pdf]'))",
    ),
    false,
  );
  assert.equal(fileCalls().length, before);
  pass("Invalid report date ranges cannot silently export a broader report");
  await fillField("reportDateFrom", "");
  await fillField("reportDateTo", "");
  await until(exists("[data-testid=download-report-pdf]"), "cleared dates");
  await click("[data-testid=report-balance-cod]");
  await until(
    "document.querySelectorAll('[role=row][data-id]').length>0",
    "COD switch",
  );
  assert.equal(listCalls().at(-1).query.relatedBalance, "cod");
  await choose("reportTitle", "cod shipment payment");
  await until(
    "Boolean(document.querySelector('[role=row][data-id=tx-1]'))",
    "COD title",
  );
  assert.deepEqual(listCalls().at(-1).titles, ["cod shipment payment"]);
  await screenshot("transaction-reports-desktop");
  pass(
    "Report balance/title switches clear incompatible categories and query the selected COD title",
  );
  failSearch = true;
  await fillField("reportUserId", "missing");
  await until(
    "document.body.innerText.includes('Unable to load the account')",
    "account search failure",
  );
  failSearch = false;
  await clickText("Retry");
  await until(
    "!document.body.innerText.includes('Unable to load the account')",
    "search retry",
  );
  await selectUser("reportUserId", "Beta");
  await until(
    "document.querySelector('[name=reportUserId]').value.includes('Beta')",
    "account switch",
  );
  await sleep(250);
  assert.equal(listCalls().at(-1).query.userId, "merchant-2");
  assert.equal(listCalls().at(-1).query.page, "0");
  pass(
    "Remote account search errors recover and merchant changes reset report pagination",
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
  await reports("merchant-1");
  await until(exists("[data-testid=download-report-pdf]"), "Arabic report");
  await sleep(400);
  assert.equal(
    await evaluate("getComputedStyle(document.body).direction"),
    "rtl",
  );
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  await screenshot("transaction-reports-ar-mobile");
  await exportReport("pdf");
  pass(
    "Arabic mobile reports keep RTL, fit the viewport and download successfully",
  );
  await ledger("merchant-1", "wallet");
  await screenshot("transactions-ar-mobile");
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  pass("Arabic mobile ledger preserves the layout and filter/search controls");
  failAccount = true;
  await detail("new", "merchant-1", "wallet");
  await fillField("amount", "115");
  await fillField("notes", "Mobile adjustment draft");
  await until(
    "Boolean(document.querySelector('[role=alert]'))",
    "account lookup error",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[data-testid=save-transaction]').disabled",
    ),
    true,
  );
  failAccount = false;
  await clickText("إعادة المحاولة");
  await until(
    "!document.querySelector('[data-testid=save-transaction]').disabled",
    "account lookup retry",
  );
  assert.equal(
    await evaluate("document.querySelector('[name=notes]').value"),
    "Mobile adjustment draft",
  );
  pass(
    "Fresh account lookup failures block writes and retries preserve the adjustment draft",
  );
  await sleep(300);
  assert.ok(
    await evaluate("document.documentElement.scrollWidth<=innerWidth+1"),
  );
  const width = await evaluate(
    "document.querySelector('[name=amount]').closest('.MuiFormControl-root').getBoundingClientRect().width",
  );
  assert.ok(width >= 300);
  await screenshot("transaction-form-ar-mobile");
  pass(
    "Arabic mobile adjustment form keeps full-width fields, notes and live balance previews",
  );
  assert.equal(
    calls.some((x) => x.method === "DELETE" || x.url.includes("create-zoho")),
    false,
  );
  assert.deepEqual(fixtureErrors, []);
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify(
      { checks: passed, fixtureErrors, exceptions, calls },
      null,
      2,
    ),
  );
  console.log(
    `${passed}/${passed} transaction/report browser checks passed; no uncaught exceptions.`,
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
