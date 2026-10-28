const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const target = path.resolve(__dirname, "..");
const ts = require(path.join(target, "node_modules/typescript"));
const zod = require(path.join(target, "node_modules/zod"));
const { createApi } = require(
  path.join(target, "node_modules/@reduxjs/toolkit/query/react"),
);
const { configureStore } = require(
  path.join(target, "node_modules/@reduxjs/toolkit"),
);
function load(file, imports = {}, globals = {}) {
  const exports = {};
  const js = ts.transpileModule(
    fs
      .readFileSync(path.join(target, file), "utf8")
      .replace(/import\.meta\.env/g, "({})"),
    {
      fileName: file,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  vm.runInNewContext(
    js,
    {
      exports,
      Date,
      Number,
      URL,
      console,
      structuredClone,
      crypto: require("node:crypto").webcrypto,
      Blob,
      Uint8Array,
      ArrayBuffer,
      setTimeout,
      clearTimeout,
      require: (name) => {
        if (name in imports) return imports[name];
        if (name === "zod") return zod;
        if (name === "react/jsx-runtime")
          return require(path.join(target, "node_modules/react/jsx-runtime"));
        throw new Error("Unexpected import " + name);
      },
      ...globals,
    },
    { filename: file },
  );
  return exports;
}

const plain = (v) => JSON.parse(JSON.stringify(v));
const permissions = load("src/app/auth/permissions.ts");
const utils = load("src/app/main/affiliate-merchants-app/Utils.ts", {
  "src/app/auth/permissions": permissions,
});
const model = load(
  "src/app/main/affiliate-merchants-app/models/CustomerPricesModel.ts",
);
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (k) => k },
  validator: require(path.join(target, "node_modules/validator")),
});
const schema = load(
  "src/app/main/affiliate-merchants-app/models/CustomerPricesSchema.ts",
  { "../../utils/validations": validations },
).default((k) => k);
const withdrawals = load(
  "src/app/main/affiliate-withdraw-requests-app/Utils.ts",
  { "src/app/auth/permissions": permissions },
);
const viewer = {
    role: "employee",
    features: [
      { feature: "affiliate-merchants", accessView: true },
      { feature: "customers", accessView: true },
      { feature: "transactions", accessView: true },
      { feature: "withdraw-requests", accessView: true },
    ],
  },
  editor = {
    ...viewer,
    features: viewer.features.map((f) => ({ ...f, accessUpdate: true })),
  },
  self = { id: "affiliate", role: "user", isAffiliate: true };
const affiliate = {
    id: "affiliate",
    prices: [{ shippingCompanyId: "one", localPrice: 10, codPrice: 12 }],
  },
  customer = {
    id: "customer",
    referredById: "affiliate",
    prices: [
      {
        shippingCompanyId: "one",
        localPrice: 14,
        codPrice: 15,
        internationalDiscountRate: 5,
      },
      { shippingCompanyId: "missing", localPrice: 7 },
    ],
  },
  carriers = [
    {
      id: "one",
      name: "One",
      localPrice: 20,
      codPrice: 25,
      shippingMethods: ["local", "cashOnDelivery"],
    },
    { id: "two", name: "Two", localPrice: 8, shippingMethods: ["local"] },
  ];
