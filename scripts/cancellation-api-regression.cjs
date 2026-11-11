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

async function main() {
  const client = axios.create({ baseURL: "https://cancellation.test" });
  const mock = new MockAdapter(client);
  const api = createApi({
    reducerPath: "cancellationTest",
    endpoints: () => ({}),
    baseQuery: async (request) => {
      try { return { data: (await client.request(request)).data }; }
      catch (error) { return { error: { status: error.response?.status || "NETWORK_ERROR", data: error.response?.data } }; }
    },
  });
  const file = "src/app/main/cancel-shipment-requests-app/CancelShipmentRequestsApi.ts";
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      if (name === "app/store/apiService") return { apiService: api };
      throw new Error(`Unexpected runtime import ${name}`);
    },
  }, { filename: file });
  const service = exports.default;
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (get) => get().concat(api.middleware),
  });
  const run = (name, args) => store.dispatch(service.endpoints[name].initiate(args, { subscribe: false, forceRefetch: true })).unwrap();
  mock.onGet("v1/requests").reply(200, { results: [{ id: "request-1", shipmentId: "shipment-1" }], total: 1 });
  await run("getCancelShipmentRequests", {
    page: 2, pageSize: 10, searchText: "waybill", statusFilter: "pending",
    userIdFilter: "merchant-1", updatedByIdFilter: "admin-1",
    dateFromFilter: "2026-01-01", dateToFilter: "2026-01-31",
  });
  assert.deepEqual(mock.history.get.at(-1).params, {
    page: 2, pageSize: 10, type: "cancelShipment", search: "waybill",
    status: "pending", userId: "merchant-1", updatedById: "admin-1",
    dateFrom: "2026-01-01", dateTo: "2026-01-31",
  });
  console.log("PASS scoped list parameters");
  await run("getCancelShipmentRequests", {
    page: 0, pageSize: 10, statusFilter: "all", userIdFilter: "all", updatedByIdFilter: "all",
  });
  assert.deepEqual(mock.history.get.at(-1).params, { page: 0, pageSize: 10, type: "cancelShipment" });
  console.log("PASS all-scope omits optional filters");
  mock.onGet("v1/users/merchant-1").reply(200, { id: "merchant-1" });
  assert.equal((await run("getCancelShipmentRequestsUser", "merchant-1")).id, "merchant-1");
  console.log("PASS selected account lookup");
  mock.onPatch("v1/requests/request-1").reply((config) => {
    assert.deepEqual(JSON.parse(config.data), { status: "approved" });
    return [200, { id: "request-1", status: "approved" }];
  });
  const value = { id: "request-1", shipmentId: "shipment-1", status: "approved" };
  assert.equal((await run("setCancelShipmentRequestStatus", value)).status, "approved");
  console.log("PASS decision targets selected ID and sends status only");
  mock.onPatch("v1/requests/request-2").reply(503, { message: "failed" });
  await assert.rejects(run("setCancelShipmentRequestStatus", { id: "request-2", status: "rejected" }), (error) => error.status === 503);
  console.log("PASS failed decision stays a retryable API error");
  const source = fs.readFileSync(path.join(root, file), "utf8");
  assert.match(source, /"CancelShipmentRequests"[\s\S]*"Shipments"[\s\S]*"Transactions"/);
  assert.match(source, /error\s*\?\s*\[\]/);
  assert.match(source, /type: "Shipment" as const, id: value\.shipmentId/);
  console.log("PASS successful decision invalidates related caches only");
  store.dispatch(api.util.resetApiState());
  mock.restore();
  console.log("6/6 cancellation API checks passed");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
