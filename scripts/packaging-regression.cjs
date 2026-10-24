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

const base = "src/app/main/package-requests-app/";
const permissions = load("src/app/auth/permissions.ts");
const shipmentUtils = load("src/app/main/shipment-users-app/Utils.ts");
const utils = load(base + "Utils.ts", {
  "src/app/auth/permissions": permissions,
  "../countries-app/Utils": {
    displayName: (name) =>
      typeof name === "string" ? name : name?.en || name?.ar || "",
  },
  "../shipment-users-app/Utils": shipmentUtils,
});
const model = load(base + "models/PackageRequestModel.ts", {
  "@lodash": lodash,
});
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (key) => key },
  validator: require(path.join(target, "node_modules/validator")),
});
const schemas = load(base + "models/PackageRequestSchema.ts", {
  "src/app/main/utils/validations": validations,
  "../../utils/currencyFormatter": (value) => String(value),
});
const t = (key, params) => (params?.balance ? key + " " + params.balance : key);
const schema = schemas.packageRequestSchema(t, 100);
const toolkit = require(path.join(target, "node_modules/@reduxjs/toolkit"));
const valid = {
  id: "request-1",
  type: "bags",
  status: "pending",
  amount: 40,
  productIds: ["supply-1"],
  fullName: "Receiver",
  phone: "555123456",
  phoneCountry: "+966",
  shippingAddress: { countryId: "country", stateId: "state" },
};
const supplies = [
  { id: "supply-1", name: { en: "Bags" }, price: 40, count: 50 },
  { id: "supply-2", name: "Stickers", price: 20, count: 100 },
];
let passed = 0;
function check(name, run) {
  run();
  passed++;
  console.log("PASS " + name);
}
async function checkAsync(name, run) {
  await run();
  passed++;
  console.log("PASS " + name);
}
async function main() {
  check(
    "catalog bundle totals sum selected prices once without multiplying bundle piece counts",
    () => {
      assert.equal(
        utils.packagingTotal(["supply-1", "supply-2"], supplies),
        60,
      );
      assert.equal(utils.packagingTotal([], supplies), 0);
      assert.equal(utils.packagingTotal(["supply-1"], supplies), 40);
    },
  );
  check(
    "unknown supplies and unusable prices never silently lower the total",
    () => {
      assert.equal(utils.packagingTotal(["missing"], supplies), undefined);
      assert.equal(
        utils.packagingTotal(["supply-1"], [{ ...supplies[0], price: NaN }]),
        undefined,
      );
      assert.equal(
        utils.packagingTotal(["supply-1"], [{ ...supplies[0], price: 0 }]),
        0,
      );
    },
  );
  check(
    "validation requires at least one supply, positive total and sufficient wallet balance",
    () => {
      assert.equal(schema.safeParse(valid).success, true);
      for (const changes of [
        { productIds: [] },
        { amount: 0 },
        { amount: -1 },
        { amount: 101 },
      ])
        assert.equal(schema.safeParse({ ...valid, ...changes }).success, false);
      assert.equal(schema.safeParse({ ...valid, amount: 100 }).success, true);
      assert.equal(
        schemas.packageRequestSchema(t, 0).safeParse(valid).success,
        false,
      );
    },
  );
  check(
    "recipient name, phone, country and state are required while city/street/ZIP/notes stay optional",
    () => {
      for (const changes of [
        { fullName: "" },
        { phone: "" },
        { shippingAddress: { countryId: "country", stateId: "" } },
        { shippingAddress: { countryId: "", stateId: "state" } },
      ])
        assert.equal(schema.safeParse({ ...valid, ...changes }).success, false);
      assert.equal(
        schema.safeParse({
          ...valid,
          description: null,
          shippingAddress: {
            ...valid.shippingAddress,
            cityId: "",
            street: "",
            zipCode: "",
          },
        }).success,
        true,
      );
    },
  );
  check(
    "root defaults clone products, populated accounts and nested geography without changing cached data",
    () => {
      const original = {
        ...valid,
        phone: "+966-555123456",
        products: supplies,
        user: { id: "owner", balance: 0 },
        shippingAddress: {
          ...valid.shippingAddress,
          state: { id: "state", name: { en: "State" } },
        },
      };
      const value = model.default(original);
      value.products[0].price = 1;
      value.shippingAddress.state.name.en = "Changed";
      assert.equal(supplies[0].price, 40);
      assert.equal(original.shippingAddress.state.name.en, "State");
      assert.equal(value.id, "request-1");
      assert.equal(model.default().type, "bags");
      assert.equal(model.default().status, "pending");
    },
  );
  check(
    "legacy phone serialization round-trips and save omits entity/populate/address metadata",
    () => {
      const value = utils.toPackageRequestFormValues(
        model.default({
          ...valid,
          phone: "+966-555123456",
          userId: "other",
          user: { id: "other" },
          products: supplies,
          shippingAddress: {
            ...valid.shippingAddress,
            country: { id: "country" },
            state: { id: "state" },
            cityId: "",
            street: "",
            zipCode: "123",
          },
        }),
      );
      assert.equal(value.phoneCountry, "+966");
      assert.equal(value.phone, "555123456");
      const saved = utils.packageRequestSaveValues(value, 60);
      assert.equal(saved.phone, "+966-555123456");
      assert.equal(saved.amount, 60);
      assert.deepEqual(JSON.parse(JSON.stringify(saved.shippingAddress)), {
        countryId: "country",
        stateId: "state",
        zipCode: "123",
      });
      for (const key of [
        "id",
        "type",
        "status",
        "userId",
        "user",
        "products",
        "phoneCountry",
      ])
        assert.equal(saved[key], undefined);
    },
  );
  check(
    "status helpers preserve backend enum values and support localized product labels",
    () => {
      assert.equal(utils.packageRequestStatus.accepted, "approved");
      assert.equal(utils.toPackageRequestStatusTitle("approved"), "ACCEPTED");
      assert.equal(utils.toPackageRequestStatusColor("rejected"), "bg-red-600");
      assert.equal(
        utils.packagingSuppliesLabel(supplies),
        "Bags (50), Stickers (100)",
      );
    },
  );
  check(
    "pending review requires staff with both view and update grants",
    () => {
      const staff = {
        role: "employee",
        features: [
          { feature: "package-requests", accessView: true, accessUpdate: true },
        ],
      };
      assert.equal(utils.canReviewPackageRequest(staff, "pending"), true);
      for (const status of ["approved", "rejected"])
        assert.equal(utils.canReviewPackageRequest(staff, status), false);
      assert.equal(
        utils.canReviewPackageRequest({ role: "user" }, "pending"),
        false,
      );
      assert.equal(
        utils.canReviewPackageRequest(
          {
            ...staff,
            features: [
              {
                feature: "package-requests",
                accessView: false,
                accessUpdate: true,
              },
            ],
          },
          "pending",
        ),
        false,
      );
    },
  );
  const slice = load(base + "store/packageRequestsSlice.js", {
    "@reduxjs/toolkit": toolkit,
    "app/store/lazyLoadedSlices": { rootReducer: toolkit.combineSlices() },
  });
  check(
    "JavaScript slice initializes account/reviewer scope and resets page for every active filter",
    () => {
      let state = slice.default(
        undefined,
        slice.newPackageRequestsInstance({
          userIdFilter: "owner",
          updatedByIdFilter: "reviewer",
        }),
      );
      assert.equal(state.pageSize, 10);
      assert.equal(state.userIdFilter, "owner");
      assert.equal(state.updatedByIdFilter, "reviewer");
      for (const [key, value] of [
        ["SearchText", "A & B"],
        ["UserIdFilter", "other"],
        ["UpdatedByIdFilter", "staff"],
        ["StatusFilter", "approved"],
        ["DateFromFilter", new Date("2026-10-01")],
        ["DateToFilter", new Date("2026-10-23")],
      ]) {
        state = slice.default(state, slice.setPackageRequestsPage(3));
        state = slice.default(state, slice["setPackageRequests" + key](value));
        assert.equal(state.page, 0);
      }
      assert.equal(state.dateFromFilter, "2026-10-01T00:00:00.000Z");
    },
  );
  const client = axios.create({ baseURL: "https://packaging.test" }),
    mock = new MockAdapter(client);
  const api = createApi({
    reducerPath: "packagingTest",
    keepUnusedDataFor: 0,
    endpoints: () => ({}),
    baseQuery: async (request) => {
      try {
        return { data: (await client.request(request)).data ?? null };
      } catch (e) {
        return {
          error: {
            status: e.response?.status || "NETWORK_ERROR",
            data: e.response?.data,
          },
        };
      }
    },
  });
  const module = load(base + "PackageRequestsApi.ts", {
    "app/store/apiService": { apiService: api },
  }).default;
  const store = configureStore({
      reducer: { [api.reducerPath]: api.reducer },
      middleware: (get) => get().concat(api.middleware),
    }),
    subscriptions = [];
  function request(name, arg) {
    const response = store.dispatch(module.endpoints[name].initiate(arg));
    subscriptions.push(response);
    return response.unwrap();
  }
  try {
    await checkAsync(
      "list and export keep bags type, structured search and account/reviewer/date/status scopes",
      async () => {
        mock.onGet("v1/requests").reply((config) => {
          assert.deepEqual(config.params, {
            page: 2,
            pageSize: 10,
            type: "bags",
            search: "A & B",
            status: "pending",
            userId: "owner",
            updatedById: "staff",
            dateFrom: "2026-10-01",
            dateTo: "2026-10-23",
          });
          return [
            200,
            { results: [{ ...valid, products: supplies }], total: 21 },
          ];
        });
        const data = await request("getPackageRequests", {
          page: 2,
          pageSize: 10,
          searchText: "A & B",
          statusFilter: "pending",
          userIdFilter: "owner",
          updatedByIdFilter: "staff",
          dateFromFilter: "2026-10-01",
          dateToFilter: "2026-10-23",
        });
        assert.equal(data.total, 21);
        assert.equal(data.results[0].products[0].count, 50);
      },
    );
    await checkAsync(
      "all-scope list omits empty and all sentinels",
      async () => {
        mock.onGet("v1/requests").reply((config) => {
          assert.deepEqual(config.params, {
            page: 0,
            pageSize: 10,
            type: "bags",
          });
          return [200, { results: [], total: 0 }];
        });
        await request("getPackageRequests", {
          page: 0,
          pageSize: 10,
          statusFilter: "all",
          userIdFilter: "all",
          updatedByIdFilter: "all",
        });
      },
    );
    await checkAsync(
      "read-only supply catalog retains original v1/products page zero and fifty-item contract",
      async () => {
        mock.onGet("v1/products").reply((config) => {
          assert.deepEqual(config.params, { page: 0, pageSize: 50 });
          return [200, { results: supplies, total: 2 }];
        });
        assert.equal(
          (await request("getPackagingSupplies")).results[0].price,
          40,
        );
      },
    );
    await checkAsync(
      "account fallback keeps actual wallet balance including zero; detail preserves historical product snapshots",
      async () => {
        mock.onGet("v1/users/owner").reply(200, { id: "owner", balance: 0 });
        assert.equal(
          (await request("getPackageRequestsUser", "owner")).balance,
          0,
        );
        mock
          .onGet("v1/requests/request-1")
          .reply(200, {
            ...valid,
            products: [
              { id: "retired", name: "Historical", count: 10, price: 15 },
            ],
          });
        assert.equal(
          (await request("getPackageRequest", "request-1")).products[0].id,
          "retired",
        );
      },
    );
    await checkAsync(
      "create forces bags/pending and sends current owner plus editable delivery and supply fields only",
      async () => {
        mock.onGet("v1/requests").reply(200, { results: [], total: 0 });
        mock.onPost("v1/requests").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), {
            productIds: ["supply-1"],
            amount: 40,
            fullName: "Receiver",
            phone: "+966-555123456",
            shippingAddress: { countryId: "country", stateId: "state" },
            userId: "owner",
            type: "bags",
            status: "pending",
          });
          return [200, { id: "created" }];
        });
        const payload = utils.packageRequestSaveValues(valid, 40);
        assert.equal(
          (
            await request("createPackageRequest", {
              ...payload,
              userId: "owner",
              status: "approved",
              type: "other",
              id: "injected",
              products: supplies,
              phoneCountry: "+1",
            })
          ).id,
          "created",
        );
      },
    );
    await checkAsync(
      "review PATCH targets exact selected ID and sends status only",
      async () => {
        mock.onPatch("v1/requests/request-1").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), { status: "approved" });
          return [200, { ...valid, status: "approved" }];
        });
        await request("setPackageRequestStatus", {
          id: "request-1",
          userId: "owner",
          status: "approved",
          amount: 1,
          reference: "not editable",
        });
        mock.onPatch("v1/requests/request-2").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), { status: "rejected" });
          return [200, { id: "request-2" }];
        });
        await request("setPackageRequestStatus", {
          id: "request-2",
          status: "rejected",
        });
      },
    );
    await checkAsync(
      "filtered export keeps legacy 500000 page size and list filters",
      async () => {
        mock.onGet("v1/requests").reply((config) => {
          assert.deepEqual(config.params, {
            page: 0,
            pageSize: 500000,
            type: "bags",
            status: "approved",
            userId: "owner",
            updatedById: "staff",
          });
          return [200, { results: [], total: 0 }];
        });
        await request("getPackageRequests", {
          page: 0,
          pageSize: 500000,
          statusFilter: "approved",
          userIdFilter: "owner",
          updatedByIdFilter: "staff",
        });
      },
    );
    await checkAsync(
      "failed create and review reject without hidden deletes or alternative mutations",
      async () => {
        mock.onGet("v1/requests").reply(200, { results: [], total: 0 });
        mock.onPost("v1/requests").reply(500, { message: "failed" });
        mock.onPatch("v1/requests/failed").reply(500, { message: "failed" });
        await assert.rejects(
          request("createPackageRequest", {
            ...utils.packageRequestSaveValues(valid, 40),
            userId: "owner",
          }),
        );
        await assert.rejects(
          request("setPackageRequestStatus", {
            id: "failed",
            status: "approved",
          }),
        );
        assert.equal(mock.history.delete.length, 0);
      },
    );
    check(
      "cache tags isolate matching request and wallet account while refreshing list",
      () => {
        assert.ok(
          api.util
            .selectInvalidatedBy(store.getState(), [
              { type: "PackageRequestsUser", id: "owner" },
            ])
            .some((x) => x.endpointName === "getPackageRequestsUser"),
        );
        assert.equal(
          api.util.selectInvalidatedBy(store.getState(), [
            { type: "PackageRequestsUser", id: "other" },
          ]).length,
          0,
        );
        assert.ok(
          api.util
            .selectInvalidatedBy(store.getState(), [
              { type: "PackageRequest", id: "request-1" },
            ])
            .some((x) => x.endpointName === "getPackageRequest"),
        );
      },
    );
  } finally {
    subscriptions.forEach((x) => x.unsubscribe?.());
    store.dispatch(api.util.resetApiState());
    mock.restore();
  }
  check(
    "carrier packaging summary links point at the migrated list route",
    () => {
      const carrier = load("src/app/main/shipping-companies-app/Utils.ts");
      const link = carrier.shippingCompanySummaryLinks.find(
        (x) => x.title === "PACKAGE_REQUESTS",
      );
      assert.equal(link.available, true);
      assert.equal(link.path("carrier"), "/package-requests/all");
    },
  );
  console.log(`${passed}/${passed} packaging regression checks passed.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
