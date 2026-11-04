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
const utils = load("src/app/main/topup-requests-app/Utils.ts", {
  "src/app/auth/permissions": permissions,
  "../transactions-app/Utils": transactions,
});
const callback = load("src/app/main/payment-app/Utils.ts");
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (key) => key },
  validator: require(path.join(target, "node_modules/validator")),
});
const schemas = load(
  "src/app/main/topup-requests-app/models/TopupRequestSchema.ts",
  { "src/app/main/utils/validations": validations, "../Utils": utils },
);
const merchant = { id: "owner", role: "user" },
  viewer = {
    role: "employee",
    features: [{ feature: "payments", accessView: true }],
  },
  payment = { id: "payment", userId: "owner", status: "pending", amount: 100 };
let passed = 0;
async function check(name, run) {
  await run();
  passed++;
  console.log("PASS " + name);
}
async function main() {
  await check(
    "payment status enums retain pending/success/failed backend values",
    () => {
      assert.deepEqual(plain(utils.topupRequestStatus), {
        pending: "pending",
        confirmed: "success",
        refused: "failed",
      });
      for (const value of ["pending", "success", "failed"]) {
        assert(utils.toTopupRequestStatusTitle(value));
        assert(utils.toTopupRequestStatusColor(value));
      }
    },
  );
  await check(
    "inclusive tax and total calculation match the active PayTabs creation contract",
    () => {
      assert.deepEqual(plain(utils.topupTotals(115)), {
        amount: 100,
        total: 115,
        feeTotal: 0,
        taxTotal: 15,
      });
      assert.deepEqual(plain(utils.topupTotals(100)), {
        amount: 86.96,
        total: 100,
        feeTotal: 0,
        taxTotal: 13.04,
      });
      assert.deepEqual(plain(utils.topupTotals(0)), {
        amount: 0,
        total: 0,
        feeTotal: 0,
        taxTotal: 0,
      });
    },
  );
  await check(
    "standard top-up requires at least 100 and finite numeric input",
    () => {
      const schema = schemas.topupRequestSchema((k) => k, "owner");
      for (const amount of [100, 115])
        assert(schema.safeParse({ amount }).success);
      for (const amount of [0, 99, -1, NaN, Infinity, "", undefined])
        assert(!schema.safeParse({ amount }).success);
    },
  );
  await check(
    "both original account minimum exceptions remain without extra amount constraints",
    () => {
      for (const id of utils.topupMinimumExceptions) {
        const schema = schemas.topupRequestSchema((k) => k, id);
        assert(schema.safeParse({ amount: 1 }).success);
        assert(schema.safeParse({ amount: 0 }).success);
        assert(!schema.safeParse({ amount: undefined }).success);
      }
    },
  );
  await check(
    "payment view uses the existing payments permission identifier",
    () => {
      assert(utils.canViewTopupRequests(viewer));
      assert(utils.canViewTopupRequests(merchant));
      assert(
        !utils.canViewTopupRequests({
          role: "employee",
          features: [{ feature: "topup-requests", accessView: true }],
        }),
      );
      assert(
        !utils.canViewTopupRequests({
          role: "employee",
          features: [{ feature: "payments", accessUpdate: true }],
        }),
      );
    },
  );
  await check(
    "staff adjustments require merchant update plus a view/create ledger grant and selected account",
    () => {
      const editor = {
        role: "employee",
        features: [
          { feature: "payments", accessView: true },
          { feature: "merchants", accessUpdate: true },
          { feature: "transactions", accessView: true, accessCreate: true },
        ],
      };
      assert(utils.canAdjustTopupBalance(editor, "owner"));
      assert(!utils.canAdjustTopupBalance(editor, "all"));
      assert(!utils.canAdjustTopupBalance(viewer, "owner"));
      assert(!utils.canAdjustTopupBalance(merchant, "owner"));
      assert(
        !utils.canAdjustTopupBalance(
          {
            ...editor,
            features: editor.features.filter(
              (x) => x.feature !== "transactions",
            ),
          },
          "owner",
        ),
      );
    },
  );
  await check(
    "only the owning merchant can recreate pending or failed checkouts",
    () => {
      assert(utils.canRecreateTopup(merchant, payment));
      assert(
        utils.canRecreateTopup(merchant, { ...payment, status: "failed" }),
      );
      assert(
        !utils.canRecreateTopup(merchant, { ...payment, status: "success" }),
      );
      assert(
        !utils.canRecreateTopup(merchant, { ...payment, userId: "foreign" }),
      );
      assert(!utils.canRecreateTopup(viewer, payment));
    },
  );
  await check(
    "populated ownership is supported without changing the current account",
    () => {
      assert(
        utils.ownsTopupRequest(merchant, {
          ...payment,
          userId: undefined,
          user: { id: "owner" },
        }),
      );
      assert(!utils.ownsTopupRequest(merchant, null));
    },
  );
  await check(
    "hosted checkout navigation accepts absolute web links and rejects missing or executable URLs",
    () => {
      assert.equal(
        utils.checkoutUrl("https://gateway.example.test/pay?id=1"),
        "https://gateway.example.test/pay?id=1",
      );
      for (const link of [
        "",
        undefined,
        "javascript:alert(1)",
        "data:text/html,bad",
        "/relative",
        "https://user:secret@example.test",
      ])
        assert.equal(utils.checkoutUrl(link), null);
    },
  );
  await check(
    "provider errors retain English/Arabic mappings and unknown server-message fallback",
    () => {
      assert.equal(
        utils.getPayTabsResultCodeError("A", "100", "ignored", "en"),
        "",
      );
      assert.equal(
        utils.getPayTabsResultCodeError("unknown", "x", "Server reason", "en"),
        "Server reason",
      );
      assert(
        utils
          .getPayTabsResultCodeError("D", "316", "", "en")
          .toLowerCase()
          .includes("fund"),
      );
      assert(
        /[\u0600-\u06ff]/.test(
          utils.getPayTabsResultCodeError("D", "316", "", "ar"),
        ),
      );
      assert(utils.getHyperpayResultCodeError("800.100.152", "en"));
    },
  );
  await check(
    "legacy MyFatoorah errors preserve gateway-specific translation keys",
    () => {
      assert.equal(
        callback.getMyFatoorahPaymentErrorCode("MF004"),
        "PAYMENT_ERROR_4",
      );
      assert.equal(
        callback.getMyFatoorahPaymentErrorCode("MF020"),
        "PAYMENT_ERROR_11",
      );
      assert.equal(callback.myFatoorahPaymentStatus.paid, "Paid");
    },
  );
  const toolkit = require(path.join(target, "node_modules/@reduxjs/toolkit")),
    fakeCreateSlice = (options) => {
      const slice = toolkit.createSlice(options);
      slice.injectInto = () => ({ selectors: slice.selectors });
      return slice;
    };
  const slice = load(
    "src/app/main/topup-requests-app/store/topupRequestsSlice.js",
    {
      "@reduxjs/toolkit": { createSlice: fakeCreateSlice },
      "app/store/lazyLoadedSlices": { rootReducer: {} },
    },
  );
  await check(
    "route account initialization resets filters and search resets pagination",
    () => {
      let state = slice.default(
        undefined,
        slice.newTopupRequestsInstance({ userIdFilter: "owner" }),
      );
      assert.equal(state.userIdFilter, "owner");
      state = slice.default(state, slice.setTopupRequestsPage(4));
      state = slice.default(
        state,
        slice.setTopupRequestsSearchText({ target: { value: "A & #" } }),
      );
      assert.equal(state.page, 0);
      assert.equal(state.searchText, "A & #");
    },
  );
  await check(
    "invalid dates retain the last valid bound and block reversed ranges",
    () => {
      let state = slice.default(
        undefined,
        slice.setTopupRequestsDateFromFilter(new Date("2026-01-01")),
      );
      state = slice.default(
        state,
        slice.setTopupRequestsDateFromFilter(new Date("bad")),
      );
      assert.equal(state.dateFromFilter, "2026-01-01T00:00:00.000Z");
      assert(utils.invalidTopupDates(state));
      assert(
        utils.invalidTopupDates({
          dateFromFilter: "2026-10-01",
          dateToFilter: "2026-01-01",
        }),
      );
      state = slice.default(state, slice.setTopupRequestsDateFromFilter(null));
      assert(!utils.invalidTopupDates(state));
    },
  );

  const setUser = toolkit.createAsyncThunk(
      "user/setUser",
      async (value) => value,
    ),
    resetUser = toolkit.createAsyncThunk("user/resetUser", async () => true);
  const settings = load("src/@fuse/core/FuseSettings/fuseSettingsSlice.ts", {
    "@reduxjs/toolkit": toolkit,
    "@lodash": require(path.join(target, "node_modules/lodash")),
    "@mui/material/styles": {
      createTheme: (value) => value,
      getContrastRatio: () => 5,
    },
    "@fuse/default-settings": {
      defaultSettings: { direction: "ltr" },
      defaultThemeOptions: {},
      extendThemeWithMixins: (value) => value,
      getParsedQuerySettings: () => ({}),
      mustHaveThemeOptions: {},
    },
    "app/configs/settingsConfig": { layout: { style: "layout1" } },
    "app/theme-layouts/themeLayoutConfigs": {
      layout1: {
        defaults: { navbar: { display: true }, toolbar: { display: true } },
      },
    },
    "app/configs/themesConfig": { darkPaletteText: {}, lightPaletteText: {} },
    "../../../app/auth/user/store/userSlice": {
      setUser,
      resetUser,
      setUserSettings: (value) => ({ type: "user/settings", payload: value }),
    },
  });
  await check(
    "account refresh preserves active route overrides when user settings are unchanged",
    () => {
      let value = settings.default(undefined, { type: "init" });
      value = settings.default(
        value,
        settings.setSettings({
          ...value.current,
          layout: {
            ...value.current.layout,
            config: { navbar: { display: false }, toolbar: { display: false } },
          },
        }),
      );
      const refreshed = settings.default(
        value,
        setUser.fulfilled({ id: "owner", role: "user" }, "request", "owner"),
      );
      assert.equal(refreshed, value);
      assert.equal(refreshed.current.layout.config.navbar.display, false);
      assert.equal(refreshed.current.layout.config.toolbar.display, false);
    },
  );
  await check(
    "actual user setting changes and sign-out still update/reset Fuse defaults",
    () => {
      let value = settings.default(undefined, { type: "init" });
      value = settings.default(
        value,
        setUser.fulfilled(
          { id: "owner", settings: { direction: "rtl" } },
          "request",
          "owner",
        ),
      );
      assert.equal(value.defaults.direction, "rtl");
      value = settings.default(
        value,
        resetUser.fulfilled(true, "request", undefined),
      );
      assert.equal(value.defaults.direction, "ltr");
    },
  );
  const captured = [];
  let failWrite = false;
  const api = createApi({
    reducerPath: "topupsTest",
    keepUnusedDataFor: 0,
    endpoints: () => ({}),
    baseQuery: async (req) => {
      captured.push(req);
      if (failWrite && req.method)
        return { error: { status: 500, data: { message: "failed" } } };
      return {
        data: req.url.endsWith("/payment-status")
          ? {
              Data: {
                CustomerReference: "payment",
                InvoiceStatus: "Paid",
                InvoiceId: 123,
              },
            }
          : req.method
            ? { id: "payment", status: "pending", ...req.data }
            : { results: [], total: 0 },
      };
    },
  });
  load("src/app/main/topup-requests-app/TopupRequestsApi.ts", {
    "app/store/apiService": { apiService: api },
  });
  load("src/app/main/payment-app/PaymentApi.ts", {
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
      "payment list preserves all active source filters and encoded search values",
      async () => {
        await request("getTopupRequests", {
          page: 2,
          pageSize: 10,
          searchText: "A & + #",
          userIdFilter: "owner",
          statusFilter: "failed",
          dateFromFilter: "2026-01-01",
          dateToFilter: "2026-10-01",
        });
        assert.equal(captured.at(-1).url, "v1/payments");
        assert.deepEqual(plain(captured.at(-1).params), {
          page: 2,
          pageSize: 10,
          search: "A & + #",
          userId: "owner",
          status: "failed",
          dateFrom: "2026-01-01",
          dateTo: "2026-10-01",
        });
      },
    );
    await check(
      "page-zero export preserves source 500000 limit and omits all sentinels",
      async () => {
        await request("getTopupRequests", {
          page: 0,
          pageSize: 500000,
          userIdFilter: "all",
          statusFilter: "all",
        });
        assert.deepEqual(plain(captured.at(-1).params), {
          page: 0,
          pageSize: 500000,
        });
      },
    );
    await check(
      "PayTabs creation sends computed values and excludes gateway choices/populations/form metadata",
      async () => {
        await request("createTopupRequest", {
          ...utils.topupTotals(115),
          userId: "owner",
          user: { id: "fake" },
          paymentMethodId: "fake",
          paymentMethodType: "fake",
          id: "fake",
          status: "success",
          planId: "fake",
        });
        assert.equal(captured.at(-1).url, "v1/payments/paytabs");
        assert.deepEqual(plain(captured.at(-1).data), {
          amount: 100,
          total: 115,
          feeTotal: 0,
          taxTotal: 15,
          isPlan: false,
          userId: "owner",
        });
      },
    );
    await check(
      "checkout retry targets the original payment ID without creating another payment",
      async () => {
        await request("recreateTopupCheckout", "actual-payment");
        assert.equal(
          captured.at(-1).url,
          "v1/payments/actual-payment/recreate-checkout",
        );
        assert.equal(captured.at(-1).method, "POST");
        assert.equal(captured.at(-1).data, undefined);
      },
    );
    await check(
      "PayTabs status checks send an empty body rather than an undefined Hyperpay checkout path",
      async () => {
        await request("checkTopupStatus", { id: "payment" });
        assert.equal(captured.at(-1).url, "v1/payments/payment/check-status");
        assert.deepEqual(plain(captured.at(-1).data), {});
      },
    );
    await check(
      "legacy resourcePath or transaction ID status checks preserve the backend contract",
      async () => {
        await request("checkTopupStatus", {
          id: "payment",
          resourcePath: "/v1/checkouts/checkout/payment",
        });
        assert.equal(
          captured.at(-1).data.resourcePath,
          "/v1/checkouts/checkout/payment",
        );
        await request("checkTopupStatus", {
          id: "payment",
          transactionId: "checkout",
        });
        assert.equal(
          captured.at(-1).data.resourcePath,
          "/v1/checkouts/checkout/payment",
        );
      },
    );
    await check(
      "callback verification uses only the backend proxy with original keyType/key payload",
      async () => {
        const result = await request("getCallbackPaymentStatus", "gateway-id");
        assert.equal(captured.at(-1).url, "v1/payments/payment-status");
        assert.deepEqual(plain(captured.at(-1).data), {
          keyType: "PaymentId",
          key: "gateway-id",
        });
        assert.equal(result.Data.CustomerReference, "payment");
        assert.equal(result.Data.InvoiceStatus, "Paid");
      },
    );
    await check(
      "verified callback updates only transaction ID/status/reference at the actual payment ID",
      async () => {
        await request("updateCallbackPayment", {
          id: "actual",
          transactionId: "gateway-id",
          status: "success",
          reference: "123",
          amount: 999,
          userId: "fake",
        });
        assert.equal(captured.at(-1).url, "v1/payments/actual");
        assert.deepEqual(plain(captured.at(-1).data), {
          transactionId: "gateway-id",
          status: "success",
          reference: "123",
        });
      },
    );
    await check(
      "creation, recreation and callback failures reject and remain retryable",
      async () => {
        failWrite = true;
        for (const [name, arg] of [
          [
            "createTopupRequest",
            { ...utils.topupTotals(115), userId: "owner" },
          ],
          ["recreateTopupCheckout", "payment"],
          [
            "updateCallbackPayment",
            {
              id: "payment",
              transactionId: "x",
              status: "success",
              reference: "1",
            },
          ],
        ])
          await assert.rejects(() => request(name, arg));
        failWrite = false;
        await request("recreateTopupCheckout", "payment");
      },
    );
    await check(
      "payment status checks refresh subscribed list and matching detail caches",
      async () => {
        await request("getTopupRequests", { page: 0, pageSize: 10 }, true);
        await request("getTopupRequest", "payment", true);
        const count = () => captured.filter((req) => !req.method).length,
          before = count();
        await request("checkTopupStatus", { id: "payment" });
        await new Promise((resolve) => setTimeout(resolve, 20));
        assert(count() >= before + 2);
      },
    );
    await check(
      "callback success refreshes both payment list and detail caches",
      async () => {
        const count = () => captured.filter((req) => !req.method).length,
          before = count();
        await request("updateCallbackPayment", {
          id: "payment",
          transactionId: "gateway-id",
          status: "success",
          reference: "123",
        });
        await new Promise((resolve) => setTimeout(resolve, 20));
        assert(count() >= before + 2);
      },
    );
    await check(
      "detail lookup uses a plain ID and source-inactive delete/manual-confirm endpoints stay absent",
      async () => {
        await request("getTopupRequest", "actual");
        assert.equal(captured.at(-1).url, "v1/payments/actual");
        assert(!api.endpoints.removeTopupRequest);
        assert(!api.endpoints.setTopupRequestStatus);
        assert(
          !captured.some(
            (req) => req.method === "DELETE" || /^https?:/.test(req.url),
          ),
        );
      },
    );
  } finally {
    handles.forEach((handle) => handle.unsubscribe?.());
    store.dispatch(api.util.resetApiState());
  }
  console.log(`${passed}/${passed} top-up/payment regression checks passed.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
