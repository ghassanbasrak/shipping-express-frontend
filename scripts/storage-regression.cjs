const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module"),
  esbuild = require("esbuild"),
  axios = require("axios");
const root = path.resolve(__dirname, ".."),
  output = path.join(root, "test-results/storage");
fs.mkdirSync(output, { recursive: true });
const memory = new Map();
global.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: (key) => memory.delete(key),
};
global.window = { location: { origin: "http://localhost:3000" } };
const stub = path.join(output, "api-stub.ts");
fs.writeFileSync(
  stub,
  "export const apiService={enhanceEndpoints(){return this},injectEndpoints(options){return {endpointDefinitions:options.endpoints({query:value=>value,mutation:value=>value})}}};",
);
function compile(contents, alias = {}) {
  const result = esbuild.buildSync({
    stdin: { contents, resolveDir: root },
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
    external: ["axios", "axios-mock-adapter", "jspdf", "xlsx"],
    alias,
    define: {
      "import.meta.env": JSON.stringify({
        VITE_DEMO_MODE: "true",
        VITE_BASE_URL: "https://demo.invalid",
      }),
    },
  });
  const mod = new Module(path.join(root, "scripts/storage-bundle.cjs"));
  mod.filename = path.join(root, "scripts/storage-bundle.cjs");
  mod.paths = module.paths;
  mod._compile(result.outputFiles[0].text, mod.filename);
  return mod.exports;
}
const api = compile(
  'export * from "./src/app/demo/demoApi";export * from "./src/app/main/storage-app/Utils";export * from "./src/app/main/storage-app/models/StorageSchemas";export * from "./src/app/main/shipments-app/Utils";export {default as SubscriptionApi} from "./src/app/main/storage-subscriptions-app/StorageSubscriptionsApi";export {default as NativeApi} from "./src/app/main/storage-app/StorageApi";',
  { "app/store/apiService": stub },
);
let mock,
  checks = 0;
const names = [];
const snapshot = () => JSON.parse(memory.get("ashamco-demo-data-v1")),
  identity = (value) => localStorage.setItem("ashamco-demo-identity", value);
