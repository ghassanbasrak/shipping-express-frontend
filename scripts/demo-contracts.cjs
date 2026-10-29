const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const esbuild = require("esbuild");
const XLSX = require("xlsx");

const root = path.resolve(__dirname, "..");
const output = esbuild.buildSync({
  entryPoints: [path.join(root, "src/app/demo/demoExtraApi.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  external: ["xlsx", "jspdf"],
  define: { "import.meta.env.VITE_DEMO_MODE": '"true"' },
});
const mod = new Module(path.join(root, "src/app/demo/demoExtraApi.ts"));
mod.filename = path.join(root, "src/app/demo/demoExtraApi.ts");
mod.paths = module.paths;
mod._compile(output.outputFiles[0].text, mod.filename);
const { createDemoExtras, handleDemoExtra } = mod.exports;
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
const base = {
  countries: [
    { id: "country-eg", code: "EG", name: { en: "Egypt", ar: "مصر" } },
  ],
  shippingCompanies: [{ id: "carrier-1", name: "Nile Express" }],
  states: [
    {
      id: "state-1",
      countryId: "country-eg",
      name: { en: "Cairo", ar: "القاهرة" },
      shippingCompanyIds: ["carrier-1"],
    },
  ],
  cities: [
    {
      id: "city-1",
      countryId: "country-eg",
      stateId: "state-1",
      name: { en: "Giza", ar: "الجيزة" },
    },
  ],
};
const db = { ...base, ...createDemoExtras(base) };
let saved = 0;
async function request(pathname, method = "get", params = {}, data = {}) {
  return handleDemoExtra({
    db,
    config: {},
    path: pathname,
    method,
    params,
    data,
    save: () => {
      saved++;
    },
  });
}
async function main() {
  let [status, body] = await request("v1/users", "get", {
    role: ["admin", "employee"],
  });
  assert.equal(status, 200);
  assert.equal(body.total, 2);
  [status, body] = await request("v1/coupons", "get", {
    page: 1,
    pageSize: 10,
  });
  assert.equal(body.total, 28);
  assert.equal(body.results.length, 10);
  [status, body] = await request("v1/states", "get", {
    countryId: "country-eg",
    shippingCompanyId: "carrier-1",
  });
  assert(
    body.results.every(
      (row) => row.countryId === "country-eg" && row.shipmentStates.length,
    ),
  );

  localStorage.setItem("ashamco-demo-identity", "merchant");
  [status, body] = await request("v1/requests", "get", {
    type: "bags",
    page: 0,
    pageSize: 50,
  });
  assert(body.results.every((row) => row.userId === "demo-merchant"));
  const merchant = db.users.find((row) => row.id === "demo-merchant");
  const originalWallet = merchant.balance;
  [status, body] = await request(
    "v1/requests",
    "post",
    {},
    {
      type: "bags",
      userId: "demo-admin",
      status: "approved",
      productIds: [db.products[0].id, db.products[1].id],
      amount: 1,
      fullName: "Demo",
      phone: "+20-123",
      shippingAddress: { countryId: "country-eg", stateId: "state-1" },
    },
  );
  assert.equal(status, 201);
  assert.equal(body.userId, "demo-merchant");
  assert.equal(body.status, "pending");
  assert.equal(body.amount, db.products[0].price + db.products[1].price);
  const packageId = body.id;
  localStorage.setItem("ashamco-demo-identity", "admin");
  [status, body] = await request(
    `v1/requests/${packageId}`,
    "patch",
    {},
    { status: "approved" },
  );
  assert.equal(status, 200);
  assert.equal(merchant.balance, originalWallet - body.amount);

  localStorage.setItem("ashamco-demo-identity", "affiliate");
  const affiliate = db.users.find((row) => row.id === "demo-affiliate");
  const walletBefore = affiliate.balance;
  const balanceBefore = db.affiliateBalances[affiliate.id];
  [status, body] = await request(
    "v1/requests",
    "post",
    {},
    { type: "affiliateWithdraw", amount: 125, userId: "demo-admin" },
  );
  assert.equal(body.userId, affiliate.id);
  const affiliateRequestId = body.id;
  localStorage.setItem("ashamco-demo-identity", "admin");
  [status, body] = await request(
    `v1/requests/${affiliateRequestId}`,
    "patch",
    {},
    {
      status: "approved",
      bank: "alrajhiBank",
      transactionReference: "DEMO-REF",
    },
  );
  assert.equal(status, 200);
  assert.equal(db.affiliateBalances[affiliate.id], balanceBefore - 125);
  assert.equal(affiliate.balance, walletBefore);

  [status, body] = await request(
    "v1/users/statistics",
    "post",
    {},
    { userId: affiliate.id },
  );
  assert.equal(status, 200);
  assert.equal(body.userId, affiliate.id);
  assert.equal(typeof body.financialAssets.total, "number");
  [status, body] = await request("v1/transactions/report", "get", {
    reportType: "xlsx",
    userId: affiliate.id,
    relatedBalance: "wallet",
    page: 0,
    pageSize: 50000,
  });
  assert.equal(status, 200);
  const workbook = XLSX.read(body.url.split(",")[1], { type: "base64" });
  const reportRows = XLSX.utils.sheet_to_json(workbook.Sheets.Transactions);
  assert(reportRows.length > 0);
  assert(
    reportRows.every(
      (row) =>
        row.Account === affiliate.companyName && row.Balance === "wallet",
    ),
  );
  [status, body] = await request("v1/transactions/report", "get", {
    reportType: "pdf",
    userId: affiliate.id,
    relatedBalance: "cod",
  });
  assert(
    Buffer.from(body.url.split(",")[1], "base64").subarray(0, 4).toString() ===
      "%PDF",
  );
  assert(saved >= 4);
  console.log(
    "Demo contracts passed: pagination, account scope, request decisions, balances, statistics, XLSX and PDF",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
