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
    fs.readFileSync(path.join(target, file), "utf8"),
    {
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

const plain = (x) => JSON.parse(JSON.stringify(x));
const base = "src/app/main/transactions-app/",
  reports = "src/app/main/transaction-reports-app/";
const permissions = load("src/app/auth/permissions.ts");
const utils = load(base + "Utils.ts", {
  "src/app/auth/permissions": permissions,
  "../countries-app/Utils": {
    displayName: (value) =>
      typeof value === "string" ? value : value?.en || value?.ar || "",
  },
});
const lodash = require(path.join(target, "node_modules/lodash"));
const model = load(base + "models/TransactionModel.ts", { "@lodash": lodash });
const validators = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (key) => key },
  validator: require(path.join(target, "node_modules/validator")),
});
const schema = load(base + "models/TransactionSchema.ts", {
  "src/app/main/utils/validations": validators,
  "../Utils": utils,
}).transactionSchema((key) => key);
const admin = { id: "staff-1", role: "admin" },
  merchant = { id: "owner", role: "user", balance: 100, codBalance: 20 };
const valid = {
  userId: "owner",
  type: "deposit",
  relatedBalance: "wallet",
  amount: 115,
  applyTax: true,
  operationType: "custom",
  notes: "",
};
let passed = 0;
async function check(name, run) {
  await run();
  passed++;
  console.log("PASS " + name);
}
async function main() {
  await check(
    "transaction enums retain exact backend title identifiers and valid custom adjustments",
    () => {
      assert.equal(
        utils.transactionTitleTypes.withdrawRequest,
        "withdrew request",
      );
      assert.equal(utils.transactionTitleTypes.balanceTopUp, "top-up balance");
      assert.equal(Object.values(utils.transactionTitleTypes).length, 13);
      for (const [values, title, color] of [
        [
          utils.transactionTypes,
          utils.toTransactionTypeTitle,
          utils.toTransactionTypeColor,
        ],
        [
          utils.relatedBalanceTypes,
          utils.toRelatedBalanceTypeTitle,
          utils.toRelatedBalanceTypeColor,
        ],
        [
          utils.depositTransactionTypes,
          utils.toDepositTransactionTypeTitle,
          utils.toDepositTransactionTypeColor,
        ],
        [
          utils.withdrawTransactionTypes,
          utils.toWithdrawTransactionTypeTitle,
          utils.toWithdrawTransactionTypeColor,
        ],
      ])
        for (const value of Object.values(values)) {
          assert.notEqual(title(value), "UNKNOWN");
          assert.ok(color(value));
        }
    },
  );
  await check(
    "new defaults include custom operation and tax while loaded records are cloned without implicit retaxation",
    () => {
      const value = model.default();
      assert.equal(value.amount, 0);
      assert.equal(value.operationType, "custom");
      assert.equal(value.applyTax, true);
      const original = {
        id: "tx-1",
        ...valid,
        user: { ...merchant },
        invoice: { id: "invoice", url: "https://example.test" },
      };
      delete original.applyTax;
      const loaded = model.default(original);
      loaded.user.balance = 9;
      loaded.invoice.id = "changed";
      assert.equal(original.user.balance, 100);
      assert.equal(original.invoice.id, "invoice");
      assert.equal(loaded.applyTax, false);
      assert.equal(loaded.id, "tx-1");
    },
  );
  await check(
    "account and positive numeric amount are required; inactive reset is rejected",
    () => {
      assert.equal(schema.safeParse(valid).success, true);
      for (const change of [
        { userId: "" },
        { amount: 0 },
        { amount: -1 },
        { amount: undefined },
        { amount: NaN },
        { amount: "115" },
        { type: "reset" },
        { relatedBalance: "arbitrary" },
      ])
        assert.equal(
          schema.safeParse({ ...valid, ...change }).success,
          false,
          JSON.stringify(change),
        );
    },
  );
  await check(
    "gross wallet deposits remove inclusive tax and preview the actual credited net amount",
    () => {
      assert.deepEqual(plain(utils.removeTransactionTax(115)), {
        netAmount: 100,
        taxAmount: 15,
      });
      assert.deepEqual(
        plain(utils.transactionBalancePreview(valid, merchant)),
        {
          previousBalance: 100,
          netAmount: 100,
          taxAmount: 15,
          currentBalance: 200,
        },
      );
    },
  );
  await check(
    "wallet withdrawal and COD changes ignore tax and retain permitted negative balances",
    () => {
      assert.equal(
        utils.transactionBalancePreview(
          { ...valid, type: "withdraw" },
          merchant,
        ).currentBalance,
        -15,
      );
      assert.equal(
        utils.transactionBalancePreview(
          { ...valid, relatedBalance: "cod" },
          merchant,
        ).currentBalance,
        135,
      );
      assert.equal(
        utils.transactionBalancePreview(
          { ...valid, relatedBalance: "cod" },
          merchant,
        ).taxAmount,
        0,
      );
      assert.equal(
        utils.transactionBalancePreview({ ...valid, applyTax: false }, merchant)
          .currentBalance,
        215,
      );
    },
  );
  await check(
    "historical gross display follows exact wallet deposit invoice/taxable and cutoff rules",
    () => {
      const row = {
        ...valid,
        amount: 100,
        createdAt: "2025-06-02T00:00:00Z",
        taxable: true,
      };
      assert.ok(Math.abs(utils.transactionAmountWithTax(row) - 115) < 1e-9);
      for (const change of [
        { createdAt: "2025-06-01T00:00:00Z" },
        { type: "withdraw" },
        { relatedBalance: "cod" },
        { taxable: false },
      ])
        assert.equal(
          utils.transactionAmountWithTax({ ...row, ...change }),
          undefined,
        );
    },
  );
  await check(
    "wallet payload strips populations and prefixes operation notes without mutating or duplicating drafts",
    () => {
      const input = Object.freeze({
        ...valid,
        id: "tx-1",
        user: merchant,
        operationType: "bankTransferRajhi",
        notes: "Bank confirmation",
        createdAt: "date",
      });
      const payload = utils.transactionSaveValues(input, (key) => key);
      assert.deepEqual(plain(payload), {
        userId: "owner",
        type: "deposit",
        relatedBalance: "wallet",
        amount: 115,
        operationType: "bankTransferRajhi",
        notes: "BANK_TRANSFER_RAJHI - Bank confirmation",
        applyTax: true,
      });
      assert.equal(input.notes, "Bank confirmation");
      assert.equal(
        utils.transactionSaveValues(
          { ...input, notes: payload.notes },
          (key) => key,
        ).notes,
        payload.notes,
      );
    },
  );
  await check(
    "COD payload drops wallet operation and tax while withdrawals omit applyTax",
    () => {
      assert.deepEqual(
        plain(
          utils.transactionSaveValues(
            { ...valid, relatedBalance: "cod", notes: "COD note" },
            (key) => key,
          ),
        ),
        {
          userId: "owner",
          type: "deposit",
          relatedBalance: "cod",
          amount: 115,
          notes: "COD note",
        },
      );
      assert.equal(
        "applyTax" in
          utils.transactionSaveValues(
            { ...valid, type: "withdraw" },
            (key) => key,
          ),
        false,
      );
    },
  );
  await check(
    "wallet and COD transaction-title choices remain disjoint and complete",
    () => {
      assert.equal(utils.transactionTitleOptions("cod").length, 4);
      assert.equal(utils.transactionTitleOptions("wallet").length, 9);
      assert.equal(utils.transactionTitleOptions("all").length, 13);
      assert.equal(
        utils
          .transactionTitleOptions("wallet")
          .includes("cod shipment payment"),
        false,
      );
    },
  );
  await check(
    "locale/string statements and missing account names render without losing content",
    () => {
      assert.equal(
        utils.transactionStatement({
          title: "Plain title",
          description: { en: "Description" },
          notes: "Notes",
        }),
        "Plain title / Description / Notes",
      );
      assert.equal(utils.transactionUserLabel({ id: "owner" }), "owner");
      assert.equal(
        utils.transactionUserLabel({ id: "owner", email: "a@example.test" }),
        "a@example.test",
      );
    },
  );
  await check(
    "view/create/update permissions remain scoped to the selected balance and staff role",
    () => {
      const wallet = {
        id: "staff",
        role: "employee",
        features: [
          { feature: "transactions", accessView: true, accessCreate: true },
        ],
      };
      assert.deepEqual(plain(utils.availableTransactionBalances(wallet)), [
        "wallet",
      ]);
      assert.equal(utils.canManageTransaction(wallet, "wallet"), true);
      assert.equal(utils.canManageTransaction(wallet, "wallet", true), false);
      assert.equal(utils.canManageTransaction(wallet, "cod"), false);
      assert.equal(utils.canManageTransaction(merchant, "wallet"), false);
      assert.equal(
        utils.canManageTransaction(
          {
            ...wallet,
            features: [
              {
                feature: "transactions",
                accessView: false,
                accessCreate: true,
              },
            ],
          },
          "wallet",
        ),
        false,
      );
    },
  );
  await check(
    "special all/new route retains merchant-update plus ledger-create middleware requirements",
    () => {
      const staff = {
        id: "staff",
        role: "employee",
        features: [
          { feature: "transactions", accessView: true, accessCreate: true },
        ],
      };
      assert.equal(
        permissions.hasPagePermission("/transactions/owner/all/new", staff),
        false,
      );
      staff.features.push({ feature: "merchants", accessUpdate: true });
      assert.equal(
        permissions.hasPagePermission("/transactions/owner/all/new", staff),
        true,
      );
    },
  );
  const toolkit = require(path.join(target, "node_modules/@reduxjs/toolkit"));
  const imports = {
    "@reduxjs/toolkit": toolkit,
    "app/store/lazyLoadedSlices": { rootReducer: toolkit.combineSlices() },
  };
  const slice = load(base + "store/transactionsSlice.js", imports),
    reportSlice = load(reports + "store/transactionReportsSlice.js", imports);
  await check(
    "both JavaScript slices reset pages for effective filters and preserve ten-row pagination",
    () => {
      for (const [module, prefix] of [
        [slice, "Transactions"],
        [reportSlice, "TransactionReports"],
      ]) {
        let value = module.default(
          undefined,
          module["new" + prefix + "Instance"]({ userIdFilter: "owner" }),
        );
        assert.equal(value.pageSize, 10);
        for (const [suffix, arg] of [
          ["SearchText", { target: { value: "A & B" } }],
          ["UserIdFilter", "another"],
          ["CreatedByIdFilter", "reviewer"],
          [
            "TitleTypeFilter",
            prefix === "Transactions" ? ["new shipment"] : "new shipment",
          ],
          ["RelatedBalanceTypeFilter", "cod"],
          ["DateFromFilter", new Date("2026-01-01")],
          ["DateToFilter", new Date("2026-10-01")],
        ]) {
          value = module.default(value, module["set" + prefix + "Page"](3));
          value = module.default(value, module["set" + prefix + suffix](arg));
          assert.equal(value.page, 0);
        }
        assert.equal(typeof value.dateFromFilter, "string");
      }
    },
  );
  await check(
    "balance changes clear incompatible title filters in both list contexts",
    () => {
      let value = slice.default(
        undefined,
        slice.setTransactionsTitleTypeFilter(["new shipment"]),
      );
      value = slice.default(
        value,
        slice.setTransactionsRelatedBalanceTypeFilter("cod"),
      );
      assert.deepEqual(plain(value.titleTypeFilter), []);
      value = reportSlice.default(
        undefined,
        reportSlice.setTransactionReportsTitleTypeFilter("new shipment"),
      );
      value = reportSlice.default(
        value,
        reportSlice.setTransactionReportsRelatedBalanceTypeFilter("cod"),
      );
      assert.equal(value.titleTypeFilter, "all");
    },
  );
  await check(
    "invalid date input blocks reports without silently dropping the previous valid scope",
    () => {
      let value = reportSlice.default(
        undefined,
        reportSlice.setTransactionReportsDateFromFilter(new Date("2026-01-01")),
      );
      value = reportSlice.default(
        value,
        reportSlice.setTransactionReportsDateFromFilter(new Date("invalid")),
      );
      assert.equal(value.dateFromFilter, "2026-01-01T00:00:00.000Z");
      assert.equal(utils.transactionDatesValid(value), false);
      value = reportSlice.default(
        value,
        reportSlice.setTransactionReportsDateFromFilter(null),
      );
      assert.equal(utils.transactionDatesValid(value), true);
      assert.equal(value.dateFromFilter, "");
      assert.equal(
        utils.transactionDatesValid({
          dateFromFilter: "2026-10-01",
          dateToFilter: "2026-01-01",
        }),
        false,
      );
    },
  );
  const axios = require(
      path.join(target, "node_modules/axios/dist/node/axios.cjs"),
    ),
    MockAdapter = require(path.join(target, "node_modules/axios-mock-adapter"));
  const client = axios.create({ baseURL: "https://transactions.example.test" }),
    mock = new MockAdapter(client);
  const api = createApi({
    reducerPath: "transactionsTest",
    endpoints: () => ({}),
    keepUnusedDataFor: 0,
    baseQuery: async (request) => {
      try {
        return { data: (await client.request(request)).data };
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
  load(base + "TransactionsApi.ts", {
    "app/store/apiService": { apiService: api },
  });
  load(reports + "TransactionReportsApi.ts", {
    "app/store/apiService": { apiService: api },
  });
  const store = configureStore({
      reducer: { [api.reducerPath]: api.reducer },
      middleware: (get) => get().concat(api.middleware),
    }),
    handles = [];
  async function request(name, arg, options = { forceRefetch: true }) {
    const result = store.dispatch(api.endpoints[name].initiate(arg, options));
    handles.push(result);
    return result.unwrap();
  }
  const filters = {
    page: 2,
    pageSize: 10,
    searchText: "A & B",
    titleTypeFilter: ["new shipment", "bags request"],
    relatedBalanceTypeFilter: "wallet",
    userIdFilter: "owner",
    createdByIdFilter: "staff-1",
    dateFromFilter: "2026-01-01",
    dateToFilter: "2026-10-01",
  };
  const row = { ...valid, id: "tx-1", reference: "TX-1", user: merchant };
  try {
    await check(
      "transaction list preserves account/staff/date scopes and repeated encoded transactionTitle parameters",
      async () => {
        mock.onGet("v1/transactions").reply((config) => {
          assert.deepEqual(config.params, {
            page: 2,
            pageSize: 10,
            search: "A & B",
            transactionTitle: ["new shipment", "bags request"],
            relatedBalance: "wallet",
            userId: "owner",
            createdById: "staff-1",
            dateFrom: "2026-01-01",
            dateTo: "2026-10-01",
          });
          const url = client.getUri(config);
          assert.equal(
            new URL(url).searchParams.getAll("transactionTitle").length,
            2,
          );
          assert.equal(new URL(url).searchParams.get("search"), "A & B");
          return [200, { results: [row], total: 21 }];
        });
        assert.equal((await request("getTransactions", filters)).total, 21);
      },
    );
    await check(
      "all sentinels and empty arrays are omitted and export-all uses the same endpoint",
      async () => {
        mock.onGet("v1/transactions").reply((config) => {
          assert.deepEqual(config.params, { page: 0, pageSize: 50000 });
          return [200, { results: [], total: 0 }];
        });
        await request("getTransactions", {
          page: 0,
          pageSize: 50000,
          relatedBalanceTypeFilter: "all",
          userIdFilter: "all",
          createdByIdFilter: "all",
          titleTypeFilter: [],
        });
      },
    );
    await check(
      "selected account and search endpoints preserve IDs and current search text",
      async () => {
        mock
          .onGet("v1/users/outside-page")
          .reply(200, { id: "outside-page", firstName: "Outside" });
        assert.equal(
          (await request("getTransactionsAccount", "outside-page")).id,
          "outside-page",
        );
        mock.onGet("v1/users").reply((config) => {
          assert.deepEqual(config.params, {
            type: "user",
            search: "Beta & More",
          });
          return [200, { results: [merchant], total: 1 }];
        });
        await request("getTransactionsUsers", { searchText: "Beta & More" });
      },
    );
    await check(
      "detail GET preserves real entity/population/invoice IDs",
      async () => {
        mock.onGet("v1/transactions/tx-1").reply(200, {
          ...row,
          invoiceId: "invoice-1",
          invoice: { id: "invoice-1", zohoInvoiceId: "ZOHO-1" },
        });
        const value = await request("getTransaction", "tx-1");
        assert.equal(value.invoice.id, "invoice-1");
        assert.equal(value.user.id, "owner");
      },
    );
    await check(
      "create sends exact wallet fields and never sends cached entity metadata",
      async () => {
        mock.onGet("v1/transactions").reply(200, { results: [row], total: 1 });
        mock.onPost("v1/transactions").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), valid);
          return [201, row];
        });
        const input = {
          ...valid,
          id: "forged",
          user: merchant,
          createdById: "forged",
        };
        delete input.notes;
        mock.onPost("v1/transactions").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), {
            userId: "owner",
            type: "deposit",
            relatedBalance: "wallet",
            amount: 115,
            operationType: "custom",
            applyTax: true,
          });
          return [201, row];
        });
        assert.equal((await request("createTransaction", input)).id, "tx-1");
      },
    );
    await check(
      "COD writes exclude applyTax/operationType and PATCH targets the actual entity ID",
      async () => {
        mock.onPatch("v1/transactions/tx-1").reply((config) => {
          assert.deepEqual(JSON.parse(config.data), {
            userId: "owner",
            type: "withdraw",
            relatedBalance: "cod",
            amount: 15,
            notes: "COD note",
          });
          return [200, row];
        });
        await request("updateTransaction", {
          id: "tx-1",
          value: {
            ...valid,
            type: "withdraw",
            relatedBalance: "cod",
            amount: 15,
            notes: "COD note",
          },
        });
      },
    );
    await check(
      "report lists preserve scalar transaction title and wallet/COD filters",
      async () => {
        mock.onGet("v1/transactions").reply((config) => {
          assert.deepEqual(config.params, {
            page: 1,
            pageSize: 10,
            transactionTitle: "cod shipment payment",
            relatedBalance: "cod",
            userId: "owner",
            dateFrom: "2026-01-01",
          });
          return [200, { results: [row], total: 15 }];
        });
        await request("getTransactionReports", {
          page: 1,
          pageSize: 10,
          userIdFilter: "owner",
          relatedBalanceTypeFilter: "cod",
          titleTypeFilter: "cod shipment payment",
          dateFromFilter: "2026-01-01",
        });
      },
    );
    await check(
      "PDF and XLSX report generation always starts from page zero with complete filter scope",
      async () => {
        mock.onGet("v1/transactions/report").reply((config) => {
          assert.deepEqual(config.params, {
            reportType: config.params.reportType,
            page: 0,
            pageSize: 50000,
            transactionTitle: "new shipment",
            relatedBalance: "wallet",
            userId: "owner",
            dateFrom: "2026-01-01",
            dateTo: "2026-10-01",
          });
          return [
            200,
            {
              url:
                "https://reports.example.test/file." + config.params.reportType,
            },
          ];
        });
        for (const type of ["pdf", "xlsx"])
          assert.ok(
            (
              await request("getTransactionReportFile", {
                page: 3,
                pageSize: 10,
                userIdFilter: "owner",
                titleTypeFilter: "new shipment",
                relatedBalanceTypeFilter: "wallet",
                dateFromFilter: "2026-01-01",
                dateToFilter: "2026-10-01",
                reportType: type,
              })
            ).url.endsWith(type),
          );
      },
    );
    await check(
      "merchant-style reports omit route owner sentinels and rely on backend current-account scope",
      async () => {
        mock.onGet("v1/transactions/report").reply((config) => {
          assert.deepEqual(config.params, {
            reportType: "pdf",
            page: 0,
            pageSize: 50000,
            relatedBalance: "wallet",
          });
          return [200, { url: "https://reports.example.test/me.pdf" }];
        });
        await request("getTransactionReportFile", {
          page: 0,
          pageSize: 10,
          userIdFilter: "all",
          relatedBalanceTypeFilter: "wallet",
          titleTypeFilter: "all",
          reportType: "pdf",
        });
      },
    );
    await check(
      "failed writes reject, keep retry possible and never call deletion or invoice generation",
      async () => {
        mock.onGet("v1/transactions").reply(200, { results: [row], total: 1 });
        mock.onPost("v1/transactions").reply(500, { message: "failed" });
        await assert.rejects(request("createTransaction", valid));
        assert.equal(mock.history.delete.length, 0);
        assert.equal(
          mock.history.post.some((x) => x.url.includes("zoho")),
          false,
        );
        mock.onPost("v1/transactions").reply(201, row);
        await request("createTransaction", valid);
      },
    );
    await check(
      "successful writes invalidate ledger/report, actual detail and account balance caches",
      () => {
        const queries = api.util.selectInvalidatedBy(store.getState(), [
          "Transactions",
        ]);
        assert.ok(queries.some((x) => x.endpointName === "getTransactions"));
        assert.ok(
          queries.some((x) => x.endpointName === "getTransactionReports"),
        );
        assert.ok(
          api.util
            .selectInvalidatedBy(store.getState(), [
              { type: "Transaction", id: "tx-1" },
            ])
            .some((x) => x.endpointName === "getTransaction"),
        );
        assert.equal(
          api.util.selectInvalidatedBy(store.getState(), [
            { type: "Transaction", id: "other" },
          ]).length,
          0,
        );
      },
    );
  } finally {
    for (const result of handles) {
      result.unsubscribe?.();
      result.reset?.();
    }
    store.dispatch(api.util.resetApiState());
    mock.restore();
  }
  await check(
    "shared ledger/report/shipment columns match sizing rules and expose only active invoice links",
    () => {
      const tableTypes = { normal: 0, money: 1, date: 2, actions: 3 };
      const fields = load(base + "shared-components/TransactionFields.tsx", {
        "../Utils": utils,
        "../../countries-app/Utils": {
          displayName: (x) => (typeof x === "string" ? x : x?.en || ""),
        },
        "app/shared-components/custom-table/Utils": {
          TableDataTypes: tableTypes,
        },
      }).default;
      for (const who of [admin, merchant])
        for (const context of ["ledger", "report", "shipment"])
          for (const balance of ["wallet", "cod"])
            for (const field of fields((key) => key, who, balance, context))
              assert.ok(Math.abs(field.minWidth - field.flex * 100) < 1e-8);
      assert.ok(
        fields((key) => key, admin, "wallet").some(
          (field) => field.id === "taxable",
        ),
      );
      assert.equal(
        fields((key) => key, merchant, "wallet").some(
          (field) => field.id === "taxable",
        ),
        false,
      );
      assert.equal(
        fields((key) => key, admin, "cod").some(
          (field) => field.id === "actions",
        ),
        false,
      );
      assert.equal(
        fields((key) => key, admin, "wallet").find(
          (field) => field.id === "actions",
        ).actions.length,
        1,
      );
    },
  );
  await check(
    "report download checks status and cleans temporary links/object URLs",
    async () => {
      let clicked = 0,
        removed = 0,
        revoked = 0;
      const module = load(
        reports + "Utils.ts",
        {},
        {
          fetch: async () => ({ ok: true, blob: async () => ({}) }),
          URL: {
            createObjectURL: () => "blob:test",
            revokeObjectURL: () => revoked++,
          },
          document: {
            createElement: () => ({
              style: {},
              click: () => clicked++,
              remove: () => removed++,
            }),
            body: { appendChild: () => {} },
          },
        },
      );
      await module.downloadTransactionReport(
        "https://reports.example.test/file",
        "report.pdf",
      );
      assert.equal(clicked, 1);
      assert.equal(removed, 1);
      assert.equal(revoked, 1);
      const failing = load(
        reports + "Utils.ts",
        {},
        { fetch: async () => ({ ok: false }) },
      );
      await assert.rejects(
        failing.downloadTransactionReport("url", "file"),
        /download failed/,
      );
    },
  );
  await check(
    "invoice/report links reject invalid protocols and administrator audit links are now enabled",
    () => {
      assert.equal(utils.safeTransactionUrl("javascript:alert(1)"), undefined);
      assert.equal(
        utils.safeTransactionUrl("https://example.test/invoice"),
        "https://example.test/invoice",
      );
      const adminUtils = load("src/app/main/admins-app/Utils.ts", {
        "@lodash": lodash,
      });
      for (const title of [
        "VIEW_RELATED_TRANSACTIONS",
        "VIEW_RELATED_COD_TRANSACTIONS",
      ]) {
        const link = adminUtils.adminRelatedLinks.find(
          (x) => x.title === title,
        );
        assert.equal(link.available, true);
        assert.ok(link.path("staff-1").includes("createdById=staff-1"));
      }
    },
  );
  console.log(
    `${passed}/${passed} transaction/report regression checks passed.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
