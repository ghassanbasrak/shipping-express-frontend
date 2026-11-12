const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("../node_modules/typescript");
const source = fs.readFileSync(path.join(__dirname, "../src/app/main/cities-app/cities/exportCitiesCsv.ts"), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
const calls = [];
let lineCount = 0;
let firstData = "";
let lastData = "";
let closed = false;
let aborted = false;
const writer = {
  write: async (chunk) => {
    const lines = chunk.trimEnd().split("\r\n");
    lineCount += lines.length;
    if (!firstData && lineCount > 1) firstData = lines[0];
    lastData = lines.at(-1);
  },
  close: async () => { closed = true; },
  abort: async () => { aborted = true; },
};
const client = { get: async (_url, { params }) => {
  calls.push(params);
  const start = params.page * params.pageSize;
  const length = Math.max(0, Math.min(params.pageSize, 100001 - start));
  return { data: { total: 100001, results: Array.from({ length }, (_, index) => {
    const n = start + index;
    return { id: String(n), name: { en: n === 0 ? '=SUM(1,2)' : `City ${n}` },
      country: { name: { en: "Egypt" } }, state: { name: { en: "Cairo" } },
      shipmentCities: [{ shippingCompanyId: "carrier-1", name: 'Carrier "Name"' }],
      createdAt: "2026-01-01" };
  }) } };
} };
const moduleExports = {};
vm.runInNewContext(js, {
  exports: moduleExports,
  require: (name) => {
    if (name === "app/configs/apiConfig") return { __esModule: true, default: client };
    if (name === "../Utils") return { displayName: (value) => value?.en || "" };
    throw new Error(name);
  },
  window: { showSaveFilePicker: async () => ({ createWritable: async () => writer }) },
  Set, String, Error, URL, Blob, document: {}, setTimeout,
});
(async () => {
  await moduleExports.exportCitiesCsv({ page: 7, pageSize: 10, searchText: "Cairo", countryIdFilter: "country-1", stateIdFilter: "state-1", shippingCompanyIdFilter: "carrier-1" },
    ["Name", "Country", "State", "ZIP", "Carriers", "Created", "Carrier name"], () => {});
  assert.equal(calls.length, 51);
  assert.equal(calls[0].page, 0);
  assert.equal(calls.at(-1).page, 50);
  assert.equal(calls[0].search, "Cairo");
  assert.equal(calls[0].countryId, "country-1");
  assert.equal(calls[0].stateId, "state-1");
  assert.equal(calls[0].shippingCompanyId, "carrier-1");
  assert.equal(lineCount, 100002);
  assert.match(firstData, /'=SUM\(1,2\)/);
  assert.match(firstData, /Carrier ""Name""/);
  assert.match(lastData, /City 100000/);
  assert.equal(closed, true);
  assert.equal(aborted, false);
  console.log("PASS CSV export includes 100,001 filtered city rows across 51 pages");
})().catch((error) => { console.error(error); process.exitCode = 1; });
