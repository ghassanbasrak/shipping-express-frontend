const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const axios = require(path.join(root, "node_modules/axios/dist/node/axios.cjs"));
const MockAdapter = require(path.join(root, "node_modules/axios-mock-adapter"));
const { createApi } = require(path.join(root, "node_modules/@reduxjs/toolkit/query/react"));
const { configureStore } = require(path.join(root, "node_modules/@reduxjs/toolkit"));

function load(file, api) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(js, {
    exports,
    require: (name) => {
      if (name === "app/store/apiService") return { apiService: api };
      throw new Error(`Unexpected runtime import: ${name}`);
    },
  }, { filename: file });
  return exports.default;
}

async function main() {
  const client = axios.create({ baseURL: "https://home-dashboard.test" });
  const mock = new MockAdapter(client);
  const api = createApi({
    reducerPath: "homeDashboardTest",
    endpoints: () => ({}),
    baseQuery: async (request) => {
      try { return { data: (await client.request(request)).data }; }
      catch (error) { return { error: { status: error.response?.status || "NETWORK_ERROR", data: error.response?.data } }; }
    },
  });
  const home = load("src/app/main/home-app/HomeApi.ts", api);
  const dashboard = load("src/app/main/dashboard/DashboardApi.ts", api);
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (get) => get().concat(api.middleware),
  });
  const run = (service, name, args) => store.dispatch(service.endpoints[name].initiate(args, { subscribe: false, forceRefetch: true })).unwrap();
  const cases = [
    [home, "getHomeSummary", "account-1", "v1/configs", undefined],
    [home, "getHomeAccount", "account-1", "v1/users/me", undefined],
    [home, "getHomeShipments", "account-1", "v1/shipments", { page: 0, pageSize: 6 }],
    [dashboard, "getDashboardActiveMerchants", { period: "today", companyId: "carrier-1" }, "v1/admin/merchants/active-summary", { period: "today", companyId: "carrier-1" }],
    [dashboard, "getDashboardShipmentsTotal", { period: "last_week", status: "delivered" }, "v1/shipments/admin/shipments/total-summary", { period: "last_week", status: "delivered" }],
    [dashboard, "getDashboardRevenue", { period: "month" }, "v1/admin/revenue/summary", { period: "month" }],
    [dashboard, "getDashboardGrowth", { period: "yesterday" }, "v1/admin/revenue/growth", { period: "yesterday" }],
    [dashboard, "getDashboardFlow", { period: "today", types: ["local", "international"], companyId: "carrier-1" }, "v1/shipments/admin/shipments/process-flow", { period: "today", companyId: "carrier-1", types: "local,international" }],
    [dashboard, "getDashboardTopMerchants", { period: "today", sortBy: "orders", limit: 5 }, "v1/admin/merchants/top-performance", { period: "today", sortBy: "orders", limit: 5 }],
    [dashboard, "getDashboardAlerts", { period: "today" }, "v1/admin/dashboard/alerts", { period: "today" }],
    [dashboard, "getDashboardActivity", { time_filter: "last_month" }, "v1/admin/dashboard/recent-activity", { time_filter: "last_month" }],
  ];
  for (const [service, name, args, url, params] of cases) {
    mock.onGet(url).reply((config) => {
      assert.deepEqual(config.params, params, name);
      return [200, { ok: name }];
    });
    assert.equal((await run(service, name, args)).ok, name);
    console.log(`PASS ${name}`);
  }
  mock.onGet("v1/shipments/admin/shipments/total-summary").reply(200, {});
  await run(dashboard, "getDashboardShipmentsTotal", { period: "today", status: "all" });
  assert.deepEqual(mock.history.get.at(-1).params, { period: "today" });
  console.log("PASS all-status and absent carrier are omitted");
  mock.onGet("v1/admin/revenue/summary").reply(503, { message: "unavailable" });
  await assert.rejects(run(dashboard, "getDashboardRevenue", { period: "year" }), (error) => error.status === 503);
  console.log("PASS backend errors remain retryable RTK Query errors");
  assert(home.endpoints.getHomeSummary && dashboard.endpoints.getDashboardActivity);
  store.dispatch(api.util.resetApiState());
  mock.restore();
  console.log("13/13 home/dashboard API checks passed");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
