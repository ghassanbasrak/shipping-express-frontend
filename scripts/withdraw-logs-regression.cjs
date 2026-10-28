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
const permissions = load("src/app/auth/permissions.ts");
const withdrawals = load("src/app/main/withdraw-requests-app/Utils.ts", {
  "src/app/auth/permissions": permissions,
});
const logs = load("src/app/main/logs-app/Utils.ts");
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (key) => key },
  validator: require(path.join(target, "node_modules/validator")),
});
const schemas = load(
  "src/app/main/withdraw-requests-app/models/WithdrawRequestSchema.ts",
  {
    "src/app/main/utils/validations": validations,
    "../../utils/currencyFormatter": (amount) => String(amount),
  },
);
const schema = schemas.withdrawRequestSchema((key) => key),
  valid = {
    amount: 115,
    availableBalance: 200,
    shipmentIds: ["s1"],
    description: "",
  };
const merchant = { id: "owner", role: "user" },
  viewer = {
    role: "employee",
    features: [{ feature: "withdraw-requests", accessView: true }],
  },
  editor = {
    role: "employee",
    features: [
      { feature: "withdraw-requests", accessView: true, accessUpdate: true },
    ],
  };
let passed = 0;
async function check(name, run) {
  await run();
  passed++;
  console.log("PASS " + name);
}
async function main() {
  await check(
    "regular withdrawals support bank and wallet backend enums",
    () => {
      assert.deepEqual(plain(withdrawals.withdrawRequestTypes), {
        withdraw: "withdrew",
        walletCharge: "walletCharge",
      });
      for (const type of ["withdrew", "walletCharge"]) {
        assert(withdrawals.toWithdrawRequestTypeTitle(type));
        assert(withdrawals.toWithdrawRequestTypeColor(type));
      }
    },
  );
  await check(
    "only staff with view and update may review pending withdrawals",
    () => {
      assert(withdrawals.canViewWithdrawRequests(merchant));
      assert(!withdrawals.canReviewWithdrawRequest(merchant, "pending"));
      assert(!withdrawals.canReviewWithdrawRequest(viewer, "pending"));
      assert(withdrawals.canReviewWithdrawRequest(editor, "pending"));
      assert(!withdrawals.canReviewWithdrawRequest(editor, "approved"));
      assert(
        !withdrawals.canReviewWithdrawRequest(
          {
            ...editor,
            features: [{ feature: "withdraw-requests", accessUpdate: true }],
          },
          "pending",
        ),
      );
    },
  );
  await check(
    "withdrawal schema permits optional notes and the exact balance limit",
    () => {
      assert(schema.safeParse(valid).success);
      assert(schema.safeParse({ ...valid, amount: 200 }).success);
    },
  );
  await check(
    "withdrawal validation rejects zero, over-balance and empty selections",
    () => {
      for (const input of [
        { ...valid, amount: 0 },
        { ...valid, amount: 201 },
        { ...valid, availableBalance: 0 },
        { ...valid, shipmentIds: [] },
      ])
        assert(!schema.safeParse(input).success);
    },
  );
  await check(
    "bank approval requires bank/reference while wallet approval does not",
    () => {
      assert(
        !schemas.withdrawRequestApprovalSchema((k) => k).safeParse({}).success,
      );
      assert(
        schemas.withdrawRequestApprovalSchema((k) => k, true).safeParse({})
          .success,
      );
      assert(
        schemas
          .withdrawRequestApprovalSchema((k) => k)
          .safeParse({ bank: "box", transactionReference: "ref" }).success,
      );
    },
  );
  const shipments = [
    { id: "s1", isCod: true, codStatus: "paid", codPrice: 115 },
    { id: "s2", isCod: true, codStatus: "paid", codPrice: 23 },
  ];
  await check("withdrawal amount is the sum of eligible shipment IDs", () => {
    assert.equal(
      withdrawals.selectedWithdrawalAmount(["s1", "s2"], shipments),
      138,
    );
    assert.equal(withdrawals.selectedWithdrawalAmount(["s2"], shipments), 23);
  });
  await check(
    "stale or duplicate selections cannot silently alter the payable amount",
    () => {
      for (const ids of [[], ["missing"], ["s1", "s1"]])
        assert.equal(
          withdrawals.selectedWithdrawalAmount(ids, shipments),
          null,
        );
      for (const patch of [
        { codStatus: "pending" },
        { isCod: false },
        { codPrice: NaN },
        { codPrice: -1 },
      ])
        assert.equal(
          withdrawals.selectedWithdrawalAmount(
            ["s1"],
            [{ ...shipments[0], ...patch }],
          ),
          null,
        );
    },
  );
  await check(
    "wallet preview removes inclusive 15 percent tax without changing gross bank amount",
    () => {
      assert.equal(withdrawals.withdrawalWalletNet(115), 100);
      assert.equal(withdrawals.withdrawalWalletNet(1), 0.87);
      assert.equal(shipments[0].codPrice, 115);
    },
  );
  const toolkit = require(path.join(target, "node_modules/@reduxjs/toolkit")),
    rootReducer = { inject: () => {} };
  // injectInto needs a selector-capable reducer; retain the actual slice reducer/actions for state tests.
  const fakeCreateSlice = (options) => {
    const slice = toolkit.createSlice(options);
    slice.injectInto = () => ({ selectors: slice.selectors });
    return slice;
  };
  const slices = [
    [
      "WithdrawRequests",
      load(
        "src/app/main/withdraw-requests-app/store/withdrawRequestsSlice.js",
        {
          "@reduxjs/toolkit": { createSlice: fakeCreateSlice },
          "app/store/lazyLoadedSlices": { rootReducer },
        },
      ),
      withdrawals.invalidWithdrawalDates,
    ],
    [
      "Logs",
      load("src/app/main/logs-app/store/logsSlice.js", {
        "@reduxjs/toolkit": { createSlice: fakeCreateSlice },
        "app/store/lazyLoadedSlices": { rootReducer },
      }),
      logs.invalidLogDates,
    ],
  ];
  await check(
    "both date reducers retain valid bounds and flag invalid input",
    () => {
      for (const [name, slice, invalid] of slices) {
        let value = slice.default(
          undefined,
          slice["set" + name + "DateFromFilter"](new Date("2026-01-01")),
        );
        value = slice.default(
          value,
          slice["set" + name + "DateFromFilter"](new Date("bad")),
        );
        assert.equal(value.dateFromFilter, "2026-01-01T00:00:00.000Z");
        assert(invalid(value));
        value = slice.default(
          value,
          slice["set" + name + "DateFromFilter"](null),
        );
        assert(!invalid(value));
        assert(
          invalid({ dateFromFilter: "2026-10-01", dateToFilter: "2026-01-01" }),
        );
      }
    },
  );
  await check("search/status/type changes reset server pagination", () => {
    for (const [name, slice] of slices) {
      let value = slice.default(undefined, slice["set" + name + "Page"](4));
      value = slice.default(
        value,
        slice["set" + name + "SearchText"]({ target: { value: "a & #" } }),
      );
      assert.equal(value.page, 0);
      assert.equal(value.searchText, "a & #");
    }
  });
  await check(
    "logs remain administrator-only even for unrestricted employees",
    () => {
      assert(
        logs.canViewLogs({ role: "admin", features: [{ feature: "other" }] }),
      );
      assert(!logs.canViewLogs({ role: "employee" }));
      assert(!logs.canViewLogs(merchant));
    },
  );
  await check(
    "historical log snapshots retain arrays and support both stored layouts",
    () => {
      const snapshot = { receiverName: "Historical receiver" },
        log = { meta: { data: snapshot } };
      assert.equal(logs.logSnapshots(log)[0], snapshot);
      assert.equal(logs.logSnapshots({ data: snapshot })[0], snapshot);
      assert.equal(
        logs.logSnapshots({ meta: { data: [snapshot, snapshot] } }).length,
        2,
      );
      assert.equal(logs.logSnapshots({}).length, 0);
    },
  );
  await check(
    "log shipment links require explicit shipment identity and encode each route segment",
    () => {
      assert.equal(
        logs.logShipmentPath({
          id: "LOG",
          meta: { data: { id: "TRANSACTION", trackingNumber: "TRACK" } },
        }),
        null,
      );
      assert.equal(
        logs.logShipmentPath({
          shipment: {
            id: "s/#",
            shippingCompanyId: "carrier",
            method: "local",
          },
        }),
        "/shipments/carrier/local/s%2F%23",
      );
      assert.equal(
        logs.logShipmentPath({
          meta: {
            data: {
              shipmentId: "ship",
              shippingCompanyId: "carrier",
              method: "local",
            },
          },
        }),
        "/shipments/carrier/local/ship",
      );
      assert.equal(
        logs.logShipmentPath({ data: { shipment: { id: "actual" } } }),
        "/shipments/all/all/actual",
      );
    },
  );
  const captured = [];
  let failWrite = false;
  const api = createApi({
    reducerPath: "withdrawLogsTest",
    keepUnusedDataFor: 0,
    endpoints: () => ({}),
    baseQuery: async (req) => {
      captured.push(req);
      if (failWrite && req.method)
        return { error: { status: 500, data: { message: "failed" } } };
      return {
        data: req.url.includes("available-for-withdrew")
          ? { amount: 200 }
          : req.method
            ? { id: "actual", ...req.data }
            : { results: [], total: 0 },
      };
    },
  });
  load("src/app/main/withdraw-requests-app/WithdrawRequestsApi.ts", {
    "app/store/apiService": { apiService: api },
  });
  load("src/app/main/logs-app/LogsApi.ts", {
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
      "withdrawal list keeps repeated backend type parameters and all visible filters",
      async () => {
        await request("getWithdrawRequests", {
          page: 2,
          pageSize: 10,
          searchText: "A & B + #",
          userIdFilter: "owner",
          updatedByIdFilter: "reviewer",
          statusFilter: "pending",
          dateFromFilter: "2026-01-01",
          dateToFilter: "2026-10-01",
        });
        const req = captured.at(-1);
        assert.equal(req.url, "v1/requests?type=withdrew&type=walletCharge");
        assert.deepEqual(plain(req.params), {
          page: 2,
          pageSize: 10,
          search: "A & B + #",
          userId: "owner",
          updatedById: "reviewer",
          status: "pending",
          dateFrom: "2026-01-01",
          dateTo: "2026-10-01",
        });
      },
    );
    await check(
      "withdrawal export preserves 500000-row source contract and omits all sentinels",
      async () => {
        await request("getWithdrawRequests", {
          page: 0,
          pageSize: 500000,
          userIdFilter: "all",
          statusFilter: "all",
          updatedByIdFilter: "all",
        });
        assert.deepEqual(plain(captured.at(-1).params), {
          page: 0,
          pageSize: 500000,
        });
      },
    );
    await check(
      "available withdrawal balance uses its dedicated account endpoint",
      async () => {
        const result = await request("getWithdrawBalance", "owner");
        assert.equal(
          captured.at(-1).url,
          "v1/requests/available-for-withdrew/owner",
        );
        assert.equal(result.amount, 200);
      },
    );
    await check(
      "eligible shipments use current-account paid COD query with original limit",
      async () => {
        await request("getWithdrawRequestShipments");
        assert.equal(captured.at(-1).url, "v1/shipments");
        assert.deepEqual(plain(captured.at(-1).params), {
          page: 0,
          pageSize: 1000,
          isCod: true,
          codStatus: "paid",
        });
      },
    );
    await check(
      "both withdrawal types create only editable fields plus fixed pending status",
      async () => {
        for (const type of ["withdrew", "walletCharge"]) {
          await request("createWithdrawRequest", {
            ...valid,
            userId: "owner",
            type,
            status: "approved",
            user: { id: "fake" },
            description: "",
          });
          assert.deepEqual(plain(captured.at(-1).data), {
            amount: 115,
            userId: "owner",
            type,
            shipmentIds: ["s1"],
            status: "pending",
          });
        }
      },
    );
    await check(
      "approval and refusal target actual request ID and omit non-editable metadata",
      async () => {
        await request("setWithdrawRequestStatus", {
          id: "actual-request",
          status: "approved",
          bank: "box",
          transactionReference: "REF",
          transactionDescription: "",
          transactionImageUrl: "",
          user: { id: "fake" },
          amount: 999,
        });
        assert.equal(captured.at(-1).url, "v1/requests/actual-request");
        assert.deepEqual(plain(captured.at(-1).data), {
          status: "approved",
          bank: "box",
          transactionReference: "REF",
        });
        await request("setWithdrawRequestStatus", {
          id: "wallet",
          status: "approved",
        });
        assert.deepEqual(plain(captured.at(-1).data), { status: "approved" });
        await request("setWithdrawRequestStatus", {
          id: "bank",
          status: "rejected",
          bank: "ignored",
        });
        assert.deepEqual(plain(captured.at(-1).data), { status: "rejected" });
      },
    );
    await check(
      "failed creation/decision requests reject and can be retried",
      async () => {
        failWrite = true;
        await assert.rejects(() =>
          request("createWithdrawRequest", {
            ...valid,
            userId: "owner",
            type: "withdrew",
          }),
        );
        await assert.rejects(() =>
          request("setWithdrawRequestStatus", {
            id: "actual",
            status: "rejected",
          }),
        );
        failWrite = false;
        await request("setWithdrawRequestStatus", {
          id: "actual",
          status: "rejected",
        });
      },
    );
    await check(
      "creation invalidates the withdrawal list, balance and eligible shipment cache",
      async () => {
        await request("getWithdrawRequests", { page: 0, pageSize: 10 }, true);
        await request("getWithdrawBalance", "owner", true);
        await request("getWithdrawRequestShipments", undefined, true);
        const counts = () => captured.filter((req) => !req.method).length,
          before = counts();
        await request("createWithdrawRequest", {
          ...valid,
          userId: "owner",
          type: "walletCharge",
        });
        await new Promise((r) => setTimeout(r, 20));
        assert(counts() >= before + 3);
      },
    );
    await check(
      "logs queries preserve search/type/account/date scopes and omit all sentinels",
      async () => {
        await request("getLogs", {
          page: 3,
          pageSize: 10,
          searchText: "A & #",
          typeFilter: "shipment",
          userIdFilter: "owner",
          dateFromFilter: "2026-01-01",
          dateToFilter: "2026-10-01",
        });
        assert.equal(captured.at(-1).url, "v1/logs");
        assert.deepEqual(plain(captured.at(-1).params), {
          page: 3,
          pageSize: 10,
          search: "A & #",
          type: "shipment",
          userId: "owner",
          dateFrom: "2026-01-01",
          dateTo: "2026-10-01",
        });
        await request("getLogs", {
          page: 0,
          pageSize: 10,
          typeFilter: "all",
          userIdFilter: "all",
        });
        assert.deepEqual(plain(captured.at(-1).params), {
          page: 0,
          pageSize: 10,
        });
      },
    );
    await check(
      "log detail reads the actual ID and provides no log mutation endpoints",
      async () => {
        await request("getLog", "historical-log");
        assert.equal(captured.at(-1).url, "v1/logs/historical-log");
        assert(
          !Object.keys(api.endpoints).some((name) =>
            /^(create|update|delete|remove|set).*Log/.test(name),
          ),
        );
      },
    );
  } finally {
    handles.forEach((handle) => handle.unsubscribe?.());
    store.dispatch(api.util.resetApiState());
  }
  console.log(`${passed}/${passed} withdrawal/logs regression checks passed.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
