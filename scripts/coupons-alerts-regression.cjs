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
const couponsPath = "src/app/main/coupons-app/",
  alertsPath = "src/app/main/alerts-app/";
const couponUtils = load(couponsPath + "Utils.ts"),
  alertUtils = load(alertsPath + "Utils.ts");
const couponModel = load(couponsPath + "models/CouponModel.ts", {
  "@lodash": lodash,
  "../Utils": couponUtils,
});
const alertModel = load(alertsPath + "models/AlertModel.ts", {
  "@lodash": lodash,
  "../Utils": alertUtils,
});
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (key) => key },
  validator: require(path.join(target, "node_modules/validator")),
});
const couponSchema = load(couponsPath + "models/CouponSchema.ts", {
  "src/app/main/utils/validations": validations,
  "../Utils": couponUtils,
}).couponSchema((key) => key);
const alertSchema = load(alertsPath + "models/AlertSchema.ts", {
  "src/app/main/utils/validations": validations,
  "../Utils": alertUtils,
}).alertSchema((key) => key);
const plain = (value) => JSON.parse(JSON.stringify(value));
const validCoupon = {
  id: "coupon-1",
  code: "SAVE",
  type: "fixed",
  value: 10,
  maxUsageCount: 5,
  expiresAt: null,
};
const validAlert = {
  id: "alert-1",
  type: "normal",
  viewType: "popup",
  title: "Hello",
  content: "Announcement",
  imageUrl: "",
};
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
function fixture() {
  const client = axios.create({ baseURL: "https://management.test" }),
    mock = new MockAdapter(client);
  const api = createApi({
    reducerPath: "managementTest",
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
  const coupons = load(couponsPath + "CouponsApi.ts", {
    "app/store/apiService": { apiService: api },
    lodash,
    "./models/CouponModel": couponModel,
  }).default;
  const alerts = load(alertsPath + "AlertsApi.ts", {
    "app/store/apiService": { apiService: api },
    lodash,
    "./models/AlertModel": alertModel,
  }).default;
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (get) => get().concat(api.middleware),
  });
  return {
    mock,
    api,
    coupons,
    alerts,
    store,
    close() {
      store.dispatch(api.util.resetApiState());
      mock.restore();
    },
  };
}
function testSlice(folder, plural) {
  const toolkit = require(path.join(target, "node_modules/@reduxjs/toolkit"));
  const rootReducer = toolkit.combineSlices();
  const module = load(
    `src/app/main/${folder}/store/${plural.toLowerCase()}Slice.js`,
    {
      "@reduxjs/toolkit": toolkit,
      "app/store/lazyLoadedSlices": { rootReducer },
    },
  );
  const reducer = module.default;
  let state = reducer(undefined, { type: "@@init" });
  state = reducer(state, module["set" + plural + "Page"](3));
  state = reducer(
    state,
    module["set" + plural + "SearchText"]({ target: { value: "A&B" } }),
  );
  assert.equal(state.page, 0);
  assert.equal(state.searchText, "A&B");
  state = reducer(state, module["set" + plural + "Page"](2));
  state = reducer(
    state,
    module["set" + plural + "DateFromFilter"](new Date("2026-01-01T00:00:00Z")),
  );
  assert.equal(state.page, 0);
  assert.equal(state.dateFromFilter, "2026-01-01T00:00:00.000Z");
  state = reducer(
    state,
    module["new" + plural + "Instance"]({
      shippingCompanyIdFilter: "carrier-1",
      userIdFilter: "merchant-1",
    }),
  );
  assert.equal(state.userIdFilter, "merchant-1");
  if (plural === "Coupons")
    assert.equal(state.shippingCompanyIdFilter, "carrier-1");
}
async function main() {
  check("coupon defaults keep optional expiry and use the fixed enum", () => {
    const defaults = couponModel.default();
    assert.equal(defaults.type, "fixed");
    assert.equal(defaults.expiresAt, null);
    assert.equal(defaults.shippingCompanyId, "all");
    assert.equal(couponUtils.toCouponTypeTitle("percentage"), "PERCENTAGE");
  });
  check("coupon code, numeric value and usage limit are required", () => {
    assert.equal(couponSchema.safeParse(validCoupon).success, true);
    for (const changes of [
      { code: "A" },
      { code: "" },
      { value: undefined },
      { maxUsageCount: undefined },
      { type: "other" },
    ])
      assert.equal(
        couponSchema.safeParse({ ...validCoupon, ...changes }).success,
        false,
      );
    assert.equal(
      couponSchema.safeParse({ ...validCoupon, value: 0, maxUsageCount: 0 })
        .success,
      true,
    );
  });
  check(
    "coupon expiry accepts absent/null/future values and rejects expired/invalid dates",
    () => {
      for (const expiresAt of [
        undefined,
        null,
        "",
        new Date(Date.now() + 86400000).toISOString(),
      ])
        assert.equal(
          couponSchema.safeParse({ ...validCoupon, expiresAt }).success,
          true,
        );
      for (const expiresAt of ["bad-date", "2020-01-01T00:00:00.000Z"])
        assert.equal(
          couponSchema.safeParse({ ...validCoupon, expiresAt }).success,
          false,
        );
    },
  );
  check(
    "all-carrier coupons preserve the legacy omission without mutating form data",
    () => {
      const form = { ...validCoupon, shippingCompanyId: "all" };
      assert.equal(
        couponUtils.toCouponSaveValues(form).shippingCompanyId,
        undefined,
      );
      assert.equal(form.shippingCompanyId, "all");
      assert.equal(
        couponUtils.toCouponSaveValues({
          ...form,
          shippingCompanyId: "carrier-1",
        }).shippingCompanyId,
        "carrier-1",
      );
    },
  );
  check("coupon paths retain both carrier and merchant query scopes", () => {
    assert.equal(
      couponUtils.couponsPath("carrier-1", "merchant-1"),
      "/coupons/carrier-1/merchant-1",
    );
    assert.equal(couponUtils.couponsPath(), "/coupons/all/all");
  });
  check(
    "normal alerts require title/content while popup images are optional",
    () => {
      assert.equal(alertSchema.safeParse(validAlert).success, true);
      for (const field of ["title", "content"])
        assert.equal(
          alertSchema.safeParse({ ...validAlert, [field]: "" }).success,
          false,
        );
      assert.equal(
        alertSchema.safeParse({ ...validAlert, viewType: "alert" }).success,
        true,
      );
    },
  );
  check("image-only alerts require an image and popup display", () => {
    const image = {
      ...validAlert,
      type: "onlyImage",
      title: "",
      content: "",
      imageUrl: "https://images.test/a.png",
    };
    assert.equal(alertSchema.safeParse(image).success, true);
    assert.equal(
      alertSchema.safeParse({ ...image, imageUrl: "" }).success,
      false,
    );
    assert.equal(
      alertSchema.safeParse({ ...image, viewType: "alert" }).success,
      false,
    );
    assert.equal(
      alertSchema.safeParse({ ...image, type: "unknown" }).success,
      false,
    );
  });
  check(
    "alert payload drops inactive text/image fields and preserves drafts",
    () => {
      const form = {
        ...validAlert,
        type: "onlyImage",
        title: "Retain draft",
        imageUrl: "https://images.test/a.png",
      };
      assert.deepEqual(plain(alertUtils.toAlertSaveValues(form)), {
        id: "alert-1",
        type: "onlyImage",
        viewType: "popup",
        imageUrl: "https://images.test/a.png",
      });
      assert.equal(form.title, "Retain draft");
      assert.equal(
        "imageUrl" in
          alertUtils.toAlertSaveValues({
            ...validAlert,
            viewType: "alert",
            imageUrl: "draft.png",
          }),
        false,
      );
    },
  );
  check("alert defaults and enum title/color helpers match the source", () => {
    assert.equal(alertModel.default().viewType, "popup");
    assert.equal(alertUtils.toAlertTypeTitle("onlyImage"), "ONLY_IMAGE");
    assert.equal(alertUtils.toAlertTypeColor("onlyImage"), "bg-purple-500");
    assert.equal(alertUtils.toAlertViewTypeTitle("alert"), "ALERT");
  });
  check("coupon slice resets pagination and preserves route/date filters", () =>
    testSlice("coupons-app", "Coupons"),
  );
  check("alert slice resets pagination and serializes date filters", () =>
    testSlice("alerts-app", "Alerts"),
  );
  await checkAsync(
    "coupon lists preserve carrier/user/date scopes and encoded search",
    async () => {
      const f = fixture();
      try {
        f.mock.onGet("v1/coupons").reply((config) => {
          assert.deepEqual(plain(config.params), {
            page: 2,
            pageSize: 10,
            search: "A&B",
            shippingCompanyId: "carrier-1",
            userId: "merchant-1",
            dateFrom: "2026-01-01",
            dateTo: "2026-02-01",
          });
          return [200, { results: [validCoupon], total: 21 }];
        });
        const data = await f.store
          .dispatch(
            f.coupons.endpoints.getCoupons.initiate({
              page: 2,
              pageSize: 10,
              searchText: "A&B",
              shippingCompanyIdFilter: "carrier-1",
              userIdFilter: "merchant-1",
              dateFromFilter: "2026-01-01",
              dateToFilter: "2026-02-01",
            }),
          )
          .unwrap();
        assert.equal(data.total, 21);
      } finally {
        f.close();
      }
    },
  );
  await checkAsync(
    "all-scope sentinels are omitted from API filters",
    async () => {
      const f = fixture();
      try {
        f.mock.onGet().reply((config) => {
          assert(!("shippingCompanyId" in config.params));
          assert(!("userId" in config.params));
          return [200, { results: [], total: 0 }];
        });
        await f.store
          .dispatch(
            f.coupons.endpoints.getCoupons.initiate({
              page: 0,
              pageSize: 10,
              shippingCompanyIdFilter: "all",
              userIdFilter: "all",
            }),
          )
          .unwrap();
      } finally {
        f.close();
      }
    },
  );
  await checkAsync(
    "coupon creation sends editable values, not counts or populates",
    async () => {
      const f = fixture();
      try {
        f.mock.onPost("v1/coupons").reply((config) => {
          const data = JSON.parse(config.data);
          assert.deepEqual(Object.keys(data).sort(), [
            "code",
            "expiresAt",
            "maxUsageCount",
            "type",
            "value",
          ]);
          return [201, { ...data, id: "new-coupon" }];
        });
        await f.store
          .dispatch(
            f.coupons.endpoints.createCoupon.initiate(
              couponUtils.toCouponSaveValues({
                ...validCoupon,
                shippingCompanyId: "all",
                shippingCompany: { id: "carrier-1" },
                usageCount: 9,
                createdAt: "date",
              }),
            ),
          )
          .unwrap();
      } finally {
        f.close();
      }
    },
  );
  await checkAsync(
    "coupon activation PATCH contains only isActive",
    async () => {
      const f = fixture();
      try {
        f.mock.onPatch("v1/coupons/coupon-1").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), { isActive: false });
          return [200, { ...validCoupon, isActive: false }];
        });
        await f.store
          .dispatch(
            f.coupons.endpoints.updateCoupon.initiate({
              id: "coupon-1",
              isActive: false,
            }),
          )
          .unwrap();
      } finally {
        f.close();
      }
    },
  );
  await checkAsync(
    "alert list preserves pagination, date and search filters",
    async () => {
      const f = fixture();
      try {
        f.mock.onGet("v1/alerts").reply((config) => {
          assert.deepEqual(plain(config.params), {
            page: 1,
            pageSize: 10,
            search: "A&B",
            dateFrom: "2026-01-01",
            dateTo: "2026-02-01",
          });
          return [200, { results: [validAlert], total: 11 }];
        });
        await f.store
          .dispatch(
            f.alerts.endpoints.getAlerts.initiate({
              page: 1,
              pageSize: 10,
              searchText: "A&B",
              dateFromFilter: "2026-01-01",
              dateToFilter: "2026-02-01",
            }),
          )
          .unwrap();
      } finally {
        f.close();
      }
    },
  );
  await checkAsync(
    "image alert creation omits stale normal-text fields and metadata",
    async () => {
      const f = fixture();
      try {
        f.mock.onPost("v1/alerts").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), {
            type: "onlyImage",
            viewType: "popup",
            imageUrl: "https://images.test/a.png",
          });
          return [201, { id: "new-alert" }];
        });
        await f.store
          .dispatch(
            f.alerts.endpoints.createAlert.initiate(
              alertUtils.toAlertSaveValues({
                ...validAlert,
                type: "onlyImage",
                imageUrl: "https://images.test/a.png",
                createdAt: "date",
              }),
            ),
          )
          .unwrap();
      } finally {
        f.close();
      }
    },
  );
  await checkAsync(
    "alert updates and deletion retain versioned entity endpoints",
    async () => {
      const f = fixture();
      try {
        f.mock.onPatch("v1/alerts/alert-1").reply((config) => {
          assert.equal(JSON.parse(config.data).id, undefined);
          return [200, validAlert];
        });
        f.mock.onDelete("v1/alerts/alert-1").reply(204);
        await f.store
          .dispatch(
            f.alerts.endpoints.updateAlert.initiate(
              alertUtils.toAlertSaveValues(validAlert),
            ),
          )
          .unwrap();
        await f.store
          .dispatch(f.alerts.endpoints.removeAlert.initiate("alert-1"))
          .unwrap();
      } finally {
        f.close();
      }
    },
  );
  await checkAsync(
    "list and detail queries refetch after coupon activation",
    async () => {
      const f = fixture();
      try {
        let listReads = 0,
          detailReads = 0;
        f.mock
          .onGet("v1/coupons")
          .reply(() => [200, { results: [validCoupon], total: ++listReads }]);
        f.mock.onGet("v1/coupons/coupon-1").reply(() => {
          detailReads++;
          return [200, validCoupon];
        });
        f.mock.onPatch().reply(200, validCoupon);
        await f.store
          .dispatch(
            f.coupons.endpoints.getCoupons.initiate({ page: 0, pageSize: 10 }),
          )
          .unwrap();
        await f.store
          .dispatch(f.coupons.endpoints.getCoupon.initiate("coupon-1"))
          .unwrap();
        await f.store
          .dispatch(
            f.coupons.endpoints.updateCoupon.initiate({
              id: "coupon-1",
              isActive: false,
            }),
          )
          .unwrap();
        for (let i = 0; i < 50 && (listReads < 2 || detailReads < 2); i++)
          await new Promise((resolve) => setTimeout(resolve, 10));
        assert(listReads >= 2 && detailReads >= 2);
      } finally {
        f.close();
      }
    },
  );
  await checkAsync(
    "write and delete failures reject without hidden dependent writes",
    async () => {
      const f = fixture();
      try {
        f.mock.onPatch().reply(500, { message: "failed" });
        f.mock.onDelete().reply(500, { message: "failed" });
        await assert.rejects(
          f.store
            .dispatch(f.coupons.endpoints.updateCoupon.initiate(validCoupon))
            .unwrap(),
        );
        await assert.rejects(
          f.store
            .dispatch(f.alerts.endpoints.removeAlert.initiate("alert-1"))
            .unwrap(),
        );
        assert.equal(f.mock.history.post.length, 0);
      } finally {
        f.close();
      }
    },
  );
  check(
    "migration inventory accounts for every routed feature and partial home honestly",
    () => {
      const ledger = JSON.parse(
        fs.readFileSync(path.join(target, "migration-status.json"), "utf8"),
      );
      assert.equal(ledger.features.length, 32);
      assert.equal(new Set(ledger.features.map((row) => row.feature)).size, 32);
      assert.equal(ledger.counts.featureAreas, ledger.features.length);
      for (const status of ["migrated", "partial", "pending"])
        assert.equal(
          ledger.features.filter((row) => row.status === status).length,
          ledger.counts[status],
        );
      assert.equal(
        ledger.counts.migrated + ledger.counts.partial + ledger.counts.pending,
        ledger.counts.featureAreas,
      );
      for (const feature of ledger.completedThisBatch)
        assert.equal(
          ledger.features.find((row) => row.feature === feature)?.status,
          "migrated",
        );
      assert.equal(
        ledger.features.find((row) => row.feature === "home-app").status,
        "partial",
      );
      assert.ok(
        ledger.features.some((row) => row.feature === "package-requests-app"),
      );
      assert.ok(
        ledger.retainedRequirement.includes("Keep package-requests-app"),
      );
      assert(ledger.excludedByUser.includes("Salla"));
      const routeSource = fs.readFileSync(
        path.join(target, "src/app/configs/routesConfig.tsx"),
        "utf8",
      );
      for (const row of ledger.features.filter(
        (row) => row.status === "migrated",
      ))
        assert(routeSource.includes("../main/" + row.feature + "/"));
      assert.equal(
        ledger.features.some((row) => row.feature === "products-app"),
        false,
      );
    },
  );
  console.log(`Coupons/alerts regression: ${passed} checks passed.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
