const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const target = path.resolve(__dirname, "..");
const root = target;
const ts = require(path.join(target, "node_modules/typescript"));
const axios = require(
  path.join(target, "node_modules/axios/dist/node/axios.cjs"),
);
const MockAdapter = require(
  path.join(target, "node_modules/axios-mock-adapter"),
);
const { createApi } = require(
  path.join(target, "node_modules/@reduxjs/toolkit/query/react"),
);
const { configureStore } = require(
  path.join(target, "node_modules/@reduxjs/toolkit"),
);
const zod = require(path.join(target, "node_modules/zod"));
function load(file, imports = {}) {
  const exports = {};
  const js = ts.transpileModule(
    fs.readFileSync(path.join(root, file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  ).outputText;
  vm.runInNewContext(
    js,
    {
      exports,
      require: (name) => {
        if (name in imports) return imports[name];
        if (name === "zod") return zod;
        throw new Error("Unexpected import " + name);
      },
      Date,
      console,
      Set,
    },
    { filename: file },
  );
  return exports;
}
const lodash = require(path.join(target, "node_modules/lodash"));

const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (key) => key },
  validator: require(path.join(target, "node_modules/validator")),
});
function fixture(entity, plural) {
  const base = `src/app/main/${plural.toLowerCase()}-app/`;
  const model = load(base + `models/${entity}Model.ts`, { "@lodash": lodash });
  const utils = load(base + "Utils.ts", {
    "../countries-app/Utils": { displayName: (name) => name?.en },
  });
  const schemas = load(base + `models/${entity}Schema.ts`, {
    "src/app/main/utils/validations": validations,
  });
  const client = axios.create({ baseURL: "https://geography.test" }),
    mock = new MockAdapter(client);
  const api = createApi({
    reducerPath: "geographyTest",
    keepUnusedDataFor: 0,
    endpoints: () => ({}),
    baseQuery: async (request) => {
      try {
        return { data: (await client.request(request)).data ?? null };
      } catch (error) {
        return {
          error: {
            status: error.response?.status || "NETWORK_ERROR",
            data: error.response?.data,
          },
        };
      }
    },
  });
  const service = load(base + `${plural}Api.ts`, {
    "app/store/apiService": { apiService: api },
    [`./models/${entity}Model`]: model,
    lodash,
  }).default;
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (get) => get().concat(api.middleware),
  });
  return {
    api,
    mock,
    model,
    utils,
    schemas,
    store,
    run: (endpoint, args) =>
      store
        .dispatch(
          service.endpoints[endpoint].initiate(args, { subscribe: false }),
        )
        .unwrap(),
    close: () => store.dispatch(api.util.resetApiState()),
  };
}
const tests = [],
  test = (name, run) => tests.push([name, run]);
