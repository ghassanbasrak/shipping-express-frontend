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
const base = "src/app/main/merchant-statistics-app/";
const validators = load("src/app/main/utils/validations.ts", {
  "src/i18n": { t: (key) => key },
  validator: require(path.join(target, "node_modules/validator")),
});
const schemas = load(base + "models/MerchantStatisticsSchema.ts", {
  "src/app/main/utils/validations": validators,
});
const oldSchema = schemas.merchantStatisticsSchema((key) => key);
const model = load(base + "models/MerchantStatisticsModel.ts");
const utils = load(base + "Utils.ts");
const valid = {
  userId: "merchant-1",
  dateFrom: new Date("2026-01-01T00:00:00Z"),
  dateTo: new Date("2026-10-01T23:59:59Z"),
  user: {
    id: "merchant-1",
    firstName: "Merchant",
    lastName: "One",
    email: "one@example.test",
  },
};
let passed = 0;
async function check(name, run) {
  await run();
  passed++;
  console.log("PASS " + name);
}
async function main() {
  await check("six-month defaults use independent Date objects", () => {
    const a = model.default(),
      b = model.default();
    assert.equal(a.userId, "");
    assert.ok(a.dateFrom < a.dateTo);
    assert.notEqual(a.dateFrom, b.dateFrom);
    assert.notEqual(a.dateFrom, a.dateTo);
  });
  await check("merchant selection is required", () => {
    assert.equal(oldSchema.safeParse(valid).success, true);
    assert.equal(oldSchema.safeParse({ ...valid, userId: "" }).success, false);
  });
  await check(
    "optional date bounds retain open ended and all-date reports",
    () => {
      for (const values of [
        { ...valid, dateFrom: null, dateTo: null },
        { userId: "merchant-1" },
        { ...valid, dateFrom: null },
      ])
        assert.equal(oldSchema.safeParse(values).success, true);
    },
  );
  await check("reversed and invalid dates cannot be submitted", () => {
    for (const values of [
      { ...valid, dateTo: new Date("2025-01-01") },
      { ...valid, dateFrom: new Date("invalid") },
    ])
      assert.equal(oldSchema.safeParse(values).success, false);
  });
  await check(
    "request serialization sends exact ISO bounds without populated accounts or unknown metadata",
    () => {
      assert.deepEqual(
        plain(
          utils.statisticsRequest({
            ...valid,
            role: "admin",
            statistics: { x: 1 },
          }),
        ),
        {
          userId: "merchant-1",
          dateFrom: "2026-01-01T00:00:00.000Z",
          dateTo: "2026-10-01T23:59:59.000Z",
        },
      );
      assert.deepEqual(
        plain(
          utils.statisticsRequest({ userId: "merchant-1", dateFrom: null }),
        ),
        { userId: "merchant-1" },
      );
    },
  );
  await check(
    "partially typed invalid dates do not crash stale-report comparison",
    () => {
      assert.doesNotThrow(() =>
        utils.statisticsRequest({ ...valid, dateFrom: new Date("invalid") }),
      );
    },
  );
  await check(
    "submitted merchant snapshots do not share editable form objects or account secrets",
    () => {
      const source = {
        ...valid.user,
        features: [{ feature: "x" }],
        balance: 250,
      };
      const snapshot = utils.statisticsUserSnapshot(source);
      snapshot.firstName = "Other";
      assert.equal(source.firstName, "Merchant");
      assert.equal(snapshot.balance, undefined);
      assert.equal(snapshot.features, undefined);
      assert.equal(
        utils.statisticsUserLabel({ id: "id", email: "a@example.test" }),
        "a@example.test",
      );
      assert.equal(utils.statisticsUserLabel({ id: "id" }), "id");
    },
  );
  const requests = [];
  let failure = false;
  const api = createApi({
    reducerPath: "statisticsTest",
    endpoints: () => ({}),
    keepUnusedDataFor: 0,
    baseQuery: async (request) => {
      requests.push(plain(request));
      return failure
        ? { error: { status: 500, data: { message: "failed" } } }
        : {
            data:
              request.url === "v1/users"
                ? { results: [valid.user], total: 1 }
                : request.url.startsWith("v1/users/") && !request.method
                  ? valid.user
                  : { userBalance: { walletBalance: 0 } },
          };
    },
  });
  load(base + "MerchantStatisticsApi.ts", {
    "app/store/apiService": { apiService: api },
  });
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (get) => get().concat(api.middleware),
  });
  const handles = [];
  async function request(name, arg) {
    const result = store.dispatch(
      api.endpoints[name].initiate(arg, { forceRefetch: true }),
    );
    handles.push(result);
    return result.unwrap();
  }
  try {
    await check(
      "original report endpoint POSTs a field-limited body to statistics",
      async () => {
        await request("getMerchantStatistics", {
          ...utils.statisticsRequest(valid),
          user: valid.user,
          ignoredField: 99,
        });
        assert.deepEqual(requests.at(-1), {
          url: "v1/users/statistics",
          method: "POST",
          data: plain(utils.statisticsRequest(valid)),
        });
      },
    );
    await check(
      "all-date request omits empty dates without changing account scope",
      async () => {
        await request("getMerchantStatistics", {
          userId: "merchant-2",
          dateFrom: "",
          dateTo: "",
        });
        assert.deepEqual(requests.at(-1).data, { userId: "merchant-2" });
      },
    );
    await check(
      "merchant lookup uses current encoded-search parameters and the existing account endpoint",
      async () => {
        await request("getStatisticsUsers", { searchText: "A & B" });
        assert.deepEqual(requests.at(-1), {
          url: "v1/users",
          params: { type: "user", search: "A & B" },
        });
        await request("getStatisticsUser", "outside-page");
        assert.equal(requests.at(-1).url, "v1/users/outside-page");
      },
    );
    await check(
      "request failure stays rejected and can be retried without changing the payload",
      async () => {
        failure = true;
        await assert.rejects(
          request("getMerchantStatistics", { userId: "merchant-1" }),
        );
        failure = false;
        await request("getMerchantStatistics", { userId: "merchant-1" });
        assert.deepEqual(requests.at(-1).data, { userId: "merchant-1" });
      },
    );
  } finally {
    for (const result of handles) {
      result.unsubscribe?.();
      result.reset?.();
    }
    store.dispatch(api.util.resetApiState());
  }
  const React = require(path.join(target, "node_modules/react"));
  const { renderToStaticMarkup } = require(
    path.join(target, "node_modules/react-dom/server"),
  );
  const captured = [];
  const reportImports = {
    "@mui/material": {
      Typography: ({ children }) => React.createElement("p", null, children),
    },
    "react-i18next": { useTranslation: () => ({ t: (key) => key }) },
  };
  const amountModule = {
    default: (props) => {
      captured.push(props);
      return React.createElement("section", null, props.title);
    },
    __esModule: true,
  };
  const headerModule = {
    default: () => React.createElement("h1", null, "Snapshot"),
    __esModule: true,
  };
  const oldReport = load(
    base + "merchant-statistics/sections/MerchantStatisticsReport.tsx",
    {
      ...reportImports,
      "../components/StatisticsAmounts": amountModule,
      "../components/StatisticsReportHeader": headerModule,
      "../../Utils": utils,
    },
  );
  await check(
    "original report renders every source financial group and retains zero totals",
    () => {
      captured.length = 0;
      renderToStaticMarkup(
        React.createElement(oldReport.default, {
          report: {
            request: { userId: "merchant-1" },
            statistics: {
              financialAssets: {
                total: 0,
                shipments: 12,
                codShipments: 3,
                extraWeight: 4,
                updateByAdministrator: 5,
                bankTransferFees: 6,
                others: 7,
              },
              currentObligations: {
                planBalance: 10,
                balanceCharge: 20,
                canceledShipments: 30,
                codBalance: 40,
                others: 50,
              },
              bankTransfer: { total: 9, cod: 8, others: 1 },
              codObligations: { total: 88, block: 2, pending: 3, paid: 83 },
            },
          },
        }),
      );
      assert.equal(captured.length, 4);
      assert.equal(captured[0].total, 0);
      assert.deepEqual(
        plain(captured.map((x) => x.rows.map((x) => x.amount))),
        [
          [12, 3, 4, 5, 6, 7],
          [10, 20, 30, 40, 50],
          [8, 1],
          [88, 2, 3, 83],
        ],
      );
    },
  );
  await check(
    "null/empty reports show the empty state while zero-valued groups remain printable",
    () => {
      for (const report of [oldReport]) {
        assert.equal(report.hasMerchantStatistics(null), false);
        assert.equal(report.hasMerchantStatistics({}), false);
        assert.ok(
          renderToStaticMarkup(
            React.createElement(report.default, { report: null }),
          ).includes("NO_SUCH_MERCHANT_STATISTIC"),
        );
      }
      assert.equal(
        oldReport.hasMerchantStatistics({ financialAssets: { total: 0 } }),
        true,
      );
    },
  );
  await check(
    "PDF export includes every page of long reports and sanitizes filenames",
    async () => {
      const slices = [],
        images = [];
      let pages = 1,
        saved;
      class Pdf {
        internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
        addPage() {
          pages++;
        }
        addImage(...args) {
          images.push(args);
        }
        save(name) {
          saved = name;
        }
      }
      const pdfUtils = load(
        base + "Utils.ts",
        {
          html2canvas: async () => ({ width: 1000, height: 4000 }),
          jspdf: { jsPDF: Pdf },
        },
        {
          document: {
            fonts: { ready: Promise.resolve() },
            createElement: () => ({
              getContext: () => ({ drawImage: (...args) => slices.push(args) }),
              toDataURL: () => "data:image/png;base64,test",
            }),
          },
        },
      );
      await pdfUtils.downloadStatisticsPdf({}, "a/b");
      assert.equal(pages, 3);
      assert.equal(images.length, 3);
      assert.equal(slices.at(-1)[2], 2914);
      assert.equal(saved, "a-b.pdf");
    },
  );
  await check(
    "PDF failures reject so the view can release its loading state and retry",
    async () => {
      const pdfUtils = load(
        base + "Utils.ts",
        {
          html2canvas: async () => {
            throw new Error("capture failed");
          },
          jspdf: { jsPDF: class {} },
        },
        { document: { fonts: { ready: Promise.resolve() } } },
      );
      await assert.rejects(
        pdfUtils.downloadStatisticsPdf({}, "report"),
        /capture failed/,
      );
    },
  );
  const permissions = load("src/app/auth/permissions.ts");
  await check("statistics view grants retain staff-only access", () => {
    const employee = {
      id: "staff",
      role: "employee",
      features: [{ feature: "merchant-statistics", accessView: true }],
    };
    assert.equal(
      permissions.hasPagePermission("/merchant-statistics", employee),
      true,
    );
  });
  await check(
    "all displayed report keys exist in English Arabic and Turkish resources",
    () => {
      for (const folder of [base]) {
        const bundles = ["en", "ar", "tr"].map(
          (l) => load(folder + "i18n/" + l + ".ts").default,
        );
        for (const key of Object.keys(bundles[0]))
          for (const bundle of bundles) assert.ok(bundle[key], key);
      }
    },
  );
  console.log(`${passed}/${passed} statistics regression checks passed.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
