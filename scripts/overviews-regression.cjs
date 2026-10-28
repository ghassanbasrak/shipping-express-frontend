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
  format = load("src/app/shared-components/overview/Utils.ts"),
  utils = load("src/app/main/dashboard/Utils.ts", {
    "src/app/auth/permissions": permissions,
  });
const contactUtils = load("src/app/main/shipment-users-app/Utils.ts");
const shipmentUtils = load("src/app/main/shipments-app/Utils.ts", {
  "src/app/auth/permissions": permissions,
  "../shipment-users-app/Utils": contactUtils,
  "../countries-app/Utils": {
    displayName: (value) => value?.en || value?.ar || "",
  },
});
const home = load("src/app/main/home-app/Utils.ts", {
  "../shipments-app/Utils": shipmentUtils,
  "app/shared-components/overview/Utils": format,
});
let passed = 0;
async function check(name, run) {
  await run();
  passed++;
  console.log("PASS " + name);
}
async function main() {
  await check(
    "Missing/nonfinite/boolean/blank metrics are unavailable rather than zero",
    () => {
      for (const v of [
        undefined,
        null,
        "",
        " ",
        false,
        true,
        NaN,
        Infinity,
        "not-a-number",
        "1,234",
      ])
        assert.equal(format.overviewNumber(v), null);
    },
  );
  await check("Zero and finite signed numbers are preserved", () => {
    assert.equal(format.overviewNumber(0), 0);
    assert.equal(format.overviewNumber(-12.5), -12.5);
    assert.equal(format.overviewNumber("0"), 0);
    assert.equal(format.overviewNumber(" -12.5 "), -12.5);
  });
  await check(
    "Counts reject invalid negative/fractional values without inventing totals",
    () => {
      assert.equal(format.overviewCount(0, "en"), "0");
      assert.equal(format.overviewCount(1200, "en"), "1,200");
      for (const v of [undefined, -1, 1.5])
        assert.equal(format.overviewCount(v, "en"), "—");
    },
  );
  await check(
    "Reported percentages preserve zero and signs without unit conversion",
    () => {
      assert.equal(format.overviewPercent(0, "en"), "0%");
      assert.equal(format.overviewPercent(12.5, "en"), "+12.5%");
      assert.equal(format.overviewPercent(-2, "en"), "-2%");
      assert.equal(format.overviewPercent(undefined, "en"), "—");
    },
  );
  await check(
    "Reported money honors the supplied currency without changing amount",
    () => {
      assert.match(format.overviewMoney(1234.5, "en", "SAR"), /SAR/);
      assert.match(format.overviewMoney(-1234.5, "en", "EUR"), /EUR/);
      assert.equal(format.overviewMoney(undefined, "en", "SAR"), "—");
    },
  );
  await check(
    "Missing currency is never silently relabeled as SAR or USD",
    () => {
      const value = format.overviewMoney(1200, "en");
      assert.equal(value, "1,200.00");
      assert(!/SAR|USD/.test(value));
    },
  );
  await check(
    "Stage bar scaling compares counts without computing a conversion rate",
    () => {
      assert.equal(format.overviewBarWidth(5, [10, 5, null]), 50);
      assert.equal(format.overviewBarWidth(0, [0, 0]), 0);
      assert.equal(format.overviewBarWidth(undefined, [10]), 0);
      assert.equal(format.overviewBarWidth(-2, [10]), 0);
    },
  );
  await check("Invalid shipment timestamps have safe fallback labels", () => {
    assert.equal(format.overviewDate("bad", "en"), "—");
    assert.equal(format.overviewDate(undefined, "en"), "—");
  });
  await check(
    "Administrator overview requires administrator role and explicit dashboard view where restricted",
    () => {
      assert(utils.canViewDashboard({ role: "admin" }));
      assert(
        utils.canViewDashboard({
          role: "admin",
          features: [{ feature: "dashboard", accessView: true }],
        }),
      );
      assert(
        !utils.canViewDashboard({
          role: "employee",
          features: [{ feature: "dashboard", accessView: true }],
        }),
      );
      assert(!utils.canViewDashboard({ role: "user" }));
      assert(
        !utils.canViewDashboard({
          role: "admin",
          features: [{ feature: "dashboard", accessUpdate: true }],
        }),
      );
    },
  );
  await check(
    "Unrelated admin permissions do not grant aggregate financial access",
    () =>
      assert(
        !utils.canViewDashboard({
          role: "admin",
          features: [{ feature: "shipments", accessView: true }],
        }),
      ),
  );
  await check(
    "Operational and financial periods remain separate supported enum values",
    () => {
      assert.deepEqual(Object.values(utils.dashboardPeriods), [
        "today",
        "yesterday",
        "last_week",
        "last_month",
      ]);
      assert.deepEqual(Object.values(utils.revenuePeriods), [
        "day",
        "week",
        "month",
        "quarter",
        "year",
      ]);
      assert(!Object.values(utils.revenuePeriods).includes("today"));
    },
  );
  await check(
    "Local, international and COD stage titles/colors preserve source categories",
    () => {
      for (const type of Object.values(utils.dashboardFlowTypes)) {
        assert(utils.toDashboardFlowTitle(type));
        assert(utils.toDashboardFlowColor(type));
      }
      assert.equal(
        utils.toDashboardStageTitle("refundedToCustomer"),
        "REFUNDED_TO_CUSTOMER",
      );
    },
  );
  await check(
    "Merchant ranking accepts both documented source payload shapes",
    () => {
      const rows = [{ merchant_name: "Merchant", orders_count: 0 }];
      assert.equal(utils.dashboardMerchantRows(rows).length, 1);
      assert.equal(utils.dashboardMerchantRows({ data: rows }).length, 1);
      assert.equal(utils.dashboardMerchantRows({}).length, 0);
    },
  );
  await check(
    "Attention counts preserve genuine zero and missing fields independently",
    () => {
      assert.equal(
        utils.dashboardAlerts({ data: { shipments_delayed: 0 } })
          .shipments_delayed,
        0,
      );
      assert.equal(
        utils.dashboardAlerts({ pending_payments: 4 }).pending_payments,
        4,
      );
      assert.equal(utils.dashboardAlerts({}).pending_payments, undefined);
    },
  );
  await check(
    "Recent shipment projection preserves actual shipment IDs rather than detail/COD IDs",
    () => {
      const row = {
        id: "shipment",
        userId: "owner",
        shipmentDetails: { id: "detail", receiverName: "Receiver" },
        shipmentCod: { id: "cod" },
      };
      const result = home.homeShipmentRows([row], "owner");
      assert.equal(result[0].id, "shipment");
      assert.equal(result[0].receiverName, "Receiver");
      assert.equal(row.shipmentDetails.id, "detail");
    },
  );
  await check(
    "Merchant home does not render explicit foreign account shipment records",
    () => {
      const rows = home.homeShipmentRows(
        [
          { id: "mine", userId: "owner" },
          { id: "foreign", userId: "other" },
          { id: "populated", user: { id: "owner" } },
          { id: "conflicting", userId: "other", user: { id: "owner" } },
        ],
        "owner",
      );
      assert.deepEqual(plain(rows.map((x) => x.id)), ["mine", "populated"]);
    },
  );
  await check(
    "Home carrier starting price respects custom loyalty and does not mutate cached prices",
    () => {
      const carrier = { id: "carrier", localPrice: 25 },
        account = {
          loyaltyType: "custom",
          prices: [{ shippingCompanyId: "carrier", localPrice: 18 }],
        };
      assert.equal(home.homeCarrierPrice(carrier, account), 18);
      assert.equal(
        home.homeCarrierPrice(carrier, { ...account, loyaltyType: "normal" }),
        25,
      );
      assert.equal(account.prices[0].localPrice, 18);
    },
  );
  await check(
    "Missing carrier prices remain unavailable and invalid overrides fall back to real base prices",
    () => {
      assert.equal(home.homeCarrierPrice({ id: "carrier" }), null);
      assert.equal(
        home.homeCarrierPrice(
          { id: "carrier", localPrice: 25 },
          {
            loyaltyType: "custom",
            prices: [{ shippingCompanyId: "carrier", localPrice: -1 }],
          },
        ),
        25,
      );
    },
  );
  await check(
    "Employee workspace links point only to migrated operational owners",
    () => {
      assert(home.staffWorkspaceLinks.length > 0);
      assert(
        home.staffWorkspaceLinks.every(
          (link) => link.feature && link.path.startsWith("/"),
        ),
      );
      assert(
        !home.staffWorkspaceLinks.some((link) => link.path === "/dashboard"),
      );
    },
  );
  const captured = [],
    raw = { total: 0 },
    api = createApi({
      reducerPath: "overviewTest",
      keepUnusedDataFor: 0,
      endpoints: () => ({}),
      baseQuery: async (req) => {
        captured.push(req);
        return { data: raw };
      },
    });
  load("src/app/main/dashboard/DashboardApi.ts", {
    "app/store/apiService": { apiService: api },
  });
  load("src/app/main/home-app/HomeApi.ts", {
    "app/store/apiService": { apiService: api },
  });
  const store = configureStore({
      reducer: { [api.reducerPath]: api.reducer },
      middleware: (g) => g().concat(api.middleware),
    }),
    handles = [];
  async function request(name, arg) {
    const h = store.dispatch(
      api.endpoints[name].initiate(arg, { forceRefetch: true }),
    );
    handles.push(h);
    try {
      return await h.unwrap();
    } finally {
      h.unsubscribe?.();
    }
  }
  try {
    await check(
      "Active merchants keeps period and optional companyId contract",
      async () => {
        await request("getDashboardActiveMerchants", {
          period: "last_week",
          companyId: "carrier",
        });
        assert.deepEqual(plain(captured.at(-1)), {
          url: "v1/admin/merchants/active-summary",
          params: { period: "last_week", companyId: "carrier" },
        });
      },
    );
    await check(
      "Shipment summary keeps its source status parameter and omits All",
      async () => {
        await request("getDashboardShipmentsTotal", {
          period: "today",
          status: "delivered",
        });
        assert.deepEqual(plain(captured.at(-1).params), {
          period: "today",
          status: "delivered",
        });
        await request("getDashboardShipmentsTotal", {
          period: "today",
          status: "all",
        });
        assert(!("status" in captured.at(-1).params));
      },
    );
    await check(
      "Revenue summary uses the independent financial period and carrier",
      async () => {
        await request("getDashboardRevenue", {
          period: "month",
          companyId: "carrier",
        });
        assert.deepEqual(plain(captured.at(-1)), {
          url: "v1/admin/revenue/summary",
          params: { period: "month", companyId: "carrier" },
        });
      },
    );
    await check(
      "Revenue growth preserves its separate operational-period contract",
      async () => {
        await request("getDashboardGrowth", { period: "yesterday" });
        assert.deepEqual(plain(captured.at(-1)), {
          url: "v1/admin/revenue/growth",
          params: { period: "yesterday" },
        });
      },
    );
    await check(
      "Shipment stage types serialize as the original comma-separated parameter",
      async () => {
        await request("getDashboardFlow", {
          period: "last_month",
          companyId: "carrier",
          types: ["local", "international"],
        });
        assert.deepEqual(plain(captured.at(-1).params), {
          period: "last_month",
          companyId: "carrier",
          types: "local,international",
        });
      },
    );
    await check(
      "COD-only all-carrier queries can omit companyId as in the source",
      async () => {
        await request("getDashboardFlow", {
          period: "last_week",
          types: ["cod"],
        });
        assert(!("companyId" in captured.at(-1).params));
      },
    );
    await check(
      "Merchant ranking does not invent a carrier filter unsupported by its endpoint",
      async () => {
        await request("getDashboardTopMerchants", {
          period: "last_week",
          sortBy: "orders",
          limit: 5,
          companyId: "ignored",
        });
        assert.deepEqual(plain(captured.at(-1).params), {
          period: "last_week",
          sortBy: "orders",
          limit: 5,
        });
      },
    );
    await check(
      "Attention data stays scoped to its supported period only",
      async () => {
        await request("getDashboardAlerts", {
          period: "last_week",
          companyId: "ignored",
        });
        assert.deepEqual(plain(captured.at(-1)), {
          url: "v1/admin/dashboard/alerts",
          params: { period: "last_week" },
        });
      },
    );
    await check(
      "Recent activity keeps time_filter rather than the unrelated period parameter",
      async () => {
        await request("getDashboardActivity", { time_filter: "last_month" });
        assert.deepEqual(plain(captured.at(-1)), {
          url: "v1/admin/dashboard/recent-activity",
          params: { time_filter: "last_month" },
        });
      },
    );
    await check(
      "Home summary preserves authenticated configs endpoint and cache account key without wire owner override",
      async () => {
        await request("getHomeSummary", "owner");
        assert.deepEqual(plain(captured.at(-1)), { url: "v1/configs" });
      },
    );
    await check(
      "Wallet/pricing reads use authenticated me and never a route-provided account",
      async () => {
        await request("getHomeAccount", "owner");
        assert.deepEqual(plain(captured.at(-1)), { url: "v1/users/me" });
      },
    );
    await check(
      "Merchant shipment activity preserves backend ownership and fixed small first page",
      async () => {
        await request("getHomeShipments", "owner");
        assert.deepEqual(plain(captured.at(-1)), {
          url: "v1/shipments",
          params: { page: 0, pageSize: 6 },
        });
      },
    );
    await check("Home caches use separate account arguments", () => {
      const first = api.endpoints.getHomeSummary.select("owner")(
          store.getState(),
        ),
        second = api.endpoints.getHomeSummary.select("other")(store.getState());
      assert.equal(first.originalArgs, "owner");
      assert.equal(second.status, "uninitialized");
    });
    await check(
      "Overview endpoints return raw backend values without fabricated fallback records",
      async () => {
        assert.deepEqual(
          plain(
            await request("getDashboardShipmentsTotal", { period: "today" }),
          ),
          raw,
        );
      },
    );
    await check(
      "Overview APIs expose queries only, with no financial write endpoints",
      () => {
        for (const endpoint of Object.values(api.endpoints))
          assert.equal(typeof endpoint.select, "function");
        assert(captured.every((req) => !req.method || req.method === "GET"));
      },
    );
  } finally {
    handles.forEach((h) => h.unsubscribe?.());
    store.dispatch(api.util.resetApiState());
  }
  console.log(`${passed}/${passed} overview regression checks passed.`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
