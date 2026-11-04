const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const esbuild = require("esbuild");
const axios = require("axios");
const { PDFDocument } = require("pdf-lib");

const root = path.resolve(__dirname, "..");
const entry = path.join(root, "src/app/demo/demoApi.ts");
const bundle = esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  external: ["axios", "axios-mock-adapter", "jspdf", "xlsx"],
  define: {
    "import.meta.env": JSON.stringify({
      VITE_DEMO_MODE: "true",
      VITE_BASE_URL: "https://demo.invalid",
    }),
  },
});
const mod = new Module(entry);
mod.filename = entry;
mod.paths = module.paths;
mod._compile(bundle.outputFiles[0].text, entry);
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
global.window = { location: { origin: "http://localhost:3000" } };
const key = "ashamco-demo-data-v1";
const snapshot = () => JSON.parse(storage.get(key));
const identity = (value) =>
  localStorage.setItem("ashamco-demo-identity", value);
let mock;
let checks = 0;
function check(value, message) {
  assert(value, message);
  checks++;
}
async function request(url, method = "get", data, params, expected = 200) {
  const response = await axios({
    url,
    method,
    data,
    params,
    validateStatus: () => true,
  });
  assert.equal(
    response.status,
    expected,
    `${method} ${url}: ${JSON.stringify(response.data).slice(0, 300)}`,
  );
  return response.data;
}
async function main() {
  mock = mod.exports.installDemoApi();
  mock.delayResponse = 0;
  const initial = snapshot();
  for (const endpoint of [
    "countries",
    "shipping-companies",
    "states",
    "cities",
    "payment-plans",
    "users?role=admin&role=employee",
    "coupons",
    "alerts",
    "shipping-users",
    "applications",
    "requests?type=bankTransfer",
    "requests?type=affiliateWithdraw",
    "transactions",
    "shipments",
    "payments",
    "logs",
    "requests?type=cancelShipment",
    "requests?type=withdrew&type=walletCharge",
    "affiliate-transactions",
  ]) {
    const body = await request(`v1/${endpoint}`, "get", undefined, {
      page: 0,
      pageSize: 2,
    });
    check(
      body.total > 0 && body.results.length === 2,
      `Populated paginated ${endpoint}`,
    );
  }
  const list = await request("v1/shipments", "get", undefined, {
    pageSize: 500,
    shippingCompanyId: "demo-carrier-1",
    status: ["delivered", "processing"],
    isCod: true,
  });
  check(
    list.total > 0 &&
      list.results.every(
        (s) =>
          s.isCod &&
          s.shippingCompanyId === "demo-carrier-1" &&
          ["delivered", "processing"].includes(s.status),
      ),
    "Combined shipment filters",
  );
  const page0 = await request("v1/shipments", "get", undefined, {
    pageSize: 2,
    page: 0,
  });
  const page1 = await request("v1/shipments", "get", undefined, {
    pageSize: 2,
    page: 1,
  });
  check(
    page0.total === page1.total && page0.results[0].id !== page1.results[0].id,
    "Server pagination retains totals",
  );
  const log = await request("v1/logs/demo-log-demo-shipment-1-1");
  check(
    log.meta.data.senderName &&
      log.meta.data.receiverName &&
      log.shipment.id === "demo-shipment-1-1",
    "Historical log snapshot fills contact details and live shipment link",
  );
  const sorted = await request("v1/users", "get", undefined, {
    role: "user",
    orderColumn: "balance",
    orderDirection: "desc",
    pageSize: 100,
  });
  check(
    sorted.results.every(
      (u, i, rows) => !i || rows[i - 1].balance >= u.balance,
    ),
    "Merchant balance sorting",
  );
  for (const endpoint of [
    "admin/merchants/active-summary",
    "shipments/admin/shipments/total-summary",
    "admin/revenue/summary",
    "admin/revenue/growth",
    "shipments/admin/shipments/process-flow",
    "admin/merchants/top-performance",
    "admin/dashboard/alerts",
    "admin/dashboard/recent-activity",
  ]) {
    check(
      Object.keys(
        await request(`v1/${endpoint}`, "get", undefined, {
          period: "month",
          time_filter: "last_week",
        }),
      ).length > 0,
      `Dashboard ${endpoint}`,
    );
  }
  const summary = await request("v1/shipments/shipment/summary");
  check(
    summary.shippingCompanyAnalyticData.reduce((n, c) => n + c.value, 0) ===
      initial.shipments.length,
    "Shipment chart derives from records",
  );
  const affiliate = await request("v1/users/affiliates/summary", "post", {
    affiliateId: "demo-affiliate",
  });
  check(
    affiliate.users > 0 &&
      affiliate.shipments.total > 0 &&
      affiliate.profits > 0,
    "Affiliate summary has linked customers and profits",
  );
  const customers = await request("v1/users", "get", undefined, {
    referredById: "demo-affiliate",
    pageSize: 100,
  });
  check(
    customers.results.every((u) => u.referredById === "demo-affiliate"),
    "Affiliate customer scoping",
  );
  const merchant = await request(
    "v1/users",
    "post",
    {
      firstName: "Local",
      lastName: "Merchant",
      companyName: "New demo business",
      email: "local@example.test",
    },
    undefined,
    201,
  );
  check(
    merchant.role === "user" && merchant.balance === 0,
    "Merchant creation",
  );
  await request(`v1/users/${merchant.id}/add-payment-plan`, "post", {
    paymentPlanId: "demo-plan-1",
  });
  check(
    (await request(`v1/users/${merchant.id}`)).paymentPlan.id === "demo-plan-1",
    "Subscription persisted",
  );
  await request(`v1/users/${merchant.id}/cancel-payment-plan`, "delete");
  check(
    !(await request(`v1/users/${merchant.id}`)).paymentPlanId,
    "Subscription canceled",
  );
  check(
    (
      await request("v1/transactions/close-balance", "post", {
        userId: merchant.id,
        type: "wallet",
      })
    ).walletBalanceStatus === true,
    "Balance closing",
  );
  const before = (await request("v1/users/demo-merchant")).balance;
  const tx = await request(
    "v1/transactions",
    "post",
    {
      userId: "demo-merchant",
      relatedBalance: "wallet",
      type: "deposit",
      amount: 115,
      applyTax: true,
    },
    undefined,
    201,
  );
  await request(`v1/transactions/${tx.id}`, "patch", { amount: 230 });
  check(
    Math.abs((await request("v1/users/demo-merchant")).balance - before - 200) <
      0.001,
    "Inclusive tax preserved when editing adjustment",
  );
  identity("merchant");
  check(
    (await request("v1/configs")).activeShipments > 0,
    "Merchant home summary",
  );
  const own = await request("v1/shipments", "get", undefined, {
    userId: "demo-affiliate",
    pageSize: 100,
  });
  check(
    own.total > 0 && own.results.every((s) => s.userId === "demo-merchant"),
    "Merchant route-owner override ignored",
  );
  await request(
    "v1/shipments/demo-shipment-2-1",
    "get",
    undefined,
    undefined,
    403,
  );
  await request(
    "v1/payments/demo-payment-2-1",
    "get",
    undefined,
    undefined,
    403,
  );
  await request("v1/logs", "get", undefined, undefined, 403);
  await request("v1/admin/revenue/summary", "get", undefined, undefined, 403);
  await request("v1/users/me", "patch", { companyName: "Saved demo business" });
  check(
    (await request("v1/users/me")).companyName === "Saved demo business",
    "Self profile updates",
  );
  const payment = await request(
    "v1/payments/paytabs",
    "post",
    {
      userId: "demo-affiliate",
      amount: 100,
      total: 115,
      taxTotal: 15,
      feeTotal: 0,
    },
    undefined,
    201,
  );
  check(
    payment.userId === "demo-merchant" &&
      payment.link.startsWith("http://localhost:3000/payment/demo-merchant/"),
    "Checkout is local and current-account owned",
  );
  const balance = (await request("v1/users/me")).balance;
  const callback = await request("v1/payments/payment-status", "post", {
    key: payment.transactionId,
    keyType: "PaymentId",
  });
  check(
    callback.Data.CustomerReference === payment.id &&
      callback.Data.InvoiceStatus === "Paid",
    "Local gateway callback",
  );
  await request(`v1/payments/${payment.id}`, "patch", {
    status: "success",
    transactionId: payment.transactionId,
  });
  await request(`v1/payments/${payment.id}/check-status`, "post", {});
  await request(`v1/payments/${payment.id}`, "patch", { status: "success" });
  check(
    (await request("v1/users/me")).balance === balance + 100,
    "Repeated payment confirmation credits once",
  );
  const form = {
    shippingCompanyId: "demo-carrier-1",
    userId: "demo-affiliate",
    method: "local",
    type: "box",
    weight: 2,
    length: 20,
    width: 15,
    height: 10,
    packagesCount: 1,
    senderName: "Demo Sender",
    receiverName: "Demo Receiver",
    senderCountryId: "demo-country-eg",
    receiverCountryId: "demo-country-eg",
    isCod: true,
    codPrice: 200,
  };
  const price = await request("v1/shipments/review", "post", form);
  const wallet = (await request("v1/users/me")).balance;
  const shipment = await request("v1/shipments", "post", form, undefined, 201);
  check(
    shipment.userId === "demo-merchant" &&
      shipment.status === "processing" &&
      (await request("v1/users/me")).balance === wallet - price.total,
    "Shipment creation charges current-account wallet",
  );
  const countBeforeFailure = snapshot().shipments.length;
  const unreturned = await request("v1/shipments", "get", undefined, {
    search: shipment.trackingNumber,
    isReturned: false,
  });
  check(
    unreturned.results.some((row) => row.id === shipment.id),
    "New normal shipments remain visible with the non-return filter",
  );
  const balanceBeforeFailure = (await request("v1/users/me")).balance;
  await request(
    "v1/shipments",
    "post",
    { ...form, weight: 1000000 },
    undefined,
    409,
  );
  check(
    snapshot().shipments.length === countBeforeFailure &&
      (await request("v1/users/me")).balance === balanceBeforeFailure,
    "Failed shipment submission does not create or charge",
  );
  const label = await request("v1/shipments/shipment/label", "get", undefined, {
    shipmentId: shipment.id,
    trackingNumber: shipment.trackingNumber,
  });
  const doc = await PDFDocument.load(
    Buffer.from(label.labelUrl.split(",")[1], "base64"),
  );
  check(doc.getPageCount() > 0, "Shipment label is a real downloadable PDF");
  const synced = await request(`v1/shipments/shipment/tracking/${shipment.id}`);
  check(
    synced.trackingStats.length > shipment.trackingStats.length,
    "Tracking sync persists a local event",
  );
  const cancel = await request(
    "v1/requests",
    "post",
    {
      type: "cancelShipment",
      shipmentId: shipment.id,
      userId: "demo-affiliate",
    },
    undefined,
    201,
  );
  await request(
    "v1/requests",
    "post",
    { type: "cancelShipment", shipmentId: shipment.id },
    undefined,
    409,
  );
  identity("admin");
  await request(`v1/requests/${cancel.id}`, "patch", { status: "rejected" });
  check(
    (await request(`v1/shipments/${shipment.id}`)).status === "processing",
    "Cancellation rejection restores shipment",
  );
  const weightBalance = (await request("v1/users/demo-merchant")).balance;
  const weightQuote = await request(
    `v1/shipments/${shipment.id}/review-extra-weight-price`,
    "patch",
    { weight: 4 },
  );
  check(
    (await request("v1/users/demo-merchant")).balance === weightBalance &&
      weightQuote.extraWeightPrice > 0,
    "Extra-weight review has no balance effect",
  );
  await request(
    `v1/shipments/${shipment.id}/deduct-extra-weight-price`,
    "patch",
    { weight: 4, extraWeightPrice: weightQuote.extraWeightPrice },
  );
  check(
    (await request("v1/users/demo-merchant")).balance ===
      weightBalance - weightQuote.extraWeightPrice,
    "Extra-weight confirmation charges only the reviewed difference",
  );
  await request(`v1/shipments/${shipment.id}`, "patch", {
    closeInvoiceNumber: "DEMO-INVOICE",
  });
  const invoiced = await request("v1/shipments", "get", undefined, {
    search: shipment.trackingNumber,
    closedInvoice: true,
  });
  check(
    invoiced.results.length === 1 &&
      invoiced.results[0].closeInvoiceNumber === "DEMO-INVOICE",
    "Invoice attachment and filter",
  );
  const codBefore = (await request("v1/users/demo-merchant")).codBalance;
  await request(`v1/shipment-cods/${shipment.shipmentCod.id}`, "patch", {
    codStatus: "paid",
  });
  await request(`v1/shipment-cods/${shipment.shipmentCod.id}`, "patch", {
    codStatus: "paid",
  });
  check(
    (await request("v1/users/demo-merchant")).codBalance === codBefore + 200,
    "COD settlement credits once",
  );
  identity("merchant");
  const eligible = await request("v1/shipments", "get", undefined, {
    isCod: true,
    codStatus: "paid",
    pageSize: 1000,
  });
  const selected = eligible.results[0];
  const withdrawal = await request(
    "v1/requests",
    "post",
    {
      userId: "demo-merchant",
      type: "walletCharge",
      shipmentIds: [selected.id],
      amount: selected.codPrice,
    },
    undefined,
    201,
  );
  check(
    (await request(`v1/shipments/${selected.id}`)).codStatus === "block",
    "Withdrawal reserves selected shipments",
  );
  identity("admin");
  await request(`v1/requests/${withdrawal.id}`, "patch", {
    status: "rejected",
  });
  check(
    (await request(`v1/shipments/${selected.id}`)).codStatus === "paid",
    "Rejected withdrawal releases shipments",
  );
  identity("merchant");
  const resubmitted = await request(
    "v1/requests",
    "post",
    {
      type: "walletCharge",
      shipmentIds: [selected.id],
      amount: selected.codPrice,
    },
    undefined,
    201,
  );
  const walletBefore = (await request("v1/users/me")).balance;
  identity("admin");
  await request(`v1/requests/${resubmitted.id}`, "patch", {
    status: "approved",
    bank: "box",
    transactionReference: "LOCAL",
  });
  await request(
    `v1/requests/${resubmitted.id}`,
    "patch",
    { status: "approved" },
    undefined,
    409,
  );
  check(
    (await request(`v1/shipments/${selected.id}`)).codStatus === "settled",
    "Approved withdrawal settles shipments",
  );
  check(
    (await request("v1/users/demo-merchant")).balance ===
      walletBefore + Math.round((selected.codPrice / 1.15) * 100) / 100,
    "COD-to-wallet applies inclusive tax",
  );
  identity("affiliate");
  const profits = await request("v1/affiliate-transactions", "get", undefined, {
    userId: "demo-merchant",
    pageSize: 500,
  });
  check(
    profits.total > 0 &&
      profits.results.every((t) => t.userId === "demo-affiliate" && t.shipment),
    "Affiliate ledger scoped and populated",
  );
  await request("v1/unhandled-demo-endpoint", "get", undefined, undefined, 501);
  const saved = snapshot();
  saved.countries[0].name.en = "Saved custom country";
  saved.payments = [];
  localStorage.setItem(key, JSON.stringify(saved));
  mock.restore();
  mock = mod.exports.installDemoApi();
  mock.delayResponse = 0;
  check(
    snapshot().countries[0].name.en === "Saved custom country" &&
      snapshot().payments.length === 0,
    "Reload preserves edits and intentionally empty collections",
  );
  const old = snapshot();
  delete old.shipments;
  delete old.payments;
  delete old.logs;
  delete old.affiliateTransactions;
  delete old.operationsVersion;
  localStorage.setItem(key, JSON.stringify(old));
  mock.restore();
  mock = mod.exports.installDemoApi();
  mock.delayResponse = 0;
  check(
    snapshot().shipments.length > 0 &&
      snapshot().users.find((u) => u.id === "demo-merchant").companyName ===
        "Saved demo business",
    "Older snapshot upgrade preserves profile edits",
  );
  const count = snapshot().requests.length;
  mock.restore();
  mock = mod.exports.installDemoApi();
  mock.delayResponse = 0;
  check(
    snapshot().requests.length === count,
    "Upgrade does not duplicate requests",
  );
  check(
    !initial.requests.some((row) => row.type === "verification"),
    "Retired review feature has no seeded request fixtures",
  );
  identity("merchant");
  const verification = await request(
    "v1/requests",
    "post",
    {
      type: "verification",
      userId: "demo-affiliate",
      status: "approved",
      name: "Demo Merchant",
      userType: "company",
      crUrl: "data:application/pdf;base64,JVBERi0=",
    },
    undefined,
    201,
  );
  check(
    verification.type === "verification" &&
      verification.userId === "demo-merchant" &&
      verification.status === "pending",
    "Onboarding verification still submits for the current account",
  );
  check(
    (await request("v1/users/me")).verificationStatus === "pending",
    "Onboarding verification status survives account refresh",
  );
  console.log(
    `Demo operations passed: ${checks} checks covering active collections, filters, ownership, local checkout, shipments, COD, withdrawals, affiliates, dashboards and saved-data upgrades`,
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mock?.restore());
