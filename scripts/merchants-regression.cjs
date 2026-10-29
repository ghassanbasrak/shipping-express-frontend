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

const plain = (value) => JSON.parse(JSON.stringify(value));
const permissions = load("src/app/auth/permissions.ts"),
  transactions = load("src/app/main/transactions-app/Utils.ts", {
    "src/app/auth/permissions": permissions,
    "../countries-app/Utils": { displayName: (value) => value?.en || "" },
  });
const utils = load("src/app/main/merchants-app/Utils.ts", {
  "src/app/auth/permissions": permissions,
  "../transactions-app/Utils": transactions,
});
const model = load("src/app/main/merchants-app/models/MerchantModel.ts", {
  "@lodash": require(path.join(target, "node_modules/lodash")),
});
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (key) => key },
  validator: require(path.join(target, "node_modules/validator")),
});
const forms = load("src/app/main/merchants-app/models/MerchantSchema.ts", {
  "src/app/main/utils/validations": validations,
  "./MerchantModel": model,
  "../Utils": utils,
});
const viewer = {
    id: "viewer",
    role: "employee",
    features: [{ feature: "merchants", accessView: true }],
  },
  editor = {
    id: "editor",
    role: "employee",
    features: [{ feature: "merchants", accessView: true, accessUpdate: true }],
  },
  manager = {
    id: "manager",
    role: "admin",
    features: [
      {
        feature: "merchants",
        accessView: true,
        accessUpdate: true,
        accessDelete: true,
        accessCreate: true,
      },
      {
        feature: "transactions",
        accessView: true,
        accessUpdate: true,
        accessCreate: true,
      },
      { feature: "cod-transactions", accessView: true, accessUpdate: true },
    ],
  },
  self = { id: "merchant", role: "user" };
