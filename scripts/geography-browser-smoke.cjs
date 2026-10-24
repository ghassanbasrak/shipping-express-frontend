// Requires Node.js 22+ and Edge, or BROWSER_PATH pointing to a Chromium browser.
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const target = path.resolve(__dirname, "..");
const build = path.join(target, "build");
const output = path.join(target, "test-results/geography-browser");
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

let failList, failParentSave, failMappingSave, failRemove;
const countries = [
  {
    id: "country-1",
    name: { en: "Saudi Arabia", ar: "السعودية" },
    code: "SA",
    dialCode: "+966",
  },
  {
    id: "country-2",
    name: { en: "East & West", ar: "الشرق والغرب" },
    code: "EW",
    dialCode: "+1",
  },
];
const states = Array.from({ length: 25 }, (_, i) => ({
  id: "state-" + (i + 1),
  countryId: i % 2 ? "country-2" : "country-1",
  name: { en: i === 0 ? "Riyadh" : "State " + (i + 1), ar: "منطقة " + (i + 1) },
  createdAt: "2026-01-01T00:00:00.000Z",
}));
const cities = Array.from({ length: 25 }, (_, i) => ({
  id: "city-" + (i + 1),
  countryId: i % 2 ? "country-2" : "country-1",
  stateId: i % 2 ? "state-2" : "state-1",
  name: { en: "City " + (i + 1), ar: "مدينة " + (i + 1) },
  postalCode: "00123",
  createdAt: "2026-01-01T00:00:00.000Z",
}));
const mappings = {
  states: [
    {
      _id: "sm-1",
      stateId: "state-1",
      shippingCompanyId: "carrier-1",
      name: "Riyadh",
      isActive: true,
    },
    {
      _id: "sm-2",
      stateId: "state-2",
      shippingCompanyId: "carrier-1",
      name: "State two",
      isActive: true,
    },
    {
      _id: "sm-legacy",
      stateId: "state-1",
      shippingCompanyId: "legacy-carrier",
      name: "Legacy",
      isActive: true,
    },
  ],
  cities: [
    {
      _id: "cm-1",
      cityId: "city-1",
      shippingCompanyId: "carrier-1",
      name: "City One",
      isActive: true,
    },
    {
      _id: "cm-2",
      cityId: "city-2",
      shippingCompanyId: "carrier-1",
      name: "City Two",
      isActive: true,
    },
  ],
};
let sequence = 25,
  mappingSequence = 10;
