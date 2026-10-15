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
const model = load(
  "src/app/main/shipping-companies-app/models/ShippingCompanyModel.ts",
  {
    "@lodash": lodash,
  },
);
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (key) => key },
  validator: require(path.join(target, "node_modules/validator")),
});
const utils = load("src/app/main/shipping-companies-app/Utils.ts");
const schemas = load(
  "src/app/main/shipping-companies-app/models/ShippingCompanySchema.ts",
  {
    "src/app/main/utils/validations": validations,
    "../Utils": utils,
  },
);
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
  const module = load(
    "src/app/main/shipping-companies-app/ShippingCompaniesApi.ts",
    {
      "app/store/apiService": { apiService: api },
      "./models/ShippingCompanyModel": model,
      lodash,
    },
  );
  const service = module.default;
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (get) => get().concat(api.middleware),
  });
  return {
    mock,
    service,
    api,
    store,
    run: (name, args) =>
      store
        .dispatch(service.endpoints[name].initiate(args, { subscribe: false }))
        .unwrap(),
    close: () => store.dispatch(api.util.resetApiState()),
  };
}

const company = {
  id: "carrier-1",
  name: "Carrier One",
  serviceName: "carrierOne",
  hasState: true,
  isEnglish: false,
  isActive: true,
  shippingMethods: [utils.shippingMethods.local],
  localPrice: 15,
  maxWeight: 10,
  extraWeightPrice: 2,
  codPrice: 5,
  logoUrl: "/logo.png",
  iconUrl: "/icon.png",
};
const tests = [];
const test = (name, run) => tests.push([name, run]);
const schema = () => schemas.shippingCompanySchema((key) => key);
test("Country-dependent carrier entity defaults do not mutate cached data", () => {
  const input = { ...company, shippingMethods: ["local"] };
  const value = model.default(input);
  value.shippingMethods.push("international");
  assert.equal(input.shippingMethods.length, 1);
  assert.equal(model.default().hasState, true);
  assert.equal(model.default().isEnglish, false);
  assert.equal(model.default().localPrice, 0);
});
test("Shared validations require a company name, service name, method, logo and icon", () => {
  assert.equal(schema().safeParse(company).success, true);
  for (const value of [
    { name: " " },
    { name: "a" },
    { serviceName: "" },
    { shippingMethods: [] },
    { logoUrl: "" },
    { iconUrl: "" },
  ]) {
    assert.equal(
      schema().safeParse({ ...company, ...value }).success,
      false,
      JSON.stringify(value),
    );
  }
});
test("Local pricing fields are required only when local shipping is selected", () => {
  for (const field of ["localPrice", "maxWeight", "extraWeightPrice"]) {
    assert.equal(
      schema().safeParse({ ...company, [field]: undefined }).success,
      false,
    );
  }
  assert.equal(
    schema().safeParse({
      ...company,
      shippingMethods: ["international"],
      localPrice: undefined,
      maxWeight: undefined,
      extraWeightPrice: undefined,
    }).success,
    true,
  );
});
test("Cash on delivery requires local shipping and a COD price", () => {
  assert.equal(
    schema().safeParse({ ...company, shippingMethods: ["cashOnDelivery"] })
      .success,
    false,
  );
  assert.equal(
    schema().safeParse({
      ...company,
      shippingMethods: ["local", "cashOnDelivery"],
      codPrice: undefined,
    }).success,
    false,
  );
  assert.equal(
    schema().safeParse({
      ...company,
      shippingMethods: ["local", "cashOnDelivery"],
      codPrice: 0,
    }).success,
    true,
  );
});
test("Turning off local shipping also removes COD while preserving international", () => {
  const next = utils.changeShippingMethods(
    ["local", "cashOnDelivery", "international"],
    "local",
    false,
  );
  assert.equal(next.join(), "international");
  assert.equal(utils.changeShippingMethods(["local"], "local", true).length, 1);
});
test("Zero and decimal fees remain numbers and optional surcharge can be absent", () => {
  const value = schema().parse({
    ...company,
    localPrice: 0,
    extraWeightPrice: 1.25,
    fuelPercentage: undefined,
  });
  assert.equal(value.localPrice, 0);
  assert.equal(value.extraWeightPrice, 1.25);
  assert.equal(value.fuelPercentage, undefined);
  assert.equal(
    schema().safeParse({ ...company, localPrice: "15" }).success,
    false,
  );
});
test("Methods reuse the legacy enum title and color helpers", () => {
  assert.equal(utils.toShippingMethodTitle("local"), "LOCAL");
  assert.equal(utils.toShippingMethodTitle("international"), "INTERNATIONAL");
  assert.equal(
    utils.toShippingMethodTitle("cashOnDelivery"),
    "CASH_ON_DELIVERY",
  );
  assert.equal(utils.toShippingMethodColor("local"), "#5DADE2");
  assert.equal(utils.toShippingMethodColor("international"), "#99CC00");
  assert.equal(utils.toShippingMethodColor("cashOnDelivery"), "#FFBF00");
});
test("List pagination and searches use the versioned backend contract", async () => {
  const f = fixture();
  try {
    f.mock.onGet("v1/shipping-companies").reply((config) => {
      assert.equal(config.params.page, 2);
      assert.equal(config.params.pageSize, 16);
      assert.equal(config.params.search, "Carrier & Express");
      return [200, { results: [company], total: 33 }];
    });
    const value = await f.run("getShippingCompanies", {
      page: 2,
      pageSize: 16,
      searchText: "Carrier & Express",
    });
    assert.equal(value.results[0].id, "carrier-1");
    assert.equal(value.total, 33);
  } finally {
    f.close();
  }
});
test("Creation and updates send editable fields without IDs or aggregate counts", async () => {
  const f = fixture();
  try {
    for (const [verb, url] of [
      ["onPost", "v1/shipping-companies"],
      ["onPatch", "v1/shipping-companies/carrier-1"],
    ]) {
      f.mock[verb](url).reply((config) => {
        const body = JSON.parse(config.data);
        assert.equal(body.id, undefined);
        assert.equal(body.shipmentsCount, undefined);
        assert.equal(body.createdAt, undefined);
        assert.equal(body.localPrice, 0);
        assert.equal(body.shipmentExtraWeightFees, 1.25);
        return [200, { ...body, id: "carrier-1" }];
      });
    }
    const input = {
      ...company,
      localPrice: 0,
      shipmentExtraWeightFees: 1.25,
      shipmentsCount: 100,
      createdAt: "ignore",
    };
    await f.run("createShippingCompany", input);
    await f.run("updateShippingCompany", input);
  } finally {
    f.close();
  }
});
test("Activation PATCH sends only isActive without overwriting pricing", async () => {
  const f = fixture();
  try {
    f.mock.onPatch("v1/shipping-companies/carrier-1").reply((config) => {
      assert.deepEqual(JSON.parse(config.data), { isActive: false });
      return [200, { ...company, isActive: false }];
    });
    assert.equal(
      (
        await f.run("updateShippingCompany", {
          id: company.id,
          isActive: false,
        })
      ).isActive,
      false,
    );
  } finally {
    f.close();
  }
});
test("Carrier mutations refresh country dropdown lookups and carrier details", async () => {
  const f = fixture();
  try {
    const countryModel = load(
      "src/app/main/countries-app/models/CountryModel.ts",
      { "@lodash": lodash },
    );
    load("src/app/main/countries-app/CountriesApi.ts", {
      "app/store/apiService": { apiService: f.api },
      "./models/CountryModel": countryModel,
      lodash,
    });
    f.mock
      .onGet("v1/shipping-companies")
      .reply(200, { results: [company], total: 1 });
    f.mock.onGet("v1/shipping-companies/carrier-1").reply(200, company);
    f.mock
      .onPatch("v1/shipping-companies/carrier-1")
      .reply(200, { ...company, name: "Renamed" });
    const lookup = f.store.dispatch(
      f.api.endpoints.getCountriesShippingCompanies.initiate(),
    );
    const detail = f.store.dispatch(
      f.api.endpoints.getShippingCompany.initiate("carrier-1"),
    );
    await lookup.unwrap();
    await detail.unwrap();
    await f.run("updateShippingCompany", { id: company.id, name: "Renamed" });
    for (let i = 0; i < 50 && f.mock.history.get.length < 4; i++)
      await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(
      f.mock.history.get.filter((call) => call.url === "v1/shipping-companies")
        .length,
      2,
    );
    assert.equal(
      f.mock.history.get.filter(
        (call) => call.url === "v1/shipping-companies/carrier-1",
      ).length,
      2,
    );
    lookup.unsubscribe();
    detail.unsubscribe();
  } finally {
    f.close();
  }
});
test("Failed writes expose errors for the UI to preserve editable drafts", async () => {
  const f = fixture();
  try {
    f.mock
      .onPatch("v1/shipping-companies/carrier-1")
      .reply(500, { message: "Failure" });
    await assert.rejects(f.run("updateShippingCompany", company));
    assert.equal(f.mock.history.patch.length, 1);
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
    `${tests.length - failed}/${tests.length} shipping-company regression checks passed`,
  );
  process.exitCode = failed ? 1 : 0;
})();