const stored = {
  id: "merchant",
  role: "user",
  firstName: "Account",
  lastName: "One",
  email: "one@example.test",
  phone: "+966-555123456",
  taxNumber: "",
  loyaltyType: "custom",
  address: {
    countryId: "country",
    stateId: "state",
    cityId: "city",
    street: "",
  },
  prices: [
    {
      id: "price",
      shippingCompanyId: "carrier",
      shippingCompany: { id: "carrier", name: "Carrier" },
      localPrice: 25,
      codPrice: 30,
      internationalDiscountRate: 5,
    },
  ],
  balance: 100,
  settings: { direction: "rtl" },
};
let passed = 0;
async function check(name, run) {
  await run();
  passed++;
  console.log("PASS " + name);
}
async function main() {
  await check(
    "merchant enums preserve source balance, loyalty and verification values",
    () => {
      assert.deepEqual(plain(utils.merchantLoyaltyTypes), {
        normal: "normal",
        custom: "custom",
      });
      for (const value of Object.values(utils.merchantVerificationStatus)) {
        assert(utils.toMerchantVerificationStatusTitle(value));
        assert(utils.toMerchantVerificationStatusColor(value));
      }
    },
  );
  await check("staff merchant updates require both view and update", () => {
    assert(utils.canViewMerchants(viewer));
    assert(!utils.canUpdateMerchant(viewer));
    assert(utils.canUpdateMerchant(editor));
    assert(!utils.canViewMerchants(self));
    assert(
      !utils.canUpdateMerchant({
        role: "employee",
        features: [{ feature: "merchants", accessUpdate: true }],
      }),
    );
  });
  await check(
    "new merchant direct route preserves create plus update requirements",
    () => {
      assert(utils.canCreateMerchant(manager));
      assert(!utils.canCreateMerchant(editor));
    },
  );
  await check(
    "blocking and affiliate actions require merchant delete as well as update",
    () => {
      assert(utils.canBlockMerchant(manager));
      assert(!utils.canBlockMerchant(editor));
      assert(
        !utils.canBlockMerchant({
          ...manager,
          features: [
            { feature: "merchants", accessView: true, accessDelete: true },
          ],
        }),
      );
    },
  );
  await check(
    "employee conversion remains administrator-only and respects merchant update",
    () => {
      assert(utils.canConvertMerchant(manager));
      assert(!utils.canConvertMerchant(editor));
      assert(!utils.canConvertMerchant({ ...viewer, role: "admin" }));
    },
  );
  await check(
    "ledger adjustment requires separately authorized create/view ledger access",
    () => {
      assert(utils.canAdjustMerchantBalance(manager));
      assert(!utils.canAdjustMerchantBalance(editor));
      assert(
        !utils.canAdjustMerchantBalance({
          ...manager,
          features: [
            manager.features[0],
            { feature: "transactions", accessCreate: true },
          ],
        }),
      );
    },
  );
  await check(
    "balance close preserves both wallet and COD update requirements",
    () => {
      assert(utils.canLockMerchantBalance(manager));
      assert(
        !utils.canLockMerchantBalance({
          ...manager,
          features: manager.features.filter(
            (x) => x.feature !== "cod-transactions",
          ),
        }),
      );
      assert(!utils.canLockMerchantBalance(editor));
    },
  );
  await check(
    "form defaults clone backend price populations and split the source dial-code phone",
    () => {
      const frozen = structuredClone(stored);
      Object.freeze(frozen.prices[0]);
      Object.freeze(frozen.prices);
      Object.freeze(frozen.address);
      Object.freeze(frozen);
      const form = forms.merchantFormValues(frozen);
      assert.equal(form.phoneCountry, "+966");
      assert.equal(form.phone, "555123456");
      form.prices[0].localPrice = 50;
      assert.equal(frozen.prices[0].localPrice, 25);
    },
  );
  await check(
    "merchant address requires country/state/city while street remains optional without tax",
    () => {
      const schema = forms.merchantSchema((k) => k),
        form = forms.merchantFormValues(stored);
      assert(schema.safeParse(form).success);
      for (const key of ["countryId", "stateId", "cityId"])
        assert(
          !schema.safeParse({
            ...form,
            address: { ...form.address, [key]: "" },
          }).success,
        );
    },
  );
  await check(
    "tax number retains optional fifteen-character rule and conditionally requires street",
    () => {
      const schema = forms.merchantSchema((k) => k),
        form = forms.merchantFormValues(stored);
      assert(!schema.safeParse({ ...form, taxNumber: "123" }).success);
      assert(
        !schema.safeParse({ ...form, taxNumber: "123456789012345" }).success,
      );
      assert(
        schema.safeParse({
          ...form,
          taxNumber: "١٢٣٤٥٦٧٨٩٠١٢٣٤٥",
          address: { ...form.address, street: "Street" },
        }).success,
      );
    },
  );
  await check(
    "optional price overrides accept blanks and reject zero or negative values",
    () => {
      const schema = forms.merchantSchema((k) => k),
        form = forms.merchantFormValues(stored);
      assert(
        schema.safeParse({
          ...form,
          prices: [{ shippingCompanyId: "carrier", localPrice: null }],
        }).success,
      );
      for (const localPrice of [0, -1])
        assert(
          !schema.safeParse({
            ...form,
            prices: [{ shippingCompanyId: "carrier", localPrice }],
          }).success,
        );
    },
  );
  await check(
    "staff payload contains only editable profile/address/positive prices and normalized tax",
    () => {
      const form = forms.merchantFormValues({
          ...stored,
          taxNumber: "١٢٣٤٥٦٧٨٩٠١٢٣٤٥",
        }),
        payload = forms.merchantPayload(form, true);
      assert.equal(payload.phone, "+966-555123456");
      assert.equal(payload.taxNumber, "123456789012345");
      assert.deepEqual(plain(payload.prices), [
        {
          shippingCompanyId: "carrier",
          localPrice: 25,
          codPrice: 30,
          internationalDiscountRate: 5,
        },
      ]);
      for (const field of [
        "id",
        "role",
        "balance",
        "features",
        "settings",
        "country",
        "phoneCountry",
      ])
        assert(!(field in payload));
      assert(!("country" in payload.address));
    },
  );
  await check(
    "self-service payload cannot overwrite staff pricing or loyalty grants",
    () => {
      const payload = forms.merchantPayload(
        forms.merchantFormValues(stored),
        false,
      );
      assert(!("prices" in payload));
      assert(!("loyaltyType" in payload));
      assert(!("role" in payload));
    },
  );
  await check(
    "empty price rows are omitted without losing stored carrier identifiers",
    () => {
      const form = forms.merchantFormValues(stored);
      form.prices.push({ shippingCompanyId: "unused" });
      assert.equal(forms.merchantPayload(form, true).prices.length, 1);
      assert.equal(
        forms.merchantPayload(form, true).prices[0].shippingCompanyId,
        "carrier",
      );
    },
  );
  const toolkit = require(path.join(target, "node_modules/@reduxjs/toolkit")),
    fakeCreateSlice = (options) => {
      const slice = toolkit.createSlice(options);
      slice.injectInto = () => ({ selectors: slice.selectors });
      return slice;
    };
  const slice = load("src/app/main/merchants-app/store/merchantsSlice.js", {
    "@reduxjs/toolkit": { createSlice: fakeCreateSlice },
    "app/store/lazyLoadedSlices": { rootReducer: {} },
  });
  await check(
    "search and filters reset page while invalid dates retain valid bounds",
    () => {
      let value = slice.default(undefined, slice.setMerchantsPage(4));
      value = slice.default(
        value,
        slice.setMerchantsSearchText({ target: { value: "A & #" } }),
      );
      assert.equal(value.page, 0);
      value = slice.default(
        value,
        slice.setMerchantsDateFromFilter(new Date("2026-01-01")),
      );
      value = slice.default(
        value,
        slice.setMerchantsDateFromFilter(new Date("bad")),
      );
      assert.equal(value.dateFromFilter, "2026-01-01T00:00:00.000Z");
      assert(utils.merchantDatesInvalid(value));
    },
  );
  const captured = [];
  let failWrite = false;
  const api = createApi({
    reducerPath: "merchantsTest",
    keepUnusedDataFor: 0,
    endpoints: () => ({}),
    baseQuery: async (req) => {
      captured.push(req);
      if (failWrite && req.method)
        return { error: { status: 500, data: { message: "failed" } } };
      return {
        data: req.url.endsWith("close-balance")
          ? { walletBalanceStatus: true, codBalanceStatus: true }
          : req.method
            ? { ...stored, ...req.data }
            : { results: [], total: 0 },
      };
    },
  });
  load("src/app/main/merchants-app/MerchantsApi.ts", {
    "app/store/apiService": { apiService: api },
  });
  const store = configureStore({
      reducer: { [api.reducerPath]: api.reducer },
      middleware: (get) => get().concat(api.middleware),
    }),
    handles = [];
  async function request(name, arg, keep = false) {
    const handle = store.dispatch(
      api.endpoints[name].initiate(arg, { forceRefetch: true }),
    );
    handles.push(handle);
    try {
      return await handle.unwrap();
    } finally {
      if (!keep) handle.unsubscribe?.();
    }
  }
  try {
    await check(
      "directory API retains role=user and every active filter",
      async () => {
        await request("getMerchants", {
          page: 2,
          pageSize: 10,
          searchText: "A & #",
          balanceTypeFilter: "negative",
          typeFilter: "custom",
          statusFilter: "false",
          verificationStatusFilter: "approved",
          dateFromFilter: "2026-01-01",
          dateToFilter: "2026-10-01",
        });
        assert.deepEqual(plain(captured.at(-1).params), {
          role: "user",
          page: 2,
          pageSize: 10,
          search: "A & #",
          balanceType: "negative",
          loyaltyType: "custom",
          active: "false",
          verificationStatus: "approved",
          dateFrom: "2026-01-01",
          dateTo: "2026-10-01",
        });
      },
    );
    await check(
      "directory export retains page-zero/3000 limit and ignores retired store filters",
      async () => {
        await request("getMerchants", {
          page: 0,
          pageSize: 3000,
          balanceTypeFilter: "all",
          typeFilter: "all",
          statusFilter: "all",
          verificationStatusFilter: "all",
          hasStoreFilter: "true",
        });
        assert.deepEqual(plain(captured.at(-1).params), {
          role: "user",
          page: 0,
          pageSize: 3000,
        });
      },
    );
    await check(
      "independent sort precedence matches the source COD sort override",
      async () => {
        await request("getMerchants", {
          page: 0,
          pageSize: 10,
          balanceSorting: "asc",
          codBalanceSorting: "desc",
        });
        assert.equal(captured.at(-1).params.orderColumn, "codBalance");
        assert.equal(captured.at(-1).params.orderDirection, "desc");
      },
    );
    await check(
      "detail reads actual staff ID and self-service me without changing paths",
      async () => {
        await request("getMerchant", "actual");
        assert.equal(captured.at(-1).url, "v1/users/actual");
        await request("getMerchant", "me");
        assert.equal(captured.at(-1).url, "v1/users/me");
      },
    );
    await check(
      "profile writes target the explicit account and preserve editable payload",
      async () => {
        const data = forms.merchantPayload(
          forms.merchantFormValues(stored),
          true,
        );
        await request("updateMerchant", { id: "actual", data });
        assert.equal(captured.at(-1).url, "v1/users/actual");
        assert.equal(captured.at(-1).method, "PATCH");
        assert.deepEqual(plain(captured.at(-1).data), plain(data));
      },
    );
    await check(
      "blocking writes only isBlocked independently of profile draft fields",
      async () => {
        await request("setMerchantBlocked", {
          id: "actual",
          isBlocked: true,
          firstName: "ignored",
        });
        assert.deepEqual(plain(captured.at(-1).data), { isBlocked: true });
      },
    );
    await check("affiliate toggle writes only isAffiliate", async () => {
      await request("setMerchantAffiliate", {
        id: "actual",
        isAffiliate: true,
        role: "ignored",
      });
      assert.deepEqual(plain(captured.at(-1).data), { isAffiliate: true });
    });
    await check(
      "employee conversion writes only role at the selected ID",
      async () => {
        await request("convertMerchantToEmployee", "actual");
        assert.equal(captured.at(-1).url, "v1/users/actual");
        assert.deepEqual(plain(captured.at(-1).data), { role: "employee" });
      },
    );
    await check(
      "plan subscribe/cancel use original dedicated endpoints",
      async () => {
        await request("addMerchantPaymentPlan", {
          id: "actual",
          paymentPlanId: "plan",
        });
        assert.equal(captured.at(-1).url, "v1/users/actual/add-payment-plan");
        assert.deepEqual(plain(captured.at(-1).data), {
          paymentPlanId: "plan",
        });
        await request("cancelMerchantPaymentPlan", "actual");
        assert.equal(
          captured.at(-1).url,
          "v1/users/actual/cancel-payment-plan",
        );
        assert.equal(captured.at(-1).method, "DELETE");
      },
    );
    await check(
      "balance closing fixes ownership and strips blank notes",
      async () => {
        await request("closeMerchantBalance", {
          id: "actual",
          type: "cod",
          notes: "",
        });
        assert.equal(captured.at(-1).url, "v1/transactions/close-balance");
        assert.deepEqual(plain(captured.at(-1).data), {
          userId: "actual",
          type: "cod",
        });
      },
    );
    await check(
      "contact tab query/export retain the selected owner and sender/receiver type",
      async () => {
        await request("getMerchantContacts", {
          userId: "owner",
          type: "receiver",
          page: 1,
          pageSize: 10,
          searchText: "A & #",
        });
        assert.deepEqual(plain(captured.at(-1).params), {
          userId: "owner",
          type: "receiver",
          page: 1,
          pageSize: 10,
          search: "A & #",
        });
        await request("getMerchantContacts", {
          userId: "owner",
          type: "sender",
          page: 0,
          pageSize: 50000,
        });
        assert.equal(captured.at(-1).params.pageSize, 50000);
        assert.equal(captured.at(-1).params.userId, "owner");
      },
    );
    await check(
      "failed account action rejects and remains retryable",
      async () => {
        failWrite = true;
        await assert.rejects(() =>
          request("setMerchantBlocked", { id: "actual", isBlocked: true }),
        );
        failWrite = false;
        await request("setMerchantBlocked", { id: "actual", isBlocked: true });
      },
    );
    await check(
      "merchant actions invalidate subscribed directory and selected detail",
      async () => {
        await request("getMerchants", { page: 0, pageSize: 10 }, true);
        await request("getMerchant", "actual", true);
        const count = () => captured.filter((req) => !req.method).length,
          before = count();
        await request("setMerchantAffiliate", {
          id: "actual",
          isAffiliate: true,
        });
        await new Promise((resolve) => setTimeout(resolve, 20));
        assert(count() >= before + 2);
      },
    );
    await check(
      "inactive deletion and Zoho creation are not exposed by merchant API",
      () => {
        assert(!api.endpoints.removeMerchant);
        assert(!api.endpoints.createMerchantZoho);
      },
    );
  } finally {
    handles.forEach((handle) => handle.unsubscribe?.());
    store.dispatch(api.util.resetApiState());
  }
  console.log(`${passed}/${passed} merchant regression checks passed.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