let passed = 0;
async function check(name, run) {
  await run();
  passed++;
  console.log("PASS " + name);
}
async function main() {
  await check(
    "Affiliate tab/status enum titles and colors preserve source values",
    () => {
      assert.deepEqual(plain(utils.affiliateTransactionStatus), {
        pending: "pending",
        success: "success",
        rejected: "rejected",
      });
      for (const v of Object.values(utils.affiliateMerchantTabs))
        assert(utils.toAffiliateMerchantTabTitle(v));
      for (const v of Object.values(utils.affiliateTransactionStatus))
        assert(utils.toAffiliateTransactionStatusColor(v));
    },
  );
  await check("Nonaffiliates cannot open affiliate self service", () => {
    assert(utils.canViewAffiliates(self));
    assert(!utils.canViewAffiliates({ ...self, isAffiliate: false }));
  });
  await check("Directory requires the affiliate feature view grant", () => {
    assert(utils.canViewAffiliates(viewer));
    assert(
      !utils.canViewAffiliates({
        ...viewer,
        features: [{ feature: "merchants", accessView: true }],
      }),
    );
  });
  await check("Customer tab retains its distinct customers view grant", () => {
    assert(utils.canViewAffiliateCustomers(viewer));
    assert(
      !utils.canViewAffiliateCustomers({
        ...viewer,
        features: [
          viewer.features[0],
          { feature: "merchants", accessView: true },
        ],
      }),
    );
  });
  await check("Read only customer access cannot change prices", () => {
    assert(!utils.canEditCustomerPrices(viewer));
    assert(utils.canEditCustomerPrices(editor));
    assert(utils.canEditCustomerPrices(self));
  });
  await check(
    "Profit and withdrawal tabs retain distinct source grants",
    () => {
      assert(utils.canViewAffiliateTransactions(viewer));
      assert(utils.canViewAffiliateWithdrawals(viewer));
      assert(
        !utils.canViewAffiliateTransactions({
          ...viewer,
          features: [viewer.features[0]],
        }),
      );
    },
  );
  await check(
    "Embedded withdrawal permission context does not alias standalone page access",
    () => {
      assert(!withdrawals.canViewAffiliateWithdrawRequests(viewer));
      assert(
        withdrawals.canViewAffiliateWithdrawRequests(
          viewer,
          "withdraw-requests",
        ),
      );
      assert(
        !withdrawals.canReviewAffiliateWithdrawRequest(
          viewer,
          "pending",
          "withdraw-requests",
        ),
      );
      assert(
        withdrawals.canReviewAffiliateWithdrawRequest(
          editor,
          "pending",
          "withdraw-requests",
        ),
      );
      assert(
        !withdrawals.canReviewAffiliateWithdrawRequest(
          editor,
          "approved",
          "withdraw-requests",
        ),
      );
    },
  );
  await check(
    "Referral URL keeps current origin port and encodes affiliate code",
    () =>
      assert.equal(
        utils.referralLink("A /#", "http://localhost:3138"),
        "http://localhost:3138/affiliate/A%20%2F%23",
      ),
  );
  await check(
    "Customer base cost prefers affiliate price over carrier defaults",
    () => {
      const form = model.default(affiliate, customer, carriers);
      assert.equal(form.prices[0].mainLocalPrice, 10);
      assert.equal(form.prices[0].localProfits, 4);
      assert.equal(form.prices[0].codProfits, 3);
    },
  );
  await check("New carrier rows fall back to actual carrier costs", () => {
    const row = model.default(affiliate, customer, carriers).prices[1];
    assert.equal(row.mainLocalPrice, 8);
    assert.equal(row.localProfits, 0);
  });
  await check(
    "Missing lookup carriers and their stored prices are preserved",
    () => {
      const form = model.default(affiliate, customer, carriers),
        row = form.prices.find((x) => x.shippingCompanyId === "missing");
      assert(row.localEnabled);
      assert.equal(
        model
          .customerPricesPayload(form)
          .find((x) => x.shippingCompanyId === "missing").localPrice,
        7,
      );
    },
  );
  await check(
    "Zero markup is valid and negative markup fails validation",
    () => {
      const form = model.default(affiliate, customer, carriers);
      form.prices[0].localProfits = 0;
      assert(schema.safeParse(form).success);
      form.prices[0].localProfits = -1;
      assert(!schema.safeParse(form).success);
    },
  );
  await check(
    "Nonfinite markup and duplicate carrier rows fail validation",
    () => {
      const form = model.default(affiliate, customer, carriers);
      form.prices[0].localProfits = NaN;
      assert(!schema.safeParse(form).success);
      const clean = model.default(affiliate, customer, carriers);
      clean.prices.push(clean.prices[0]);
      assert(!schema.safeParse(clean).success);
    },
  );
  await check(
    "Price projection preserves noneditable international discount and strips form metadata",
    () => {
      const row = model.customerPricesPayload(
        model.default(affiliate, customer, carriers),
      )[0];
      assert.equal(row.internationalDiscountRate, 5);
      assert(!("mainLocalPrice" in row));
      assert(!("name" in row));
    },
  );
  await check(
    "Defaults are isolated from cached carrier and customer populations",
    () => {
      const copy = structuredClone(customer);
      const form = model.default(affiliate, copy, carriers);
      form.prices[0].localProfits = 100;
      assert.equal(copy.prices[0].localPrice, 14);
    },
  );
  const toolkit = require(path.join(target, "node_modules/@reduxjs/toolkit")),
    fakeCreateSlice = (opts) => {
      const s = toolkit.createSlice(opts);
      s.injectInto = () => ({ selectors: s.selectors });
      return s;
    },
    sliceImports = {
      "@reduxjs/toolkit": { createSlice: fakeCreateSlice },
      "app/store/lazyLoadedSlices": { rootReducer: {} },
    };
  const slice = load(
    "src/app/main/affiliate-merchants-app/store/affiliateMerchantsSlice.js",
    sliceImports,
  );
  await check(
    "Directory filter/search changes reset pagination independently",
    () => {
      let s = slice.default(undefined, slice.setAffiliateMerchantsPage(4));
      s = slice.default(
        s,
        slice.setAffiliateMerchantsSearchText({ target: { value: "A & #" } }),
      );
      assert.equal(s.page, 0);
      assert.equal(s.searchText, "A & #");
    },
  );
  await check("Invalid directory dates retain the prior valid bound", () => {
    let s = slice.default(
      undefined,
      slice.setAffiliateMerchantsDateFromFilter(new Date("2026-01-01")),
    );
    s = slice.default(
      s,
      slice.setAffiliateMerchantsDateFromFilter(new Date("bad")),
    );
    assert(s.dateFromInvalid);
    assert.equal(s.dateFromFilter, "2026-01-01T00:00:00.000Z");
  });
  const withdrawalSlice = load(
    "src/app/main/affiliate-withdraw-requests-app/store/affiliateWithdrawRequestsSlice.js",
    sliceImports,
  );
  await check(
    "Embedded withdrawal invalid dates retain valid bounds and expose blocking flag",
    () => {
      let s = withdrawalSlice.default(
        undefined,
        withdrawalSlice.setAffiliateWithdrawRequestsDateFromFilter(
          new Date("2026-01-01"),
        ),
      );
      s = withdrawalSlice.default(
        s,
        withdrawalSlice.setAffiliateWithdrawRequestsDateFromFilter(
          new Date("bad"),
        ),
      );
      assert(s.dateFromInvalid);
      assert.equal(s.dateFromFilter, "2026-01-01T00:00:00.000Z");
    },
  );
  let fail = false;
  const captured = [],
    api = createApi({
      reducerPath: "affiliatesTest",
      endpoints: () => ({}),
      keepUnusedDataFor: 0,
      baseQuery: async (req) => {
        captured.push(req);
        return fail
          ? { error: { status: 500, data: { message: "failed" } } }
          : {
              data: req.url.endsWith("summary")
                ? { users: 0, profits: 0 }
                : req.method
                  ? { id: "customer" }
                  : { results: [], total: 0 },
            };
      },
    });
  load("src/app/main/affiliate-merchants-app/AffiliateMerchantsApi.ts", {
    "app/store/apiService": { apiService: api },
  });
  const store = configureStore({
      reducer: { [api.reducerPath]: api.reducer },
      middleware: (g) => g().concat(api.middleware),
    }),
    handles = [];
  async function request(name, arg, keep = false) {
    const h = store.dispatch(
      api.endpoints[name].initiate(arg, { forceRefetch: true }),
    );
    handles.push(h);
    try {
      return await h.unwrap();
    } finally {
      if (!keep) h.unsubscribe?.();
    }
  }
  try {
    await check(
      "Affiliate directory fixes role and affiliate scopes for queries",
      async () => {
        await request("getAffiliateMerchants", {
          page: 1,
          pageSize: 10,
          searchText: "A & #",
          statusFilter: "false",
          typeFilter: "custom",
          hasStoreFilter: "true",
          balanceTypeFilter: "negative",
          verificationStatusFilter: "approved",
        });
        assert.deepEqual(plain(captured.at(-1).params), {
          role: "user",
          isAffiliate: true,
          page: 1,
          pageSize: 10,
          search: "A & #",
          active: "false",
          loyaltyType: "custom",
          hasStore: "true",
          balanceType: "negative",
          verificationStatus: "approved",
        });
      },
    );
    await check(
      "Directory export keeps 3000 limit and original COD sort precedence",
      async () => {
        await request("getAffiliateMerchants", {
          page: 0,
          pageSize: 3000,
          balanceSorting: "asc",
          codBalanceSorting: "desc",
        });
        assert.equal(captured.at(-1).params.pageSize, 3000);
        assert.equal(captured.at(-1).params.orderColumn, "codBalance");
        assert.equal(captured.at(-1).params.orderDirection, "desc");
      },
    );
    await check(
      "Summary POST carries only selected affiliate identity and preserves zero values",
      async () => {
        const result = await request("getAffiliateSummary", "affiliate");
        assert.equal(result.profits, 0);
        assert.deepEqual(plain(captured.at(-1).data), {
          affiliateId: "affiliate",
        });
      },
    );
    await check(
      "Customer cards use 16 rows and fixed referredById with encoded structured search",
      async () => {
        await request("getAffiliateCustomers", {
          affiliateId: "affiliate",
          page: 2,
          searchText: "A & #",
        });
        assert.deepEqual(plain(captured.at(-1).params), {
          page: 2,
          pageSize: 16,
          referredById: "affiliate",
          search: "A & #",
        });
      },
    );
    await check(
      "Customer pricing writes actual customer ID and authoritative affiliate stamp only",
      async () => {
        await request("updateAffiliateCustomerPrices", {
          customerId: "actual",
          affiliateId: "affiliate",
          prices: [
            {
              shippingCompanyId: "one",
              localPrice: 14,
              codPrice: 0,
              internationalDiscountRate: 5,
              role: "ignored",
            },
          ],
        });
        assert.equal(captured.at(-1).url, "v1/users/actual");
        assert.deepEqual(plain(captured.at(-1).data), {
          loyaltyType: "custom",
          prices: [
            {
              shippingCompanyId: "one",
              affiliateId: "affiliate",
              localPrice: 14,
              internationalDiscountRate: 5,
            },
          ],
        });
      },
    );
    await check(
      "Profit export keeps selected owner and all source filters with repeated titles",
      async () => {
        await request("getAffiliateTransactions", {
          userId: "affiliate",
          page: 0,
          pageSize: 50000,
          searchText: "A & #",
          typeFilter: "deposit",
          titleTypeFilter: ["one", "two"],
          createdByIdFilter: "staff",
          dateFromFilter: "2026-01-01",
          dateToFilter: "2026-10-01",
        });
        assert.deepEqual(plain(captured.at(-1).params), {
          userId: "affiliate",
          page: 0,
          pageSize: 50000,
          search: "A & #",
          type: "deposit",
          affiliateTransactionTitle: ["one", "two"],
          createdById: "staff",
          dateFrom: "2026-01-01",
          dateTo: "2026-10-01",
        });
        assert.equal(captured.at(-1).paramsSerializer.indexes, null);
      },
    );
    await check("Failed price writes remain retryable", async () => {
      fail = true;
      await assert.rejects(() =>
        request("updateAffiliateCustomerPrices", {
          customerId: "actual",
          affiliateId: "affiliate",
          prices: [],
        }),
      );
      fail = false;
      await request("updateAffiliateCustomerPrices", {
        customerId: "actual",
        affiliateId: "affiliate",
        prices: [],
      });
    });
    await check(
      "Customer update refreshes owning cards and summary without invalidating other affiliates",
      async () => {
        await request(
          "getAffiliateCustomers",
          { affiliateId: "affiliate", page: 0 },
          true,
        );
        await request("getAffiliateSummary", "affiliate", true);
        const before = captured.length;
        await request("updateAffiliateCustomerPrices", {
          customerId: "actual",
          affiliateId: "affiliate",
          prices: [],
        });
        await new Promise((r) => setTimeout(r, 25));
        assert(captured.length >= before + 3);
        const tags = api.util.selectInvalidatedBy(store.getState(), [
          { type: "AffiliateCustomers", id: "other" },
        ]);
        assert.equal(tags.length, 0);
      },
    );
    await check(
      "Inactive affiliate CRUD and ledger writes are not exposed",
      () => {
        for (const name of [
          "createAffiliateMerchant",
          "removeAffiliateMerchant",
          "createAffiliateMerchantZoho",
          "createAffiliateTransaction",
          "removeAffiliateTransactions",
        ])
          assert(!api.endpoints[name]);
      },
    );
  } finally {
    handles.forEach((h) => h.unsubscribe?.());
    store.dispatch(api.util.resetApiState());
  }
  console.log(`${passed}/${passed} affiliate regression checks passed.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
