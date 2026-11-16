const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("../node_modules/typescript");
const source = fs.readFileSync(
  path.join(__dirname, "../src/app/main/cities-app/cities/exportCitiesCsv.ts"),
  "utf8",
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;
let calls = [],
  blob,
  clicks = 0,
  removed = 0,
  revoked = 0,
  mode = "success";
const client = {
  get: async (_url, { params }) => {
    calls.push(params);
    if (mode === "failure" && params.page === 1) throw new Error("Unavailable");
    const start = params.page * params.pageSize;
    return {
      data: {
        total: mode === "invalid" ? -1 : 100001,
        results: Array.from(
          { length: Math.max(0, Math.min(params.pageSize, 100001 - start)) },
          (_, index) => {
            const n = start + index;
            return {
              id: String(n),
              name: { en: n === 0 ? "=SUM(1,2)" : `City ${n}` },
              country: { name: { en: "Egypt" } },
              state: { name: { en: "Cairo" } },
              shipmentCities: [
                { shippingCompanyId: "carrier-1", name: 'Carrier "Name"' },
              ],
              createdAt: "2026-01-01",
            };
          },
        ),
      },
    };
  },
};
const exportsValue = {};
vm.runInNewContext(js, {
  exports: exportsValue,
  require: (name) => {
    if (name === "app/configs/apiConfig")
      return { __esModule: true, default: client };
    if (name === "../Utils") return { displayName: (value) => value?.en || "" };
    throw new Error(name);
  },
  window: {
    showSaveFilePicker: async () => {
      throw new Error("Native picker must not be called");
    },
  },
  Blob,
  URL: {
    createObjectURL: (value) => {
      blob = value;
      return "blob:test";
    },
    revokeObjectURL: () => {
      revoked++;
    },
  },
  document: {
    createElement: () => ({
      click: () => {
        clicks++;
      },
      remove: () => {
        removed++;
      },
    }),
    body: { appendChild: () => {} },
  },
  setTimeout: (callback) => callback(),
});
const filters = {
  page: 7,
  pageSize: 10,
  searchText: "Cairo",
  countryIdFilter: "country-1",
  stateIdFilter: "state-1",
  shippingCompanyIdFilter: "carrier-1",
};
const run = () =>
  exportsValue.exportCitiesCsv(
    filters,
    ["Name", "Country", "State", "ZIP", "Carriers", "Created", "Carrier name"],
    () => {},
  );
(async () => {
  await run();
  assert.equal(calls.length, 51);
  assert.equal(calls[0].page, 0);
  assert.equal(calls.at(-1).page, 50);
  assert.equal(calls[0].search, "Cairo");
  assert.equal(calls[0].countryId, "country-1");
  assert.equal(calls[0].stateId, "state-1");
  assert.equal(calls[0].shippingCompanyId, "carrier-1");
  const csv = await blob.text(),
    lines = csv.trimEnd().split("\r\n");
  assert.equal(lines.length, 100002);
  assert.match(lines[1], /'=SUM\(1,2\)/);
  assert.match(lines[1], /Carrier ""Name""/);
  assert.match(lines.at(-1), /City 100000/);
  assert.equal(clicks, 1);
  assert.equal(removed, 1);
  assert.equal(revoked, 1);
  for (mode of ["failure", "invalid"]) {
    calls = [];
    await assert.rejects(run());
    assert.equal(clicks, 1);
  }
  console.log(
    "PASS CSV browser download contains 100,001 filtered rows across 51 pages; failures produce no partial download",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