const records = { states, cities };
function populate(kind, item) {
  if (!item) return item;
  const entity = kind === "states" ? "state" : "city",
    plural = kind === "states" ? "States" : "Cities";
  return {
    ...item,
    country: countries.find((country) => country.id === item.countryId),
    ...(kind === "cities"
      ? {
          state: populate(
            "states",
            states.find((state) => state.id === item.stateId),
          ),
        }
      : {}),
    ["shipment" + plural]: mappings[kind].filter(
      (row) => row[entity + "Id"] === item.id,
    ),
  };
}
async function respond(event, status, data) {
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
        : Buffer.from(JSON.stringify(data ?? {})).toString("base64"),
  });
}
async function intercept(event) {
  const request = event.request,
    url = new URL(request.url);
  if (!url.pathname.includes("/v1/"))
    return send("Fetch.continueRequest", { requestId: event.requestId });
  if (request.method === "OPTIONS") return respond(event, 204, {});
  const body = JSON.parse(request.postData || "{}"),
    query = Object.fromEntries(url.searchParams);
  calls.push({ url: url.pathname, method: request.method, body, query });
  let data = {},
    status = 200;
  if (url.pathname.endsWith("/auth-sessions/login")) {
    account = {
      ...normal,
      role: body.email.startsWith("employee")
        ? "employee"
        : body.email.startsWith("merchant")
          ? "user"
          : "admin",
    };
    data = {
      user: account,
      accessToken: "geo-access",
      refreshToken: "geo-refresh",
    };
  } else if (url.pathname.endsWith("/users/me"))
    data = account || { ...normal, role: "admin" };
  else if (url.pathname === "/v1/shipping-companies")
    data = {
      results: [
        { id: "carrier-1", name: "Carrier One" },
        { id: "carrier-2", name: "Carrier Two" },
      ],
      total: 2,
    };
  else if (url.pathname === "/v1/languages")
    data = { results: ["en", "ar", "tr"] };
  else if (url.pathname === "/v1/countries") {
    const list = countries.filter(
      (item) =>
        !query.search ||
        item.name.en.toLowerCase().includes(query.search.toLowerCase()),
    );
    data = {
      results: list.map((item) => ({
        ...item,
        shipmentCountries: [
          {
            shippingCompanyId: "carrier-1",
            name: item.name.en,
            isActive: true,
          },
        ],
      })),
      total: list.length,
    };
  } else if (url.pathname.startsWith("/v1/countries/"))
    data =
      countries.find((item) => item.id === url.pathname.split("/").at(-1)) ||
      {};
  else {
    const match = url.pathname.match(
      /^\/v1\/(shipment-)?(states|cities)(?:\/([^/]+))?$/,
    );
    if (!match) {
      status = 404;
      data = { message: "Unhandled mock" };
    } else {
      const [, shipment, kind, id] = match,
        entity = kind === "states" ? "state" : "city";
      if (shipment) {
        const index = mappings[kind].findIndex((row) => row._id === id);
        if (request.method === "GET") {
          const results = mappings[kind].filter(
            (row) => row[entity + "Id"] === query[entity + "Id"],
          );
          data = { results, total: results.length };
        } else if (request.method === "POST") {
          if (failMappingSave === kind) {
            status = 500;
            data = { message: "Mapping save failed" };
          } else {
            data = { ...body, _id: "mapping-" + ++mappingSequence };
            mappings[kind].push(data);
            status = 201;
          }
        } else if (index < 0) {
          status = 404;
          data = { message: "Mapping missing" };
        } else if (request.method === "DELETE") {
          mappings[kind].splice(index, 1);
          status = 204;
        } else {
          Object.assign(mappings[kind][index], body);
          data = mappings[kind][index];
        }
      } else if (!id) {
        if (request.method === "POST") {
          if (failParentSave === kind) {
            status = 500;
            data = { message: "Parent failed" };
          } else {
            const item = {
              ...body,
              id: entity + "-" + ++sequence,
              createdAt: "2026-01-01T00:00:00.000Z",
            };
            records[kind].push(item);
            data = populate(kind, item);
            status = 201;
          }
        } else if (failList === kind) {
          status = 500;
          data = { message: "List failed" };
        } else {
          const list = records[kind].filter(
            (item) =>
              (!query.countryId || item.countryId === query.countryId) &&
              (!query.stateId || item.stateId === query.stateId) &&
              (!query.search ||
                item.name.en
                  .toLowerCase()
                  .includes(query.search.toLowerCase())),
          );
          const page = +query.page || 0,
            size = +query.pageSize || 10;
          // Carrier scope is deliberately left to the legacy client guard.
          data = {
            results: list
              .slice(page * size, (page + 1) * size)
              .map((item) => populate(kind, item)),
            total: list.length,
          };
        }
      } else {
        const index = records[kind].findIndex((item) => item.id === id);
        if (index < 0) {
          status = 404;
          data = { message: "Missing" };
        } else if (request.method === "DELETE") {
          if (failRemove === kind) {
            status = 500;
            data = { message: "Delete failed" };
          } else {
            records[kind].splice(index, 1);
            status = 204;
          }
        } else if (request.method === "PATCH") {
          if (failParentSave === kind) {
            status = 500;
            data = { message: "Parent failed" };
          } else {
            Object.assign(records[kind][index], body);
            data = populate(kind, records[kind][index]);
          }
        } else data = populate(kind, records[kind][index]);
      }
    }
  }
  return respond(event, status, data);
}
const mappingInput = (carrier) =>
  `[data-testid=mapping-${carrier}] input[name$=".name"]`;