function pass(name) {
  checks++;
  names.push(name);
  console.log("PASS " + name);
}
async function call(url, method = "get", data, params, status = 200) {
  const response = await axios({
    url,
    method,
    data,
    params,
    validateStatus: () => true,
  });
  assert.equal(
    response.status,
    status,
    method + " " + url + " " + JSON.stringify(response.data),
  );
  return response.data;
}
function alter(fn) {
  const db = snapshot();
  fn(db);
  localStorage.setItem("ashamco-demo-data-v1", JSON.stringify(db));
  mock.restore();
  mock = api.installDemoApi();
}
async function main() {
  mock = api.installDemoApi();
  assert(
    api.canManageStorage({
      role: "admin",
      features: [{ feature: "shipments", accessView: true }],
    }),
  );
  assert(
    !api.canManageStorage({
      role: "employee",
      features: [{ feature: "storage", accessView: true }],
    }),
  );
  pass(
    "Storage administration follows the native administrator role; no employee grant is invented",
  );
  const endpoints = {...api.NativeApi.endpointDefinitions,...api.SubscriptionApi.endpointDefinitions};
  assert.deepEqual(
    endpoints.verifyStoragePayment.query({
      paymentId: "internal-id",
      userId: "cache-owner",
      moyasarPaymentId: "ignored",
    }),
    {
      url: "v1/payments/internal-id/check-status",
      method: "POST",
      data: {},
    },
  );
  pass(
    "Storage verification sends only the internal payment ID with no provider credentials or ID",
  );
  assert.equal(
    endpoints.getWarehouses.query({ admin: true }).url,
    "v1/warehouses/admin",
  );
  assert.equal(endpoints.getWarehouses.query({}).url, "v1/warehouses");
  assert.equal(
    endpoints.getSupplyRequests.query({ admin: true }).url,
    "v1/storage/supply-requests/admin",
  );
  assert.deepEqual(
    endpoints.reviewSupplyRequest.query({
      id: "request",
      status: "received",
      notes: "ignored",
      expectedVersion: 5,
    }).data,
    { status: "received" },
  );
  assert.deepEqual(
    endpoints.getStorageProducts.query({
      userId: "foreign",
      warehouseId: "warehouse",
    }).params,
    { warehouseId: "warehouse" },
  );
  pass(
    "RTK endpoints use native routes and omit ownership, version and review-note overrides",
  );
  const warehouse = (await call("v1/warehouses/admin"))[0],
    plans = await call("v1/storage/plans/admin"),
    basic = plans[0];
  assert(Array.isArray(warehouse.storageTypes));
  assert(warehouse.mapAddress);
  assert(Array.isArray(plans));
  pass(
    "Native warehouse and plan lists are raw arrays with pickup/map and storage types",
  );
  const newWarehouse = api.warehouseSaveValues({
    name: " Second ",
    storageTypes: warehouse.storageTypes,
    mapAddress: "https://maps.google.com/?q=Riyadh",
    information: "Receiving desk",
    pickup: warehouse.pickup,
  });
  const second = await call(
    "v1/warehouses",
    "post",
    newWarehouse,
    undefined,
    201,
  );
  assert.equal(second.name, "Second");
  assert.equal(api.warehousePickupWasSaved(second, newWarehouse), true);
  assert.equal(
    api.warehousePickupWasSaved({ ...second, pickup: undefined }, newWarehouse),
    false,
  );
  assert.equal(
    api.warehousePickupWasSaved(
      { ...second, pickup: { ...second.pickup, phone: "+966-500000000" } },
      newWarehouse,
    ),
    false,
  );
  pass(
    "Warehouse save confirmation rejects missing or changed pickup data instead of reporting a complete save",
  );
  const planArg = api.storagePlanSaveValues({
    name: "Free",
    price: 100,
    discountPrice: 0,
    durationDays: 7,
    featuresText: "Dry\nChilled",
    storageTypes: ["dry", "chilled"],
    isActive: true,
  });
  const free = await call("v1/storage/plans", "post", planArg, undefined, 201);
  assert.equal(api.storagePlanPrice(free), 0);
  pass(
    "Warehouse save fields and zero discounted plan prices use the prepared contract",
  );
  assert(
    !api
      .storagePlanSchema((k) => k)
      .safeParse({ ...planArg, discountPrice: 101, featuresText: "Dry" })
      .success,
  );
  assert(
    !api
      .storagePlanSchema((k) => k)
      .safeParse({ ...planArg, durationDays: 0, featuresText: "Dry" }).success,
  );
  assert(
    !api
      .storagePlanSchema((k) => k)
      .safeParse({ ...planArg, price: Infinity, featuresText: "Dry" }).success,
  );
  pass(
    "Invalid discounts, durations and nonfinite prices retain validation failures",
  );
  identity("merchant");
  await call("v1/storage/products", "get", undefined, undefined, 403);
  await call("v1/warehouses", "get", undefined, undefined, 403);
  await call("v1/warehouses/admin", "get", undefined, undefined, 403);
  pass(
    "Unsubscribed inventory and merchant access to administrative lists are refused",
  );
  const walletBalance = snapshot().users.find(
    (row) => row.id === "demo-merchant",
  ).balance;
  const walletCheckout = await call(
    "v1/payments/moyasar",
    "post",
    { amount: 100 },
    undefined,
    201,
  );
  assert.equal(walletCheckout.payment.type, "topup");
  assert.equal(walletCheckout.payment.paymentMethodType, null);
  assert.equal(
    walletCheckout.checkoutUrl,
    "http://localhost:3000/demo/payment/" + walletCheckout.payment.id,
  );
  await call(
    "v1/payments/" + walletCheckout.payment.id + "/check-status",
    "post",
    {},
  );
  assert.equal(
    snapshot().users.find((row) => row.id === "demo-merchant").balance,
    walletBalance,
  );
  pass(
    "Hosted wallet checkout stays pending and never credits before provider confirmation",
  );
  await call(
    "v1/payments/" + walletCheckout.payment.id + "/demo-complete",
    "post",
    { paymentMethodType: "applepay" },
  );
  const paidWallet = await call(
    "v1/payments/" + walletCheckout.payment.id + "/check-status",
    "post",
    {},
  );
  assert.equal(paidWallet.paymentMethodType, "applepay");
  assert.equal(paidWallet.status, "success");
  pass("Verified hosted wallet payment retains the backend method enum");
  await call(
    "v1/payments/" + walletCheckout.payment.id + "/check-status",
    "post",
    {},
  );
  assert.equal(
    snapshot().users.find((row) => row.id === "demo-merchant").balance,
    walletBalance + 100,
  );
  pass(
    "Repeated hosted invoice verification credits the wallet exactly once in the demo backend",
  );
  const before = snapshot().users.find(
    (row) => row.id === "demo-merchant",
  ).balance;
  const checkout = await call(
    "v1/storage/subscriptions/checkout",
    "post",
    { planId: basic.id },
    undefined,
    201,
  );
  assert.equal(
    checkout.checkoutUrl,
    "http://localhost:3000/demo/payment/" + checkout.payment.id,
  );
  assert.equal(
    checkout.payment.taxTotal,
    Math.round(basic.discountPrice * 0.15 * 100) / 100,
  );
  assert.equal(await call("v1/storage/subscriptions/current"), null);
  assert.equal(
    snapshot().users.find((row) => row.id === "demo-merchant").balance,
    before,
  );
  pass(
    "Checkout returns the server tax/total and does not activate service or debit the wallet",
  );
  await call(
    "v1/payments/" + checkout.payment.id + "/check-status",
    "post",
    {},
  );
  assert.equal(await call("v1/storage/subscriptions/current"), null);
  pass("Unverified payment cannot activate storage");
  await call("v1/payments/" + checkout.payment.id + "/demo-complete", "post", {
    paymentMethodType: "mada",
  });
  await call(
    "v1/payments/" + checkout.payment.id + "/check-status",
    "post",
    {},
  );
  let subscription = await call("v1/storage/subscriptions/current");
  assert(api.hasActiveStorageSubscription(subscription, "demo-merchant"));
  assert(!api.hasActiveStorageSubscription(subscription, "demo-affiliate"));
  assert.deepEqual(subscription.plan.storageTypes, basic.storageTypes);
  pass(
    "Verified payment exposes an owner-matched active subscription with populated plan features",
  );
  await call(
    "v1/payments/" + checkout.payment.id + "/check-status",
    "post",
    {},
  );
  assert.equal(snapshot().storage.subscriptions.length, 1);
  await call(
    "v1/storage/subscriptions/checkout",
    "post",
    { planId: basic.id },
    undefined,
    409,
  );
  pass("Payment verification replay does not create another subscription");
  const item = {
    sku: "SKU-A",
    name: "Product A",
    quantity: 10,
    unitPrice: 5,
    storageType: basic.storageTypes[0],
    notes: "Handle carefully",
  };
  await call(
    "v1/storage/supply-requests",
    "post",
    {
      warehouseId: warehouse.id,
      products: [{ ...item, storageType: "Not included" }],
    },
    undefined,
    400,
  );
  const supplyArg = api.supplySaveValues({
    warehouseId: warehouse.id,
    products: [
      { ...item, sku: " SKU-A " },
      { ...item, sku: "", name: "No SKU", quantity: 2 },
    ],
  });
  assert(!("sku" in supplyArg.products[1]));
  assert(
    api
      .supplyRequestSchema((key) => key, basic.storageTypes)
      .safeParse({
        warehouseId: warehouse.id,
        products: [{ ...item, mode: "new", unitPrice: 0.001 }],
      }).success,
    "The native supply contract does not restrict unit-price decimal precision",
  );
  pass(
    "Supply types use shared enum capabilities; optional SKU and exact case are preserved",
  );
  const request = await call(
    "v1/storage/supply-requests",
    "post",
    { ...supplyArg, userId: "demo-affiliate" },
    undefined,
    201,
  );
  assert.equal(request.userId, "demo-merchant");
  assert.equal(request.status, "pending");
  assert.equal(snapshot().storage.products.length, 0);
  pass(
    "Pending supplies retain product snapshots and authenticated ownership without creating stock",
  );
  identity("admin");
  const adminRows = await call("v1/storage/supply-requests/admin");
  assert(adminRows.find((row) => row.id === request.id).user.phone);
  pass("Administrator supply rows include the merchant contact");
  const status = (id, value, expected = 200) =>
    call(
      "v1/storage/supply-requests/admin/" + id + "/status",
      "patch",
      { status: value },
      undefined,
      expected,
    );
  await status(request.id, "received", 400);
  await status(request.id, "approved");
  assert.equal(snapshot().storage.products.length, 0);
  pass(
    "Approval never creates inventory and physical receipt requires approval first",
  );
  await status(request.id, "received");
  assert.equal(
    snapshot().storage.products.find((row) => row.sku === "SKU-A").quantity,
    10,
  );
  await status(request.id, "received", 400);
  assert.equal(
    snapshot().storage.products.find((row) => row.sku === "SKU-A").quantity,
    10,
  );
  pass("Received quantities are added once and a repeated receipt is rejected");
  async function receive(products, warehouseId = warehouse.id) {
    identity("merchant");
    const row = await call(
      "v1/storage/supply-requests",
      "post",
      { warehouseId, products },
      undefined,
      201,
    );
    identity("admin");
    await status(row.id, "approved");
    await status(row.id, "received");
    return row;
  }
  await receive([{ ...item, quantity: 3, unitPrice: 6 }]);
  let stock = snapshot().storage.products.find((row) => row.sku === "SKU-A");
  assert.equal(stock.quantity, 13);
  assert.equal(stock.unitPrice, 6);
  pass(
    "Repeated SKU, warehouse and storage type increase stock with the latest received unit price",
  );
  await receive([{ ...item, quantity: 2 }], second.id);
  assert.equal(
    snapshot().storage.products.filter((row) => row.sku === "SKU-A").length,
    2,
  );
  pass("The same SKU in another warehouse remains independent");
  identity("affiliate");
  const trial = await call(
    "v1/storage/subscriptions/checkout",
    "post",
    { planId: free.id },
    undefined,
    201,
  );
  assert.equal(trial.checkoutUrl, null);
  assert(
    api.hasActiveStorageSubscription(
      await call("v1/storage/subscriptions/current"),
      "demo-affiliate",
    ),
  );
  pass("Free plans activate server-side without a card or wallet charge");
  const foreign = await call(
    "v1/storage/supply-requests",
    "post",
    {
      warehouseId: warehouse.id,
      products: [{ ...item, storageType: "dry", quantity: 2 }],
    },
    undefined,
    201,
  );
  identity("admin");
  await status(foreign.id, "approved");
  await status(foreign.id, "received");
  identity("merchant");
  const mine = await call("v1/storage/products", "get", undefined, {
    userId: "demo-affiliate",
  });
  assert(mine.every((row) => row.userId === "demo-merchant"));
  assert(
    (await call("v1/storage/supply-requests")).every(
      (row) => row.userId === "demo-merchant",
    ),
  );
  pass(
    "Product and supply lists remain account-scoped despite caller owner overrides",
  );
  const carrier = snapshot().shippingCompanies.find((row) => row.isActive),
    country =
      snapshot().countries.find((row) => row.code === "SA") ||
      snapshot().countries[0];
  const form = {
    shippingCompanyId: carrier.id,
    shippingCompany: carrier,
    method: "local",
    type: "box",
    length: 1,
    width: 1,
    height: 1,
    weight: 1,
    packagesCount: 1,
    description: "Storage order",
    isCod: false,
    senderName: "Sender",
    senderPhoneCountry: "+966",
    senderPhone: "555123456",
    senderCountryId: country.id,
    senderStreet: "Pickup street",
    receiverName: "Receiver",
    receiverPhoneCountry: "+966",
    receiverPhone: "555123457",
    receiverCountryId: country.id,
    receiverStreet: "Receiver street",
    fulfillmentSource: "warehouse",
    warehouseId: warehouse.id,
    warehouse: api.shipmentWarehouseSnapshot(warehouse),
    warehouseItems: [{ productId: stock.id, quantity: 4, product: stock }],
  };
  assert.doesNotThrow(() =>
    api.compressShipment({
      ...form,
      warehouseItems: [{ productId: "", quantity: 1 }],
    }),
  );
  const shipment = api.compressShipment(form);
  assert.equal(shipment.products[0].warehouseProductId, stock.id);
  assert.equal(shipment.products[0].quantity, 4);
  assert(!("storageFulfillment" in shipment));
  assert.equal(shipment.warehouseId, warehouse.id);
  assert(!("isCommercial" in shipment));
  pass(
    "Warehouse shipment serializer uses native products with warehouseProductId and quantity while preserving sender details",
  );
  const { shippingCompanyId: _reviewCarrier, ...reviewBody } = shipment;
  const offers = await call(
    "v1/shipments/review/companies",
    "post",
    reviewBody,
  );
  assert(Array.isArray(offers.suitableCompanies));
  assert(Array.isArray(offers.unsuitableCompanies));
  assert.equal(
    snapshot().storage.products.find((row) => row.id === stock.id).quantity,
    13,
  );
  pass("Price review does not deduct inventory");
  const created = await call("v1/shipments", "post", shipment, undefined, 201);
  assert(created.id);
  assert.equal(
    snapshot().storage.products.find((row) => row.id === stock.id).quantity,
    9,
  );
  pass("Accepted warehouse creation deducts only the selected owned quantity");
  const foreignProduct = snapshot().storage.products.find(
    (row) => row.userId === "demo-affiliate",
  );
  await call(
    "v1/shipments",
    "post",
    {
      ...shipment,
      products: [
        {
          title: "Foreign",
          price: 5,
          quantity: 1,
          warehouseProductId: foreignProduct.id,
        },
      ],
    },
    undefined,
    403,
  );
  pass("Foreign stock cannot be allocated to another merchant");
  const concurrent = await Promise.all([
    axios.post(
      "v1/shipments",
      { ...shipment, products: [{ ...shipment.products[0], quantity: 6 }] },
      { validateStatus: () => true },
    ),
    axios.post(
      "v1/shipments",
      { ...shipment, products: [{ ...shipment.products[0], quantity: 6 }] },
      { validateStatus: () => true },
    ),
  ]);
  assert.deepEqual(concurrent.map((row) => row.status).sort(), [201, 409]);
  assert.equal(
    snapshot().storage.products.find((row) => row.id === stock.id).quantity,
    3,
  );
  pass("Concurrent simulated shipment allocations cannot oversell");
  alter((db) => {
    db.storage.subscriptions.find(
      (row) => row.userId === "demo-merchant",
    ).endsAt = new Date(Date.now() - 1000).toISOString();
  });
  await call("v1/storage/products", "get", undefined, undefined, 403);
  await call("v1/shipments", "post", shipment, undefined, 403);
  pass("Expired subscriptions block stock reads and warehouse shipments");
  const external = api.compressShipment({
    ...form,
    fulfillmentSource: "external",
  });
  assert(!external.products);
  await call("v1/shipments", "post", external, undefined, 201);
  pass(
    "External-product shipments keep their existing serializer and creation flow",
  );
  // Execute the real backend Zod declarations. Only shared environment/database primitives
  // are isolated; no backend service, MongoDB, gateway or carrier is started.
  const backend =
    process.env.STORAGE_BACKEND_DIR ||
    path.join(
      process.env.USERPROFILE || "",
      "Desktop/Node.Js Projects/shipping-express-backend",
    );
  let backendSchemas = 0;
  if (
    fs.existsSync(path.join(backend, "src/api/validations/schema/v1/storagePlans.ts")) &&
    /storageTypes/.test(fs.readFileSync(path.join(backend, "src/api/validations/schema/v1/storagePlans.ts"), "utf8"))
  ) {
    const common = path.join(output, "backend-common-stub.ts");
    fs.writeFileSync(
      common,
      'import {z} from "zod";export const objectId=z.string().regex(/^[0-9a-fA-F]{24}$/);export const page=z.any(),pageSize=z.any(),orderColumn=z.any(),orderDirection=z.any();',
    );
    const schemas = compile(
      [
        "warehouses",
        "storagePlans",
        "storageSubscriptions",
        "supplyRequests",
        "shipments",
      ]
        .map(
          (name, index) =>
            "export * as schema" +
            index +
            " from " +
            JSON.stringify(
              path.join(backend, "src/api/validations/schema/v1", name + ".ts"),
            ) +
            ";",
        )
        .join(""),
      {
        "@app/api/validations/schema/common": common,
        "@app/utils/enums": path.join(backend, "src/utils/enums.ts"),
        zod: require.resolve("zod"),
      },
    );
    const id = "507f1f77bcf86cd799439011";
    for (const [schema, payload] of [
      [
        schemas.schema0.create,
        {
          ...newWarehouse,
          pickup: {
            ...newWarehouse.pickup,
            countryId: id,
            stateId: id,
            cityId: id,
          },
        },
      ],
      [schemas.schema1.create, planArg],
      [schemas.schema2.checkout, { planId: id }],
      [schemas.schema3.create, { ...supplyArg, warehouseId: id }],
      [schemas.schema3.updateStatus, { status: "received" }],
      [
        schemas.schema4.create,
        {
          ...shipment,
          quoteId: id,
          warehouseId: id,
          shippingCompanyId: id,
          senderCountryId: id,
          receiverCountryId: id,
          products: [{ ...shipment.products[0], warehouseProductId: id }],
        },
      ],
    ]) {
      const wire = JSON.parse(JSON.stringify(payload));
      const parsed = schema.parse(wire);
      if (schema === schemas.schema4.create)
        assert.deepEqual(parsed.products, wire.products);
      else assert.deepEqual(parsed, wire);
      backendSchemas++;
    }
    pass(
      "Real backend Zod declarations accept six native payloads and retain warehouse product IDs",
    );
  }
  fs.writeFileSync(
    path.join(output, "contracts.json"),
    JSON.stringify(
      {
        checks,
        backendSchemas,
        names,
        scope:
          "Frontend/demo contracts plus backend validation declarations with shared environment/database primitives isolated. No live backend, database, payment or carrier execution.",
      },
      null,
      2,
    ),
  );
  console.log(
    checks +
      "/" +
      checks +
      " storage checks passed; " +
      backendSchemas +
      " backend schema payloads accepted.",
  );
}
main()
  .catch((error) => {
    console.error(error.stack || String(error));
    process.exitCode = 1;
  })
  .finally(() => mock?.restore());
