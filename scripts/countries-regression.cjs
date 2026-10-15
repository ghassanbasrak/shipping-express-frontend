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
const model = load("src/app/main/countries-app/models/CountryModel.ts", {
  "@lodash": lodash,
});
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (key) => key },
  validator: require(path.join(target, "node_modules/validator")),
});
const schemas = load("src/app/main/countries-app/models/CountrySchema.ts", {
  "src/app/main/utils/validations": validations,
});
const utils = load("src/app/main/countries-app/Utils.ts", {
  "src/app/main/utils/localeString": (name) => name?.en,
});
const country = {
  id: "country-1",
  name: { en: "Saudi Arabia", ar: "السعودية" },
  code: "SA",
  dialCode: "+966",
  shipmentCountries: [],
};
const mapping = {
  id: "mapping-1",
  countryId: "country-1",
  shippingCompanyId: "carrier-1",
  name: "Saudi Arabia",
  isActive: true,
};
function fixture() {
  const client = axios.create({ baseURL: "https://countries.test" });
  const mock = new MockAdapter(client);
  const api = createApi({
    reducerPath: "countriesTest",
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
            message: error.message,
          },
        };
      }
    },
  });
  const module = load("src/app/main/countries-app/CountriesApi.ts", {
    "app/store/apiService": { apiService: api },
    "./models/CountryModel": model,
    lodash,
  });
  const service = module.default;
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (get) => get().concat(api.middleware),
  });
  return {
    mock,
    service,
    store,
    run: (name, args) =>
      store
        .dispatch(service.endpoints[name].initiate(args, { subscribe: false }))
        .unwrap(),
    close: () => store.dispatch(api.util.resetApiState()),
  };
}