async function mappingClick(carrier) {
  await evaluate(
    `document.querySelector('[data-testid=mapping-${carrier}] input[type=checkbox]').click()`,
  );
}
async function saveMapping(carrier) {
  await evaluate(
    `document.querySelector('[data-testid=save-mapping-${carrier}]').click()`,
  );
  await until(
    `!document.querySelector('[data-testid=save-mapping-${carrier}]').disabled`,
    "carrier saved",
  );
}
async function rowAction(id, label) {
  await evaluate(
    `document.querySelector('[role=row][data-id="${id}"] button[aria-label=More]').click()`,
  );
  await until(
    `[...document.querySelectorAll('[role=button]')].some(item=>item.textContent===${JSON.stringify(label)})`,
    "row action",
  );
  await clickText(label, "[role=button]");
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
  await until("location.pathname==='/home'", "admin session");
  let checks = 0;
  for (const [entity, plural, parent, parentId] of [
    ["State", "States", "country", "country-1"],
    ["City", "Cities", "state", "state-1"],
  ]) {
    const lower = entity.toLowerCase(),
      pl = plural.toLowerCase(),
      id = lower + "-1",
      base = `/${pl}/all/${parentId}`,
      rowPrefix = `[role=row][data-id^=${lower}-]`;
    await navigate(`/${pl}/all/all`);
    await until(
      `Boolean(document.querySelector('[role=row][data-id=${id}]'))`,
      "geographic list",
    );
    await evaluate(
      `document.querySelector('button[aria-label="Go to next page"]').click()`,
    );
    await until(
      `Boolean(document.querySelector('[role=row][data-id=${lower}-11]'))`,
      "server pagination",
    );
    assert.equal(
      calls.filter((call) => call.url === `/v1/${pl}`).at(-1).query.page,
      "1",
    );
    console.log(`PASS ${entity}: list and server pagination`);
    checks++;
    await fillSelector(`[data-testid=${pl}-search]`, "East & West");
    await until(
      `document.querySelectorAll('${rowPrefix}').length===0`,
      "empty search",
    );
    const last = calls.filter((call) => call.url === `/v1/${pl}`).at(-1).query;
    assert.equal(last.search, "East & West");
    assert.equal(last.page, "0");
    console.log(`PASS ${entity}: encoded searches reset pagination`);
    checks++;
    await navigate(`/${pl}/carrier-1/all`);
    await until(
      `document.querySelectorAll('${rowPrefix}').length===2`,
      "carrier scope",
    );
    assert.equal(
      calls.filter((call) => call.url === `/v1/${pl}`).at(-1).query
        .shippingCompanyId,
      "carrier-1",
    );
    console.log(
      `PASS ${entity}: carrier filtering remains active with unfiltered backend rows`,
    );
    checks++;
    await navigate(`${base}/${id}`);
    await until(
      `Boolean(document.querySelector('[data-testid=save-${lower}]')) && Boolean(document.querySelector('${mappingInput("carrier-1")}'))`,
      "detail form",
    );
    await until(
      `Boolean(document.querySelector('#${parent}Id'))`,
      "parent selector",
    );
    assert.equal(
      await evaluate(`document.querySelector('#${parent}Id').disabled`),
      true,
    );
    if (entity === "State")
      assert.ok(
        await evaluate(
          "Boolean(document.querySelector('[data-testid=mapping-legacy-carrier]'))",
        ),
      );
    await fill("name.en", entity + " Unsaved Draft");
    await fillSelector(mappingInput("carrier-1"), "Carrier first edit");
    await saveMapping("carrier-1");
    await fillSelector(mappingInput("carrier-1"), "Carrier second edit");
    await saveMapping("carrier-1");
    assert.equal(
      calls.filter(
        (call) =>
          call.url ===
            `/v1/shipment-${pl}/${entity === "State" ? "sm-1" : "cm-1"}` &&
          call.method === "PATCH",
      ).length,
      2,
    );
    assert.equal(
      await evaluate("document.querySelector('input[name=\"name.en\"]').value"),
      entity + " Unsaved Draft",
    );
    console.log(
      `PASS ${entity}: locked parents, saved mapping IDs and unsaved form preservation`,
    );
    checks++;
    await mappingClick("carrier-2");
    await fillSelector(mappingInput("carrier-2"), "New carrier draft");
    await saveMapping("carrier-2");
    const createdMapping = mappings[pl].find(
      (row) =>
        row[lower + "Id"] === id && row.shippingCompanyId === "carrier-2",
    );
    assert.ok(createdMapping);
    await fillSelector(mappingInput("carrier-2"), "New carrier renamed");
    await saveMapping("carrier-2");
    assert.equal(
      calls.filter(
        (call) =>
          call.url === `/v1/shipment-${pl}/${createdMapping._id}` &&
          call.method === "PATCH",
      ).length,
      1,
    );
    await mappingClick("carrier-1");
    await until(
      `!document.querySelector('[data-testid=mapping-carrier-1] input[type=checkbox]').checked`,
      "deactivated mapping",
    );
    console.log(
      `PASS ${entity}: new carrier names POST once, then PATCH and activate independently`,
    );
    checks++;
    failParentSave = pl;
    await evaluate(
      `document.querySelector('[data-testid=save-${lower}]').click()`,
    );
    await until(
      `document.body.innerText.includes('Something went wrong while saving') && !document.querySelector('[data-testid=save-${lower}]').disabled`,
      "failed parent save",
    );
    assert.equal(
      await evaluate("document.querySelector('input[name=\"name.en\"]').value"),
      entity + " Unsaved Draft",
    );
    failParentSave = undefined;
    await evaluate(
      `document.querySelector('[data-testid=save-${lower}]').click()`,
    );
    await until(`location.pathname===${JSON.stringify(base)}`, "parent saved");
    const update = calls
      .filter(
        (call) => call.url === `/v1/${pl}/${id}` && call.method === "PATCH",
      )
      .at(-1).body;
    assert.equal(update["shipment" + plural], undefined);
    assert.equal(update.id, undefined);
    console.log(
      `PASS ${entity}: failed updates retain drafts and retries save core fields`,
    );
    checks++;
    await navigate(`${base}/new`);
    await until(
      `Boolean(document.querySelector('[data-testid=save-${lower}]')) && Boolean(document.querySelector('${mappingInput("carrier-1")}'))`,
      "create form",
    );
    await fill("name.en", "Pilot " + entity);
    if (entity === "City") await fill("postalCode", "00123");
    await mappingClick("carrier-1");
    await fillSelector(mappingInput("carrier-1"), "Recover carrier draft");
    failMappingSave = pl;
    const createsBefore = calls.filter(
      (call) => call.url === `/v1/${pl}` && call.method === "POST",
    ).length;
    await evaluate(
      `document.querySelector('[data-testid=save-${lower}]').click()`,
    );
    await until(
      `location.pathname.startsWith(${JSON.stringify(base + "/" + lower + "-")}) && Boolean(document.querySelector('[data-testid=save-${lower}]'))`,
      "partial create recovery",
    );
    await until(
      `document.querySelector('${mappingInput("carrier-1")}')?.value==='Recover carrier draft'`,
      "carrier draft restored",
    );
    failMappingSave = undefined;
    await evaluate(
      `document.querySelector('[data-testid=save-${lower}]').click()`,
    );
    await until(
      `location.pathname===${JSON.stringify(base)}`,
      "create recovery saved",
    );
    const created = records[pl].find(
      (item) => item.name.en === "Pilot " + entity,
    );
    assert.ok(created);
    assert.equal(created.countryId, "country-1");
    if (entity === "City") {
      assert.equal(created.stateId, "state-1");
      assert.equal(created.postalCode, "00123");
    }
    assert.equal(
      calls.filter((call) => call.url === `/v1/${pl}` && call.method === "POST")
        .length,
      createsBefore + 1,
    );
    assert.ok(
      mappings[pl].some(
        (row) =>
          row[lower + "Id"] === created.id &&
          row.name === "Recover carrier draft",
      ),
    );
    console.log(
      `PASS ${entity}: partial creation recovers parent IDs and carrier drafts without duplicates`,
    );
    checks++;
    await fillSelector(`[data-testid=${pl}-search]`, "Pilot");
    await until(
      `Boolean(document.querySelector('[role=row][data-id=${created.id}]'))`,
      "created row",
    );
    await rowAction(created.id, "Edit Names");
    await until(
      "Boolean(document.querySelector('[role=dialog] [data-testid=save-mapping-carrier-1]'))",
      "naming dialog",
    );
    await fillSelector(mappingInput("carrier-1"), "Dialog name");
    await saveMapping("carrier-1");
    assert.equal(
      mappings[pl].find((row) => row[lower + "Id"] === created.id).name,
      "Dialog name",
    );
    console.log(
      `PASS ${entity}: naming dialogs load persisted IDs and save edits`,
    );
    checks++;
    await navigate(`${base}/${created.id}`);
    await until(
      `Boolean(document.querySelector('[data-testid=save-${lower}]'))`,
      "delete detail",
    );
    failRemove = pl;
    await clickText("Remove");
    await until(
      "Boolean(document.querySelector('[role=dialog]'))",
      "delete confirmation",
    );
    await clickText("Yes", "[role=dialog] button");
    await until(
      "document.body.innerText.includes('Something went wrong while removing')",
      "failed delete",
    );
    assert.ok(records[pl].some((row) => row.id === created.id));
    assert.ok(mappings[pl].some((row) => row[lower + "Id"] === created.id));
    failRemove = undefined;
    await until(
      "!document.querySelector('button.MuiLoadingButton-loading')",
      "delete retry ready",
    );
    await clickText("Remove");
    await until(
      "Boolean(document.querySelector('[role=dialog]'))",
      "delete retry",
    );
    await clickText("Yes", "[role=dialog] button");
    await until(`location.pathname===${JSON.stringify(base)}`, "deleted");
    assert.equal(
      records[pl].some((row) => row.id === created.id),
      false,
    );
    assert.equal(
      mappings[pl].some((row) => row[lower + "Id"] === created.id),
      false,
    );
    console.log(
      `PASS ${entity}: failed deletes preserve data and confirmed deletes clean mappings`,
    );
    checks++;
    failList = pl;
    await navigate(`/${pl}/all/all`);
    await until(
      "document.body.innerText.includes('Something went wrong while getting')",
      "list failure",
    );
    failList = undefined;
    await clickText("Retry");
    await until(
      `Boolean(document.querySelector('[role=row][data-id=${id}]'))`,
      "list retry",
    );
    await navigate(`${base}/missing`);
    await until(
      "document.body.innerText.includes('No such')",
      "missing entity",
    );
    console.log(`PASS ${entity}: list retries and missing-record errors`);
    checks++;
  }
  // Parent searches use the shared component and must encode ampersands.
  await navigate("/cities/all/all/new");
  await until(
    "Boolean(document.querySelector('#countryId'))",
    "unscoped city form",
  );
  await fillSelector("#countryId", "Saudi");
  await until(
    "Boolean(document.querySelector('[role=option]'))",
    "country option",
  );
  await evaluate("document.querySelector('[role=option]').click()");
  await fillSelector("#stateId", "State");
  await until(
    "Boolean(document.querySelector('[role=option]'))",
    "state option",
  );
  await evaluate("document.querySelector('[role=option]').click()");
  await fillSelector("#countryId", "East & West");
  await until(
    "[...document.querySelectorAll('[role=option]')].some(item=>item.textContent==='East & West')",
    "second country",
  );
  await evaluate("[...document.querySelectorAll('[role=option]')].find(item=>item.textContent==='East & West').click()");
  await until("document.querySelector('#countryId').value==='East & West'", "second country selected");
  await until(
    "document.querySelector('#stateId').value===''",
    "state reset after country change",
  );
  assert.equal(
    calls
      .filter((call) => call.url === "/v1/countries" && call.query.search)
      .at(-1).query.search,
    "East & West",
  );
  await fillSelector("#stateId", "State");
  await until(
    "Boolean(document.querySelector('[role=option]'))",
    "country-scoped state lookup",
  );
  for (let i = 0; i < 100 && !calls.some(call => call.url === "/v1/states" && call.query.search && call.query.countryId === "country-2"); i++) await sleep(50);
  assert.equal(
    calls
      .filter((call) => call.url === "/v1/states" && call.query.search)
      .at(-1).query.countryId,
    "country-2",
  );
  console.log(
    "PASS City country changes reset state selection and scope encoded lookups",
  );
  checks++;
  await navigate("/states/all/country-1/state-1");
  await until(
    "Boolean(document.querySelector('[data-testid=save-state]'))",
    "state city link",
  );
  await clickText("View Cities", "a");
  await until(
    "location.pathname==='/cities/all/state-1' && Boolean(document.querySelector('[role=row][data-id=city-1]'))",
    "state city drilldown",
  );
  console.log(
    "PASS Countries, states and cities retain their hierarchy routes",
  );
  checks++;
  // Export all pages must keep the current state/carrier scope.
  await navigate("/cities/carrier-1/state-1");
  await until(
    "Boolean(document.querySelector('[role=row][data-id=city-1]'))",
    "export scope",
  );
  await send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: output,
  });
  await clickText("Export All Pages");
  for (
    let i = 0;
    i < 150 &&
    !calls.some(
      (call) => call.url === "/v1/cities" && call.query.pageSize === "100000",
    );
    i++
  )
    await sleep(50);
  const exported = calls.find(
    (call) => call.url === "/v1/cities" && call.query.pageSize === "100000",
  );
  assert.ok(exported);
  assert.equal(exported.query.stateId, "state-1");
  assert.equal(exported.query.shippingCompanyId, "carrier-1");
  for (
    let i = 0;
    i < 100 && !fs.readdirSync(output).some((name) => name.endsWith(".xlsx"));
    i++
  )
    await sleep(50);
  const workbookFile = fs
    .readdirSync(output)
    .find((name) => name.endsWith(".xlsx"));
  assert.ok(workbookFile);
  const XLSX = require(path.join(target, "node_modules/xlsx")),
    workbook = XLSX.readFile(path.join(output, workbookFile)),
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
  assert.ok(rows.length > 0);
  assert.ok(Object.hasOwn(rows[0], "Company Name"));
  console.log(
    "PASS City export-all downloads filtered rows with the carrier naming column",
  );
  checks++;
  cities.push({
    id: "city-row-delete",
    name: { en: "Row Delete City" },
    countryId: "country-1",
    stateId: "state-1",
    postalCode: "00001",
  });
  mappings.cities.push({
    _id: "row-delete-map",
    cityId: "city-row-delete",
    shippingCompanyId: "carrier-1",
    name: "Delete draft",
    isActive: true,
  });
  await navigate("/cities/all/all");
  await until(
    "Boolean(document.querySelector('[data-testid=cities-search]'))",
    "row deletion list",
  );
  await fillSelector("[data-testid=cities-search]", "Row Delete");
  await until(
    "Boolean(document.querySelector('[role=row][data-id=city-row-delete]'))",
    "row delete item",
  );
  await rowAction("city-row-delete", "Remove");
  await until(
    "Boolean(document.querySelector('[role=dialog]'))",
    "row remove dialog",
  );
  failRemove = "cities";
  await clickText("Yes", "[role=dialog] button");
  await until(
    "document.querySelector('[role=dialog]')?.innerText.includes('Something went wrong while removing')",
    "row delete error",
  );
  assert.ok(mappings.cities.some((row) => row.cityId === "city-row-delete"));
  failRemove = undefined;
  await clickText("Yes", "[role=dialog] button");
  await until("!document.querySelector('[role=dialog]')", "row delete success");
  assert.equal(
    cities.some((row) => row.id === "city-row-delete"),
    false,
  );
  assert.equal(
    mappings.cities.some((row) => row.cityId === "city-row-delete"),
    false,
  );
  console.log(
    "PASS City row-delete errors stay reviewable and retries clean dependent mappings",
  );
  checks++;
  for (const email of ["employee@example.test", "merchant@example.test"]) {
    await login(email);
    await until("location.pathname==='/home'", "restricted account");
    for (const route of ["/states/all/all", "/cities/all/all"]) {
      await navigate(route);
      await until(
        "location.pathname==='/home' || document.body.innerText.includes('Unauthorized Access')",
        "geography denied",
      );
      assert.equal(
        await evaluate(
          "Boolean(document.querySelector('[data-testid=states-search],[data-testid=cities-search]'))",
        ),
        false,
      );
    }
  }
  console.log("PASS State and city routes are admin-only");
  checks++;
  await login("admin@example.test");
  await until("location.pathname==='/home'", "admin restored");
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
  for (const [route, file, selector] of [
    ["/states/all/all", "states-ar-mobile.png", "[data-testid=states-search]"],
    [
      "/cities/all/state-1/city-1",
      "city-ar-mobile.png",
      "[data-testid=save-city]",
    ],
  ]) {
    await navigate(route);
    await until(
      `Boolean(document.querySelector('${selector}'))`,
      "Arabic mobile page",
    );
    assert.equal(
      await evaluate("getComputedStyle(document.body).direction"),
      "rtl",
    );
    await sleep(600);
    const screenshot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(
      path.join(output, file),
      Buffer.from(screenshot.data, "base64"),
    );
  }
  console.log("PASS Geographic lists and forms render in Arabic RTL on mobile");
  checks++;
  assert.deepEqual(exceptions, []);
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify({ checks, exceptions, calls }, null, 2),
  );
  console.log(`${checks}/${checks} geographic browser checks passed.`);
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
