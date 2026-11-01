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
const permissions = load("src/app/auth/permissions.ts"),
  utils = load("src/app/main/balance-errors-app/Utils.ts", {
    "src/app/auth/permissions": permissions,
    "date-fns": require(path.join(target, "node_modules/date-fns")),
  });
const validations = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (k) => k },
  validator: require(path.join(target, "node_modules/validator")),
});
const schema = load(
  "src/app/main/balance-errors-app/models/BalanceErrorsSchema.ts",
  { "src/app/main/utils/validations": validations, "../Utils": utils },
).balanceErrorsSchema((k) => k);
let passed = 0;
async function check(name, run) {
  await run();
  passed++;
  console.log("PASS " + name);
}
async function main() {
  await check("Unrestricted staff can read the balance audit", () => {
    for (const role of ["admin", "employee"])
      assert(utils.canViewBalanceErrors({ role }));
  });
  await check("Merchant accounts cannot read cross-account audit data", () =>
    assert(!utils.canViewBalanceErrors({ role: "user", features: [] })),
  );
  await check(
    "Restricted staff need the original route view grant, not a wallet alias",
    () => {
      assert(
        utils.canViewBalanceErrors({
          role: "employee",
          features: [
            { feature: "balance-duplication-errors", accessView: true },
          ],
        }),
      );
      assert(
        !utils.canViewBalanceErrors({
          role: "admin",
          features: [{ feature: "transactions", accessView: true }],
        }),
      );
      assert(
        !utils.canViewBalanceErrors({
          role: "employee",
          features: [
            { feature: "balance-duplication-errors", accessUpdate: true },
          ],
        }),
      );
    },
  );
  await check(
    "Both duplicate and completed source boolean statuses retain titles/colors",
    () => {
      assert.equal(
        utils.toBalanceErrorStatusTitle(true),
        "BALANCE_DUPLICATION",
      );
      assert.equal(
        utils.toBalanceErrorStatusTitle(false),
        "COMPLETED_TRANSACTION",
      );
      assert.equal(
        utils.toBalanceErrorStatusTitle(undefined),
        "COMPLETED_TRANSACTION",
      );
      assert.notEqual(
        utils.toBalanceErrorStatusColor(true),
        utils.toBalanceErrorStatusColor(false),
      );
    },
  );
  await check(
    "Date validation accepts real leap dates and rejects rollover dates",
    () => {
      assert(utils.isBalanceErrorDate("2024-02-29"));
      for (const value of [
        "2025-02-29",
        "2026-04-31",
        "2026-13-01",
        "2026-00-01",
        "2026-01-00",
      ])
        assert(!utils.isBalanceErrorDate(value));
    },
  );
  await check(
    "Blank and partial date fields cannot broaden an audit query",
    () => {
      for (const value of ["", "2026-1-1", "01/01/2026", "bad"])
        assert(
          !schema.safeParse({ dateFrom: value, dateTo: "2026-10-26" }).success,
        );
    },
  );
  await check("Reversed dates fail and same-day audits remain valid", () => {
    assert(
      !schema.safeParse({ dateFrom: "2026-10-27", dateTo: "2026-10-26" })
        .success,
    );
    assert(
      schema.safeParse({ dateFrom: "2026-10-26", dateTo: "2026-10-26" })
        .success,
    );
  });
  await check(
    "Backend dates retain source day/month/year without timezone shifts",
    () => {
      assert.equal(utils.balanceErrorApiDate("2026-01-09"), "09/01/2026");
      assert.throws(() => utils.balanceErrorApiDate("2026-02-30"));
    },
  );
  await check("Today defaults use the local calendar day", () =>
    assert.equal(
      utils.balanceErrorToday(new Date(2026, 0, 2, 23, 45)),
      "2026-01-02",
    ),
  );
  await check(
    "Invalid historical timestamps render a fallback without throwing",
    () => {
      assert.equal(utils.balanceErrorDate("bad"), "");
      assert.equal(utils.balanceErrorDate(undefined), "");
      assert(
        utils.balanceErrorDate("2026-10-20T12:00:00Z").startsWith("20/10/2026"),
      );
    },
  );
  await check(
    "Historical transaction display identity keeps number, id and _id precedence",
    () => {
      assert.equal(
        utils.balanceErrorNumber({
          id: "id",
          _id: "raw",
          transactionNumber: "number",
        }),
        "number",
      );
      assert.equal(utils.balanceErrorNumber({ id: "id", _id: "raw" }), "id");
      assert.equal(utils.balanceErrorNumber({ _id: "raw" }), "raw");
    },
  );
  await check(
    "Localized historical text supports strings and language fallback",
    () => {
      assert.equal(
        utils.balanceErrorText({ en: "English", ar: "عربي" }, "en-US"),
        "English",
      );
      assert.equal(
        utils.balanceErrorText({ en: "English", ar: "عربي" }, "ar"),
        "عربي",
      );
      assert.equal(utils.balanceErrorText({ en: "English" }, "tr"), "English");
      assert.equal(
        utils.balanceErrorText("<b>literal</b>", "en"),
        "<b>literal</b>",
      );
    },
  );
  const tx = {
    _id: "repeated-id",
    amount: 0,
    previousBalance: 0,
    currentBalance: 0,
    user: { id: "owner", email: "owner@example.test" },
    hasRepeatedBalance: true,
  };
  const report = {
    users: [
      {
        groups: [
          { transactions: [tx, tx] },
          { transactions: [{ ...tx, _id: "different", amount: -25 }] },
        ],
      },
      {
        userId: "outer",
        user: { id: "outer", email: "outer@example.test" },
        groups: [{ transactions: [{ _id: "outer-tx", amount: 5 }] }],
      },
    ],
  };
  await check(
    "Projection preserves every repeated transaction occurrence with distinct UI IDs",
    () => {
      const rows = utils.balanceErrorRows(report);
      assert.equal(rows.length, 4);
      assert.equal(new Set(rows.map((r) => r.id)).size, 4);
      assert.equal(rows[0].transaction._id, rows[1].transaction._id);
    },
  );
  await check(
    "Signed and zero amounts/balances survive projection unchanged",
    () => {
      const rows = utils.balanceErrorRows(report);
      assert.equal(rows[0].transaction.amount, 0);
      assert.equal(rows[0].transaction.previousBalance, 0);
      assert.equal(rows[2].transaction.amount, -25);
    },
  );
  await check(
    "Parent account fallback preserves raw account identity without modifying cached data",
    () => {
      const frozen = structuredClone(report);
      Object.freeze(frozen.users[1].groups[0].transactions[0]);
      const rows = utils.balanceErrorRows(frozen);
      assert.equal(rows[3].transaction.userId, "outer");
      assert.equal(rows[3].transaction.user.email, "outer@example.test");
      assert(!("user" in frozen.users[1].groups[0].transactions[0]));
    },
  );
  await check(
    "Projection tolerates empty user/group arrays and missing transactions",
    () => {
      for (const data of [
        {},
        { users: [] },
        { users: [{}] },
        { users: [{ groups: [{}] }] },
      ])
        assert.equal(utils.balanceErrorRows(data).length, 0);
    },
  );
  await check(
    "Projection never replaces raw backend IDs with its UI row ID",
    () => {
      const rows = utils.balanceErrorRows(report);
      assert.equal(rows[0].transaction._id, "repeated-id");
      assert(!("id" in tx));
      assert.notEqual(rows[0].id, rows[0].transaction._id);
    },
  );
  await check(
    "Parent population cannot overwrite a conflicting transaction owner",
    () => {
      const rows = utils.balanceErrorRows({
        users: [
          {
            userId: "outer",
            user: { id: "outer", email: "outer@example.test" },
            groups: [
              { transactions: [{ _id: "different-owner", userId: "actual" }] },
            ],
          },
        ],
      });
      assert.equal(rows[0].transaction.userId, "actual");
      assert.equal(rows[0].transaction.user, undefined);
    },
  );
  let fail = false;
  const requests = [],
    api = createApi({
      reducerPath: "balanceAuditTest",
      keepUnusedDataFor: 0,
      endpoints: () => ({}),
      baseQuery: async (req) => {
        requests.push(req);
        return fail
          ? { error: { status: 500, data: { message: "Failed" } } }
          : { data: report };
      },
    });
  load("src/app/main/balance-errors-app/BalanceErrorsApi.ts", {
    "app/store/apiService": { apiService: api },
  });
  const store = configureStore({
      reducer: { [api.reducerPath]: api.reducer },
      middleware: (g) => g().concat(api.middleware),
    }),
    handles = [];
  async function request(range) {
    const h = store.dispatch(
      api.endpoints.getBalanceErrors.initiate(range, { forceRefetch: true }),
    );
    handles.push(h);
    try {
      return await h.unwrap();
    } finally {
      h.unsubscribe();
    }
  }
  try {
    await check(
      "Audit uses configured backend relative endpoint and exact original date params",
      async () => {
        await request({ dateFrom: "01/10/2026", dateTo: "26/10/2026" });
        assert.deepEqual(plain(requests.at(-1)), {
          url: "v1/transactions/balance-errors",
          params: { dateFrom: "01/10/2026", dateTo: "26/10/2026" },
        });
      },
    );
    await check(
      "API returns the raw nested report without normalization or deduplication",
      async () =>
        assert.deepEqual(
          plain(
            await request({ dateFrom: "01/10/2026", dateTo: "26/10/2026" }),
          ),
          plain(report),
        ),
    );
    await check(
      "Failed audit queries reject and retry can recover",
      async () => {
        fail = true;
        await assert.rejects(() =>
          request({ dateFrom: "01/10/2026", dateTo: "26/10/2026" }),
        );
        fail = false;
        assert.equal(
          (await request({ dateFrom: "01/10/2026", dateTo: "26/10/2026" }))
            .users.length,
          2,
        );
      },
    );
    await check(
      "Repeated explicit searches can refresh an unchanged date range",
      async () => {
        const before = requests.length;
        for (let i = 0; i < 2; i++)
          await request({ dateFrom: "01/10/2026", dateTo: "26/10/2026" });
        assert.equal(requests.length, before + 2);
      },
    );
    await check("Audit service exposes no monetary mutations", () =>
      assert.deepEqual(Object.keys(api.endpoints), ["getBalanceErrors"]),
    );
  } finally {
    handles.forEach((h) => h.unsubscribe());
    store.dispatch(api.util.resetApiState());
  }
  console.log(`${passed}/${passed} services/balance regression checks passed.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
