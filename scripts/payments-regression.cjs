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
const utils = load("src/app/main/payments-app/Utils.ts", {
  "src/app/auth/permissions": permissions,
  "../transactions-app/Utils": transactions,
});
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (key) => key },
  validator: require(path.join(target, "node_modules/validator")),
});
const schemas = load("src/app/main/payments-app/models/PaymentSchema.ts", {
  "src/app/main/utils/validations": validations,
  "../Utils": utils,
});
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
    "Native payments permission authorizes the renamed payments route",
    () => {
      assert(permissions.hasPagePermission("/payments/all", viewer));
      assert(
        !permissions.hasPagePermission("/payments/all", {
          role: "employee",
          features: [{ feature: "unrelated", accessView: true }],
        }),
      );
      assert(utils.canViewPayments(viewer));
      assert(utils.canViewPayments(merchant));
      assert(
        !utils.canViewPayments({
          role: "employee",
          features: [{ feature: "payments", accessUpdate: true }],
        }),
      );
    },
  );
  await check("Payment ownership remains bound to the current merchant", () => {
    assert(utils.ownsPayment(merchant, payment));
    assert(utils.ownsPayment(merchant, { user: { id: "owner" } }));
    assert(!utils.ownsPayment(merchant, { ...payment, userId: "other" }));
    assert(!utils.ownsPayment(viewer, payment));
  });
  await check(
    "Wallet adjustment grants remain independent of payment view",
    () => {
      assert(!utils.canAdjustWalletBalance(viewer, "owner"));
      assert(!utils.canAdjustWalletBalance(merchant, "owner"));
      assert(
        !utils.canAdjustWalletBalance(
          {
            role: "employee",
            features: [
              { feature: "payments", accessView: true },
              { feature: "merchants", accessUpdate: true },
              { feature: "transactions", accessCreate: true },
            ],
          },
          "all",
        ),
      );
    },
  );
  await check("Payment totals retain inclusive VAT and wallet credit", () => {
    assert.deepEqual(plain(utils.paymentTotals(115)), {
      amount: 100,
      total: 115,
      feeTotal: 0,
      taxTotal: 15,
    });
    assert.equal(utils.paymentTotals(100).amount, 86.96);
  });
  const draft = {
    amount: 115,
    method: "online",
    transactionReference: "",
    transactionImageUrl: "",
    description: "",
  };
  await check("Online payment validation retains required amount rules", () => {
    const schema = schemas.paymentSchema((k) => k, "owner");
    assert(schema.safeParse(draft).success);
    for (const amount of [0, -1, 99, Infinity, 115.001])
      assert(!schema.safeParse({ ...draft, amount }).success);
  });
  await check("Bank transfer retains its separate proof requirement", () => {
    const schema = schemas.paymentSchema((k) => k, "owner");
    assert(!schema.safeParse({ ...draft, method: "bankTransfer" }).success);
    assert(
      schema.safeParse({
        ...draft,
        method: "bankTransfer",
        transactionReference: "ref",
      }).success,
    );
    assert(
      schema.safeParse({
        ...draft,
        method: "bankTransfer",
        transactionImageUrl: "https://example.com/receipt.pdf",
      }).success,
    );
  });
  await check(
    "Status values retain the backend contract after naming changes",
    () => {
      assert.deepEqual(plain(utils.paymentStatus), {
        pending: "pending",
        confirmed: "success",
        refused: "failed",
      });
      for (const status of Object.values(utils.paymentStatus)) {
        assert(utils.toPaymentStatusTitle(status));
        assert(utils.toPaymentStatusColor(status));
      }
    },
  );
  const toolkit = require(path.join(target, "node_modules/@reduxjs/toolkit"));
  const slice = load("src/app/main/payments-app/store/paymentsSlice.js", {
    "@reduxjs/toolkit": {
      createSlice(options) {
        const value = toolkit.createSlice(options);
        value.injectInto = () => ({ selectors: value.selectors });
        return value;
      },
    },
    "app/store/lazyLoadedSlices": { rootReducer: {} },
  });
  await check(
    "Renamed list slice retains account scope and filter pagination",
    () => {
      let state = slice.default(
        undefined,
        slice.newPaymentsInstance({ userIdFilter: "owner" }),
      );
      state = slice.default(state, slice.setPaymentsPage(3));
      state = slice.default(state, slice.setPaymentsSearchText("search"));
      assert.equal(state.userIdFilter, "owner");
      assert.equal(state.page, 0);
      assert.equal(state.searchText, "search");
    },
  );
  await check(
    "Invalid dates retain the last bound and block broadening",
    () => {
      let state = slice.default(
        undefined,
        slice.setPaymentsDateFromFilter("2026-01-01"),
      );
      state = slice.default(state, slice.setPaymentsDateFromFilter("bad"));
      assert.equal(state.dateFromFilter, "2026-01-01T00:00:00.000Z");
      assert(utils.invalidPaymentDates(state));
      assert(
        utils.invalidPaymentDates({
          dateFromFilter: "2026-10-01",
          dateToFilter: "2026-01-01",
        }),
      );
    },
  );
  const en = load("src/app/main/payments-app/i18n/en.ts").default;
  const ar = load("src/app/main/payments-app/i18n/ar.ts").default;
  await check(
    "Purpose and method enums contain exactly the agreed backend values",
    () => {
      assert.deepEqual(plain(Object.values(utils.paymentType)), [
        "topup",
        "storageSubscription",
      ]);
      assert.deepEqual(plain(Object.values(utils.paymentMethodType)), [
        "visa",
        "master",
        "mada",
        "amex",
        "unionpay",
        "applepay",
        "free",
      ]);
    },
  );
  await check(
    "Every purpose and method uses shared translated titles and colors",
    () => {
      for (const value of Object.values(utils.paymentType)) {
        const title = utils.toPaymentTypeTitle(value);
        assert(en[title] && ar[title]);
        assert(utils.toPaymentTypeColor(value).startsWith("bg-"));
      }
      for (const value of Object.values(utils.paymentMethodType)) {
        const title = utils.toPaymentMethodTypeTitle(value);
        assert(en[title] && ar[title]);
        assert(utils.toPaymentMethodTypeColor(value).startsWith("bg-"));
      }
      assert.equal(
        utils.toPaymentMethodTypeTitle("unsupported"),
        "PAYMENT_METHOD_UNKNOWN",
      );
    },
  );
  await check(
    "Hosted links reject missing, executable, credentialed and insecure redirects",
    () => {
      const valid = "https://checkout.moyasar.com/invoices/invoice-id";
      assert.equal(utils.getHostedCheckoutUrl(valid), valid);
      for (const value of [
        undefined,
        "",
        "/relative",
        "javascript:alert(1)",
        "http://checkout.moyasar.com/x",
        "https://user:secret@checkout.moyasar.com/x",
      ])
        assert.equal(utils.getHostedCheckoutUrl(value), undefined);
    },
  );
  await check(
    "Local demo redirects are limited to the same-origin demo gateway path",
    () => {
      assert.equal(
        utils.getHostedCheckoutUrl(
          "http://localhost:3000/demo/payment/id",
          "http://localhost:3000",
        ),
        "http://localhost:3000/demo/payment/id",
      );
      assert.equal(
        utils.getHostedCheckoutUrl(
          "http://localhost:3000/other",
          "http://localhost:3000",
        ),
        undefined,
      );
      assert.equal(
        utils.getHostedCheckoutUrl(
          "http://different.test/demo/payment/id",
          "http://localhost:3000",
        ),
        undefined,
      );
    },
  );
  await check(
    "Feature headings and navigation use Payments and the requested Arabic label",
    () => {
      assert.equal(en.PAYMENTS, "Payments");
      assert.equal(ar.PAYMENTS, "الدفعات الإلكترونية");
      assert.equal(
        load("src/app/configs/navigation-i18n/en.ts").default.PAYMENTS,
        "Payments",
      );
      assert.equal(
        load("src/app/configs/navigation-i18n/ar.ts").default.PAYMENTS,
        ar.PAYMENTS,
      );
    },
  );
  const config = load("src/app/main/payments-app/PaymentsAppConfig.tsx", {
    "src/app/demo/demoMode": { isDemoMode: false },
    react: { lazy: () => function Page() {} },
    i18next: { __esModule: true, default: { addResourceBundle() {} } },
    "src/app/auth/authRoles": {
      __esModule: true,
      default: { user: ["admin", "employee", "user"], onlyUser: ["user"] },
    },
    "./i18n/en": { __esModule: true, default: en },
    "./i18n/ar": { __esModule: true, default: ar },
    "./i18n/tr": { __esModule: true, default: {} },
  }).default;
  await check(
    "Renamed routes match merchant scope, record IDs and nested tabs",
    () => {
      const { matchRoutes } = require("react-router-dom");
      for (const [url, scope, id] of [
        ["/payments/all", "all", undefined],
        ["/payments/account/new", "account", "new"],
        ["/payments/all/record/details", "all", "record"],
      ]) {
        const match = matchRoutes(config.routes, url).at(-1);
        assert.equal(match.params.userId, scope);
        assert.equal(match.params.paymentId, id);
      }
      assert(config.routes.find((r) => r.path === "wallet/payment-result"));
    },
  );
  await check(
    "Legacy payment callback returns to the renamed record history",
    () => {
      const page = load("src/app/main/payment-app/PaymentPage.tsx", {
        "react-router-dom": {
          Navigate: "redirect",
          useParams: () => ({ paymentId: "record" }),
        },
      }).default;
      assert.equal(page().props.to, "/payments/all/record");
    },
  );
  const captured = [];
  let fail = false;
  const api = createApi({
    reducerPath: "paymentsTest",
    keepUnusedDataFor: 0,
    endpoints: () => ({}),
    baseQuery: async (req) => {
      captured.push(req);
      if (fail) return { error: { status: 503, data: "outage" } };
      return {
        data: req.url === "v1/payments" ? { results: [], total: 0 } : payment,
      };
    },
  });
  load("src/app/main/payments-app/PaymentsApi.ts", {
    "app/store/apiService": { apiService: api },
  });
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (get) => get().concat(api.middleware),
  });
  const handles = [];
  async function request(name, value) {
    const handle = store.dispatch(
      api.endpoints[name].initiate(value, { forceRefetch: true }),
    );
    handles.push(handle);
    return handle.unwrap();
  }
  try {
    await check(
      "Renamed list endpoint preserves backend URL and exact filter scope",
      async () => {
        await request("getPayments", {
          page: 2,
          pageSize: 10,
          searchText: "A & +",
          userIdFilter: "owner",
          statusFilter: "pending",
          dateFromFilter: "2026-01-01",
        });
        assert.equal(captured.at(-1).url, "v1/payments");
        assert.deepEqual(plain(captured.at(-1).params), {
          page: 2,
          pageSize: 10,
          search: "A & +",
          userId: "owner",
          status: "pending",
          dateFrom: "2026-01-01",
        });
      },
    );
    await check(
      "Filtered export retains page-zero limit and omits sentinel scopes",
      async () => {
        await request("getPayments", {
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
      "Renamed create endpoint still sends only the native net amount",
      async () => {
        await request("createPayment", {
          amount: 100,
          total: 115,
          userId: "fake",
          status: "success",
          paymentMethodType: "fake",
        });
        const wireRequest = captured
          .filter((row) => row.method === "POST")
          .at(-1);
        assert.equal(wireRequest.url, "v1/payments/moyasar");
        assert.deepEqual(plain(wireRequest.data), { amount: 100 });
      },
    );
    await check(
      "Hosted verification uses the internal payment ID and an empty body",
      async () => {
        await request("checkPaymentStatus", {
          id: "record",
          userId: "owner",
          status: "success",
          total: 999,
        });
        const wireRequest = captured
          .filter((row) => row.method === "POST")
          .at(-1);
        assert.equal(wireRequest.url, "v1/payments/record/check-status");
        assert.deepEqual(plain(wireRequest.data), {});
      },
    );
    await check(
      "Renamed caches invalidate the list, detail and account after verification",
      () => {
        const targets = api.util.selectInvalidatedBy(store.getState(), [
          { type: "Payments" },
          { type: "Payment", id: "record" },
          { type: "PaymentsUser" },
        ]);
        assert(targets.some((row) => row.endpointName === "getPayments"));
      },
    );
    await check(
      "Failed initiation and verification stay retryable",
      async () => {
        fail = true;
        await assert.rejects(() => request("createPayment", { amount: 100 }));
        await assert.rejects(() =>
          request("checkPaymentStatus", {
            id: "record",
            userId: "owner",
          }),
        );
      },
    );
  } finally {
    for (const handle of handles) handle.unsubscribe?.();
    store.dispatch(api.util.resetApiState());
  }
  console.log(passed + "/" + passed + " payments checks passed.");
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