const tests = [];
const test = (name, run) => tests.push([name, run]);
test("Optional localized names accept empty, missing and null values", () => {
  const value = schemas
    .countrySchema((k) => k)
    .parse({
      ...country,
      name: { en: "Saudi Arabia", ar: null, tr: undefined },
    });
  assert.equal(value.name.ar, null);
  assert.equal(value.name.tr, undefined);
});
test("Shared validations keep English mandatory and reject whitespace or invalid codes", () => {
  const schema = schemas.countrySchema((k) => k);
  assert.equal(schema.parse({ ...country, code: " sa " }).code, "SA");
  for (const en of ["", "  ", "a"])
    assert.equal(schema.safeParse({ ...country, name: { en } }).success, false);
  assert.equal(schema.safeParse({ ...country, code: "123" }).success, false);
  assert.equal(schema.safeParse({ ...country, dialCode: "  " }).success, false);
});
test("Active carrier names are required while inactive drafts remain valid", () => {
  const schema = schemas.shipmentCountrySchema((k) => k);
  assert.equal(schema.safeParse({ ...mapping, name: "" }).success, false);
  assert.equal(
    schema.safeParse({ ...mapping, name: "", isActive: false }).success,
    true,
  );
});
test("Country defaults preserve data without mutating cached entity objects", () => {
  const data = {
    ...country,
    shipmentCountries: [{ ...mapping, _id: "mongo-mapping" }],
  };
  const value = model.default(data);
  value.name.en = "Edited";
  value.shipmentCountries[0].name = "Edited";
  assert.equal(data.name.en, "Saudi Arabia");
  assert.equal(data.shipmentCountries[0].name, "Saudi Arabia");
  assert.equal(value.shipmentCountries[0]._id, "mongo-mapping");
  assert.equal(model.default().code, "");
});
test("Mapping comparison skips unchanged records and empty inactive drafts", () => {
  assert.equal(
    utils.changedShipmentCountries(
      [mapping, { shippingCompanyId: "carrier-2", name: "", isActive: false }],
      [mapping],
    ).length,
    0,
  );
  assert.equal(
    utils.changedShipmentCountries([{ ...mapping, name: "Changed" }], [mapping])
      .length,
    1,
  );
});
test("List requests send encoded structured filters and retain the backend pagination response", async () => {
  const f = fixture();
  try {
    f.mock.onGet("v1/countries").reply((config) => {
      assert.equal(config.params.search, "Saudi & Bahrain");
      assert.equal(config.params.shippingCompanyId, "carrier-1");
      assert.equal(config.params.dateFrom, "2026-01-01");
      assert.equal(config.params.page, 2);
      return [
        200,
        { results: [country, { ...country, id: "country-2" }], total: 25 },
      ];
    });
    const value = await f.run("getCountries", {
      page: 2,
      pageSize: 25,
      searchText: "Saudi & Bahrain",
      shippingCompanyIdFilter: "carrier-1",
      dateFromFilter: "2026-01-01",
    });
    assert.equal(value.results.length, 2);
    assert.equal(value.total, 25);
  } finally {
    f.close();
  }
});
test("Country and shipping-name details are independent plain API queries", async () => {
  const f = fixture();
  try {
    f.mock.onGet("v1/countries/country-1").reply(200, country);
    f.mock.onGet("v1/shipment-countries").reply((config) => {
      assert.equal(config.params.countryId, "country-1");
      return [200, { results: [mapping], total: 1 }];
    });
    assert.equal((await f.run("getCountry", "country-1")).id, "country-1");
    assert.equal(
      (await f.run("getShipmentCountries", "country-1")).results[0].id,
      "mapping-1",
    );
    assert.equal(f.mock.history.get.length, 2);
  } finally {
    f.close();
  }
});
test("Country creation sends only editable fields and returns the raw entity", async () => {
  const f = fixture();
  try {
    f.mock.onPost("v1/countries").reply((config) => {
      const body = JSON.parse(config.data);
      assert.equal(body.id, undefined);
      assert.equal(body.shipmentCountries, undefined);
      assert.equal(body.createdAt, undefined);
      return [201, { ...country, id: "created-country" }];
    });
    const value = await f.run("createCountry", {
      ...country,
      shipmentCountries: [mapping],
      createdAt: "ignored",
    });
    assert.equal(value.id, "created-country");
    assert.equal(f.mock.history.post.length, 1);
  } finally {
    f.close();
  }
});
test("Updates filter editable fields and leave separate mapping writes to the UI", async () => {
  const f = fixture();
  try {
    f.mock.onPatch("v1/countries/country-1").reply((config) => {
      const body = JSON.parse(config.data);
      assert.equal(body.id, undefined);
      assert.equal(body.shipmentCountries, undefined);
      assert.equal(body.code, "SA");
      return [200, country];
    });
    await f.run("updateCountry", { ...country, shipmentCountries: [mapping] });
    assert.equal(f.mock.history.patch.length, 1);
  } finally {
    f.close();
  }
});
test("Saved mapping IDs are retained and the next save PATCHes the same record", async () => {
  const f = fixture();
  try {
    f.mock
      .onPost("v1/shipment-countries")
      .reply(201, { ...mapping, id: undefined, _id: "persisted-id" });
    f.mock.onPatch("v1/shipment-countries/persisted-id").reply((config) => {
      const body = JSON.parse(config.data);
      assert.equal(body._id, undefined);
      assert.equal(body.shippingCompany, undefined);
      return [200, { ...body, _id: "persisted-id" }];
    });
    const first = await f.run("saveShipmentCountry", {
      ...mapping,
      id: undefined,
    });
    assert.equal(first._id, "persisted-id");
    await f.run("saveShipmentCountry", { ...first, name: "Updated" });
    assert.equal(f.mock.history.post.length, 1);
    assert.equal(f.mock.history.patch.length, 1);
  } finally {
    f.close();
  }
});
test("Deactivation sends only isActive and preserves the existing name", async () => {
  const f = fixture();
  try {
    f.mock.onPatch("v1/shipment-countries/mapping-1").reply((config) => {
      assert.deepEqual(JSON.parse(config.data), { isActive: false });
      return [200, { ...mapping, isActive: false }];
    });
    assert.equal(
      (await f.run("setShipmentCountryActive", { ...mapping, isActive: false }))
        .isActive,
      false,
    );
  } finally {
    f.close();
  }
});
test("Parent and mapping deletions use separate versioned endpoints", async () => {
  const f = fixture();
  try {
    f.mock.onDelete("v1/countries/country-1").reply(204);
    f.mock.onDelete("v1/shipment-countries/mapping-1").reply(204);
    await f.run("removeCountry", country.id);
    await f.run("removeShipmentCountry", mapping);
    assert.equal(f.mock.history.delete.length, 2);
  } finally {
    f.close();
  }
});
test("Failed parent deletion is reported without hidden dependent writes", async () => {
  const f = fixture();
  try {
    f.mock.onDelete("v1/countries/country-1").reply(500, {});
    await assert.rejects(f.run("removeCountry", country.id));
    assert.equal(f.mock.history.delete.length, 1);
  } finally {
    f.close();
  }
});
test("Shipping-company and language lookups retain their backend response shape", async () => {
  const f = fixture();
  try {
    f.mock.onGet("v1/languages").reply(200, { results: ["en", "ar", "tr"] });
    f.mock.onGet("v1/shipping-companies").reply(200, {
      results: [{ id: "carrier-1", name: "Carrier" }],
      total: 1,
    });
    assert.equal((await f.run("getCountriesLanguages")).results[2], "tr");
    assert.equal(
      (await f.run("getCountriesShippingCompanies")).results[0].id,
      "carrier-1",
    );
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
    `${tests.length - failed}/${tests.length} country regression checks passed`,
  );
  process.exitCode = failed ? 1 : 0;
})();
