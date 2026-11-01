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
const plansPath = "src/app/main/plans-app/";
const adminsPath = "src/app/main/admins-app/";
const planUtils = load(plansPath + "Utils.ts");
const planModel = load(plansPath + "models/PlanModel.ts", {
  "@lodash": lodash,
  "../Utils": planUtils,
});
const adminUtils = load(adminsPath + "Utils.ts");
const adminModel = load(adminsPath + "models/AdminModel.ts", {
  "@lodash": lodash,
  "../Utils": adminUtils,
});
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (key) => key },
  validator: require(path.join(target, "node_modules/validator")),
});
const planSchema = load(plansPath + "models/PlanSchema.ts", {
  "src/app/main/utils/validations": validations,
  "../Utils": planUtils,
}).planSchema((key) => key);
const adminSchema = load(adminsPath + "models/AdminSchema.ts", {
  "src/app/main/utils/validations": validations,
  "../Utils": adminUtils,
}).adminSchema;
const plain = (value) => JSON.parse(JSON.stringify(value));
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
const validPlan = {
  id: "plan-1",
  name: "Starter",
  price: 100,
  status: planUtils.planStatus.active,
  features: ["Support"],
  prices: [],
};
const validFeature = {
  id: "grant-1",
  feature: "plans",
  accessView: true,
  accessCreate: false,
  accessUpdate: false,
  accessDelete: false,
};
const validAdmin = {
  id: "staff-1",
  role: "employee",
  features: [validFeature],
};
function fixture() {
  const client = axios.create({ baseURL: "https://foundation.test" }),
    mock = new MockAdapter(client);
  const api = createApi({
    reducerPath: "foundationsTest",
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
  const plans = load(plansPath + "PlansApi.ts", {
    "app/store/apiService": { apiService: api },
    lodash,
    "./models/PlanModel": planModel,
  }).default;
  const admins = load(adminsPath + "AdminsApi.ts", {
    "app/store/apiService": { apiService: api },
    lodash,
    "./models/AdminModel": adminModel,
  }).default;
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (get) => get().concat(api.middleware),
  });
  return {
    client,
    mock,
    api,
    plans,
    admins,
    store,
    close() {
      store.dispatch(api.util.resetApiState());
      mock.restore();
    },
  };
}
async function main() {
  check("plan defaults and enum titles", () => {
    assert.equal(planModel.default({}).status, "active");
    assert.equal(planUtils.toPlanStatusTitle("disabled"), "DISABLED");
    assert.equal(planUtils.toPlanStatusColor("active"), "green");
  });
  check(
    "plan name, positive price and at least one feature are required",
    () => {
      assert.equal(planSchema.safeParse(validPlan).success, true);
      for (const changes of [
        { name: "A" },
        { price: 0 },
        { price: -1 },
        { features: [] },
        { status: "unknown" },
      ])
        assert.equal(
          planSchema.safeParse({ ...validPlan, ...changes }).success,
          false,
        );
    },
  );
  check("optional prices, zero return fee and stored IDs validate", () => {
    const value = {
      ...validPlan,
      prices: [
        {
          id: "price-1",
          shippingCompanyId: "carrier-2",
          active: true,
          localPrice: null,
          codPrice: null,
          returnFees: 0,
        },
      ],
    };
    const parsed = planSchema.parse(value);
    assert.equal(parsed.prices[0].id, "price-1");
    assert.equal(parsed.prices[0].returnFees, 0);
    assert.equal(
      planSchema.safeParse({
        ...value,
        prices: [{ ...value.prices[0], localPrice: 0 }],
      }).success,
      false,
    );
  });
  check(
    "saved carrier prices retain form metadata and match by reference ID",
    () => {
      const form = planUtils.toPlanFormValues({
        ...validPlan,
        prices: [
          { id: "price-b", shippingCompanyId: "b", localPrice: 17 },
          { _id: "price-a", shippingCompanyId: "a", codPrice: 5 },
        ],
      });
      assert.deepEqual(
        plain(form.prices.map((row) => [row.shippingCompanyId, row.active])),
        [
          ["b", true],
          ["a", true],
        ],
      );
      assert.deepEqual(plain(form.prices.map((row) => row.id || row._id)), [
        "price-b",
        "price-a",
      ]);
      assert.deepEqual(
        plain(
          planUtils
            .toPlanSaveValues(form)
            .prices.map((row) => row.shippingCompanyId),
        ),
        ["b", "a"],
      );
      assert(
        planUtils
          .toPlanSaveValues(form)
          .prices.every((row) => !("id" in row) && !("_id" in row)),
      );
    },
  );
  check(
    "price payload omits inactive rows, UI flags and populates, keeps zero returns",
    () => {
      const values = {
        ...validPlan,
        description: "",
        prices: [
          {
            shippingCompanyId: "a",
            active: true,
            localPrice: 12,
            codPrice: null,
            returnFees: 0,
            shippingCompany: { id: "a", name: "Carrier" },
          },
          { shippingCompanyId: "b", active: false, localPrice: 20 },
          { shippingCompanyId: "c", active: true, localPrice: null },
        ],
      };
      const saved = plain(planUtils.toPlanSaveValues(values));
      assert.deepEqual(saved.prices, [
        { shippingCompanyId: "a", localPrice: 12, returnFees: 0 },
      ]);
      assert.equal("description" in saved, false);
    },
  );
  check("international price values survive editing and serialization", () => {
    const value = planUtils.toPlanFormValues({
      ...validPlan,
      prices: [{ shippingCompanyId: "a", internationalDiscountRate: 10 }],
    });
    assert.equal(
      planUtils.toPlanSaveValues(value).prices[0].internationalDiscountRate,
      10,
    );
  });
  check("admin defaults match source roles", () => {
    assert.equal(adminModel.default().role, "employee");
    const grants = adminUtils.toAdminRoleFeatures("admin");
    assert.equal(grants.length, Object.values(adminUtils.featureTypes).length);
    assert(
      grants.every(
        (row) =>
          row.accessView &&
          row.accessCreate &&
          row.accessUpdate &&
          row.accessDelete,
      ),
    );
  });
  check(
    "employee defaults preserve source feature and operation exclusions",
    () => {
      const grants = adminUtils.toAdminRoleFeatures("employee");
      for (const feature of [
        "verification-requests",
        "shipping-companies",
        "coupons",
        "plans",
        "admins",
        "applications",
      ])
        assert(!grants.some((row) => row.feature === feature));
      assert.equal(
        grants.find((row) => row.feature === "merchants").accessUpdate,
        false,
      );
      assert.deepEqual(
        plain(
          grants.filter((row) => row.accessDelete).map((row) => row.feature),
        ),
        ["shipments", "merchant-dues"],
      );
      assert(grants.some((row) => row.feature === "package-requests"));
    },
  );
  check(
    "permissions validate and retain unknown features and nested IDs",
    () => {
      const parsed = adminSchema.parse({
        ...validAdmin,
        features: [{ ...validFeature, feature: "future-feature" }],
      });
      assert.equal(parsed.features[0].id, "grant-1");
      assert.equal(parsed.features[0].feature, "future-feature");
    },
  );
  check(
    "write permissions require view access; empty and duplicate grants rejected",
    () => {
      for (const operation of ["accessCreate", "accessUpdate", "accessDelete"])
        assert.equal(
          adminSchema.safeParse({
            ...validAdmin,
            features: [
              { ...validFeature, accessView: false, [operation]: true },
            ],
          }).success,
          false,
        );
      assert.equal(
        adminSchema.safeParse({ ...validAdmin, features: [] }).success,
        false,
      );
      assert.equal(
        adminSchema.safeParse({
          ...validAdmin,
          features: [validFeature, validFeature],
        }).success,
        false,
      );
    },
  );
  check("removed feature IDs are absent from the permission catalog", () => {
    assert(
      !Object.values(adminUtils.featureTypes).some((value) =>
        /odoo|salla|product|comparison|compare-bill/i.test(value),
      ),
    );
  });
  check("staff audit routes enable only migrated owning features", () => {
    assert.equal(adminUtils.adminRelatedLinks.length, 6);
    assert(
      adminUtils.adminRelatedLinks
        .filter(
          (link) =>
            ![
              "shipments",
              "cancel-shipment-requests",
              "shipments",
              "cancel-shipment-requests",
              "verification-requests",
              "withdraw-requests",
              "bank-transfers",
              "transactions",
              "cod-transactions",
            ].includes(link.feature),
        )
        .every((link) => !link.available),
    );
    assert(!adminUtils.adminRelatedLinks.some(link => link.feature === "verification-requests"));
    assert.equal(
      adminUtils.adminRelatedLinks.find(
        (link) => link.feature === "bank-transfers",
      ).available,
      true,
    );
    for (const feature of ["transactions", "cod-transactions"]) {
      const link = adminUtils.adminRelatedLinks.find(
        (item) => item.feature === feature,
      );
      assert.equal(link.available, true);
      assert.ok(link.path("u1").includes("createdById=u1"));
    }

    assert.equal(
      adminUtils.adminRelatedLinks
        .find((link) => link.feature === "bank-transfers")
        .path("u1"),
      "/bank-transfers/all?updatedById=u1",
    );
    assert.equal(
      adminUtils.adminRelatedLinks[0].path("u1"),
      "/shipments/all/all?updatedById=u1",
    );
  });
  await checkAsync(
    "plan list preserves endpoint, pagination and encoded search",
    async () => {
      const f = fixture();
      try {
        f.mock.onGet("v1/payment-plans").reply((config) => {
          assert.equal(config.params.search, "A&B");
          assert.equal(config.params.page, 2);
          assert.equal(config.params.pageSize, 16);
          return [200, { results: [validPlan], total: 33 }];
        });
        const result = await f.store
          .dispatch(
            f.plans.endpoints.getPlans.initiate({
              page: 2,
              pageSize: 16,
              searchText: "A&B",
            }),
          )
          .unwrap();
        assert.equal(result.total, 33);
      } finally {
        f.close();
      }
    },
  );
  await checkAsync(
    "plan create only sends editable fields and no blank description",
    async () => {
      const f = fixture();
      try {
        f.mock.onPost("v1/payment-plans").reply((config) => {
          const body = JSON.parse(config.data);
          assert(!("id" in body));
          assert(!("createdAt" in body));
          assert(!("description" in body));
          return [201, { ...body, id: "new-plan" }];
        });
        const result = await f.store
          .dispatch(
            f.plans.endpoints.createPlan.initiate(
              planUtils.toPlanSaveValues({ ...validPlan, createdAt: "date" }),
            ),
          )
          .unwrap();
        assert.equal(result.id, "new-plan");
      } finally {
        f.close();
      }
    },
  );
  await checkAsync("plan status PATCH never sends unsaved fields", async () => {
    const f = fixture();
    try {
      f.mock.onPatch("v1/payment-plans/plan-1").reply((config) => {
        assert.deepEqual(JSON.parse(config.data), { status: "disabled" });
        return [200, { ...validPlan, status: "disabled" }];
      });
      await f.store
        .dispatch(
          f.plans.endpoints.updatePlan.initiate({
            id: "plan-1",
            status: "disabled",
          }),
        )
        .unwrap();
    } finally {
      f.close();
    }
  });
  await checkAsync(
    "staff query includes both repeated roles and no merchant query",
    async () => {
      const f = fixture();
      try {
        f.mock.onGet("v1/users?role=admin&role=employee").reply((config) => {
          assert.equal(config.params.pageSize, 10);
          assert.equal(config.params.search, "Staff & Co");
          return [200, { results: [validAdmin], total: 1 }];
        });
        await f.store
          .dispatch(
            f.admins.endpoints.getAdmins.initiate({
              page: 0,
              pageSize: 10,
              searchText: "Staff & Co",
            }),
          )
          .unwrap();
      } finally {
        f.close();
      }
    },
  );
  await checkAsync(
    "permission PATCH excludes identity and block fields",
    async () => {
      const f = fixture();
      try {
        f.mock.onPatch("v1/users/staff-1").reply((config) => {
          assert.deepEqual(Object.keys(JSON.parse(config.data)).sort(), [
            "features",
            "role",
          ]);
          assert.equal(JSON.parse(config.data).features[0].id, "grant-1");
          return [200, validAdmin];
        });
        await f.store
          .dispatch(
            f.admins.endpoints.updateAdmin.initiate({
              ...validAdmin,
              email: "do-not-change",
              isBlocked: true,
            }),
          )
          .unwrap();
      } finally {
        f.close();
      }
    },
  );
  await checkAsync(
    "block PATCH excludes role, features and identity",
    async () => {
      const f = fixture();
      try {
        f.mock.onPatch("v1/users/staff-1").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), { isBlocked: true });
          return [200, { ...validAdmin, isBlocked: true }];
        });
        await f.store
          .dispatch(
            f.admins.endpoints.setAdminBlocked.initiate({
              ...validAdmin,
              isBlocked: true,
            }),
          )
          .unwrap();
      } finally {
        f.close();
      }
    },
  );
  await checkAsync(
    "backend failure surfaces as rejected mutation for retry",
    async () => {
      const f = fixture();
      try {
        f.mock.onPatch().reply(500, { message: "Failed" });
        await assert.rejects(
          f.store
            .dispatch(
              f.plans.endpoints.updatePlan.initiate({
                id: "plan-1",
                status: "disabled",
              }),
            )
            .unwrap(),
        );
      } finally {
        f.close();
      }
    },
  );
  console.log(`Foundations regression: ${passed} checks passed.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