for (const [entity, plural, parent] of [
  ["State", "States", "country"],
  ["City", "Cities", "state"],
]) {
  const lower = entity.toLowerCase(),
    pl = plural.toLowerCase();
  const item = {
    id: lower + "-1",
    name: { en: entity + " One", ar: null },
    countryId: "country-1",
    ...(entity === "City" ? { stateId: "state-1", postalCode: "00123" } : {}),
    [`shipment${plural}`]: [],
  };
  const mapping = {
    _id: "mapping-1",
    [`${lower}Id`]: item.id,
    shippingCompanyId: "carrier-1",
    name: "Carrier name",
    isActive: true,
  };
  test(`${entity}: entity defaults preserve backend IDs and cached references`, () => {
    const f = fixture(entity, plural);
    try {
      const value = f.model.default(item);
      value.name.en = "Changed";
      assert.equal(item.name.en, entity + " One");
      assert.equal(value.countryId, "country-1");
    } finally {
      f.close();
    }
  });
  test(`${entity}: shared validations require English and hierarchy IDs, while extra locales stay optional`, () => {
    const f = fixture(entity, plural);
    try {
      const schema = f.schemas[lower + "Schema"]((key) => key);
      assert.equal(schema.safeParse(item).success, true);
      assert.equal(
        schema.safeParse({ ...item, name: { en: " " } }).success,
        false,
      );
      assert.equal(schema.safeParse({ ...item, countryId: "" }).success, false);
      if (entity === "City") {
        assert.equal(schema.safeParse({ ...item, stateId: "" }).success, false);
        assert.equal(schema.parse(item).postalCode, "00123");
      }
      assert.equal(
        schema.safeParse({
          ...item,
          name: { en: entity + " One", ar: null, tr: undefined },
        }).success,
        true,
      );
    } finally {
      f.close();
    }
  });
  test(`${entity}: active mappings need names; unchanged and empty drafts do not save`, () => {
    const f = fixture(entity, plural);
    try {
      const schema = f.schemas[`shipment${entity}Schema`]((key) => key);
      assert.equal(schema.safeParse({ ...mapping, name: "" }).success, false);
      assert.equal(
        schema.safeParse({ ...mapping, name: "", isActive: false }).success,
        true,
      );
      assert.equal(
        f.utils[`changedShipment${plural}`](
          [
            mapping,
            { shippingCompanyId: "carrier-2", name: "", isActive: false },
          ],
          [mapping],
        ).length,
        0,
      );
      assert.equal(
        f.utils[`changedShipment${plural}`](
          [{ ...mapping, name: "Edited" }],
          [mapping],
        ).length,
        1,
      );
    } finally {
      f.close();
    }
  });
  test(`${entity}: list requests retain search, carrier, parent, dates and pagination`, async () => {
    const f = fixture(entity, plural);
    try {
      f.mock.onGet(`v1/${pl}`).reply((config) => {
        assert.equal(config.params.search, "East & West");
        assert.equal(config.params.page, 2);
        assert.equal(config.params.shippingCompanyId, "carrier-1");
        assert.equal(config.params.countryId, "country-1");
        assert.equal(config.params.dateFrom, "2026-01-01");
        assert.equal(config.params.dateTo, "2026-12-31");
        if (entity === "City") assert.equal(config.params.stateId, "state-1");
        return [200, { results: [item], total: 25 }];
      });
      const result = await f.run(`get${plural}`, {
        page: 2,
        pageSize: 10,
        searchText: "East & West",
        shippingCompanyIdFilter: "carrier-1",
        countryIdFilter: "country-1",
        stateIdFilter: "state-1",
        dateFromFilter: "2026-01-01",
        dateToFilter: "2026-12-31",
      });
      assert.equal(result.total, 25);
      assert.equal(result.results[0].id, item.id);
    } finally {
      f.close();
    }
  });
  test(`${entity}: all-scope requests omit sentinel parent/carrier values`, async () => {
    const f = fixture(entity, plural);
    try {
      f.mock.onGet(`v1/${pl}`).reply((config) => {
        for (const key of ["shippingCompanyId", "countryId", "stateId"])
          assert.equal(config.params[key], undefined);
        return [200, { results: [], total: 0 }];
      });
      await f.run(`get${plural}`, {
        page: 0,
        pageSize: 10,
        shippingCompanyIdFilter: "all",
        countryIdFilter: "all",
        stateIdFilter: "all",
      });
    } finally {
      f.close();
    }
  });
  test(`${entity}: entity and separately stored carrier names use plain GET queries`, async () => {
    const f = fixture(entity, plural);
    try {
      f.mock.onGet(`v1/${pl}/${item.id}`).reply(200, item);
      f.mock.onGet(`v1/shipment-${pl}`).reply((config) => {
        assert.equal(config.params[lower + "Id"], item.id);
        return [200, { results: [mapping], total: 1 }];
      });
      assert.equal((await f.run(`get${entity}`, item.id)).id, item.id);
      assert.equal(
        (await f.run(`getShipment${plural}`, item.id)).results[0]._id,
        "mapping-1",
      );
    } finally {
      f.close();
    }
  });
  test(`${entity}: create and update send core editable fields only`, async () => {
    const f = fixture(entity, plural);
    try {
      for (const [verb, url] of [
        ["onPost", `v1/${pl}`],
        ["onPatch", `v1/${pl}/${item.id}`],
      ])
        f.mock[verb](url).reply((config) => {
          const data = JSON.parse(config.data);
          assert.equal(data.id, undefined);
          assert.equal(data.country, undefined);
          assert.equal(data[`shipment${plural}`], undefined);
          assert.equal(data.createdAt, undefined);
          assert.equal(data.countryId, "country-1");
          if (entity === "City") {
            assert.equal(data.stateId, "state-1");
            assert.equal(data.postalCode, "00123");
          }
          return [200, item];
        });
      const input = {
        ...item,
        country: { id: "country-1" },
        createdAt: "ignored",
        [`shipment${plural}`]: [mapping],
      };
      await f.run(`create${entity}`, input);
      await f.run(`update${entity}`, input);
    } finally {
      f.close();
    }
  });
  test(`${entity}: newly saved mapping IDs are reused through PATCH`, async () => {
    const f = fixture(entity, plural);
    try {
      f.mock.onPost(`v1/shipment-${pl}`).reply(201, mapping);
      f.mock.onPatch(`v1/shipment-${pl}/mapping-1`).reply((config) => {
        const data = JSON.parse(config.data);
        assert.equal(data._id, undefined);
        assert.equal(data.shippingCompany, undefined);
        return [200, { ...mapping, ...data }];
      });
      const saved = await f.run(`saveShipment${entity}`, {
        ...mapping,
        _id: undefined,
      });
      assert.equal(saved._id, "mapping-1");
      await f.run(`saveShipment${entity}`, { ...saved, name: "Again" });
      assert.equal(f.mock.history.post.length, 1);
      assert.equal(f.mock.history.patch.length, 1);
    } finally {
      f.close();
    }
  });
  test(`${entity}: activation is an isolated PATCH and failed parents never write children`, async () => {
    const f = fixture(entity, plural);
    try {
      f.mock.onPatch(`v1/shipment-${pl}/mapping-1`).reply((config) => {
        assert.deepEqual(JSON.parse(config.data), { isActive: false });
        return [200, { ...mapping, isActive: false }];
      });
      await f.run(`setShipment${entity}Active`, {
        ...mapping,
        isActive: false,
      });
      f.mock.onPatch(`v1/${pl}/${item.id}`).reply(500, {});
      await assert.rejects(f.run(`update${entity}`, item));
      assert.equal(f.mock.history.post.length, 0);
    } finally {
      f.close();
    }
  });
  test(`${entity}: parent removal uses v1 and failed deletes leave child records alone`, async () => {
    const f = fixture(entity, plural);
    try {
      f.mock
        .onDelete(`v1/${pl}/${item.id}`)
        .replyOnce(500, {})
        .onDelete(`v1/${pl}/${item.id}`)
        .reply(204);
      await assert.rejects(f.run(`remove${entity}`, item.id));
      assert.equal(f.mock.history.delete.length, 1);
      await f.run(`remove${entity}`, item.id);
      assert.equal(f.mock.history.delete.length, 2);
    } finally {
      f.close();
    }
  });
}
test("City export-all retains filters and the legacy all-pages page size", async () => {
  const f = fixture("City", "Cities");
  try {
    f.mock.onGet("v1/cities").reply((config) => {
      assert.equal(config.params.pageSize, 100000);
      assert.equal(config.params.stateId, "state-1");
      assert.equal(config.params.shippingCompanyId, "carrier-1");
      return [200, { results: [], total: 0 }];
    });
    await f.run("getCities", {
      page: 0,
      pageSize: 100000,
      stateIdFilter: "state-1",
      shippingCompanyIdFilter: "carrier-1",
    });
  } finally {
    f.close();
  }
});
(async () => {
  let failed = 0;
  for (const [name, run] of tests) {
    try {
      await run();
      console.log("PASS " + name);
    } catch (error) {
      failed++;
      console.error("FAIL " + name + "\n" + error.stack);
    }
  }
  console.log(
    `${tests.length - failed}/${tests.length} geography regression checks passed`,
  );
  process.exitCode = failed ? 1 : 0;
})();
