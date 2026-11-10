// Local simulation of the storage contracts in backend develop (175f3c3).
// It never calls a payment gateway or a live backend.
import type { User } from "../auth/user";
import type { Context, DemoDbForExtras, DemoRow } from "./demoExtraApi";
import type { DemoOperationsDb } from "./demoOperations";
import { getDemoUser } from "./demoMode";
import type IWarehouse from "../main/storage-app/models/IWarehouse";
import type IStoragePlan from "../main/storage-app/models/IStoragePlan";
import type IStorageSubscription from "../main/storage-app/models/IStorageSubscription";
import type IStorageProduct from "../main/storage-app/models/IStorageProduct";
import type ISupplyRequest from "../main/storage-app/models/ISupplyRequest";
import type { StoragePaymentResponse } from "../main/storage-app/StorageApi";
import {
  allowedSupplyTransitions,
  canManageStorage,
  hasActiveStorageSubscription,
  storagePlanPrice,
} from "../main/storage-app/Utils";
import {
  warehouseSchema,
  storagePlanSchema,
  supplyRequestSchema,
} from "../main/storage-app/models/StorageSchemas";
type Reply = [number, unknown];
export type DemoStorageDb = {
  storage: {
    schemaVersion: 2;
    quotes?: {
      id: string;
      userId: string;
      shippingCompanyId: string;
      fingerprint: string;
      expiresAt: number;
      consumed: boolean;
    }[];
    warehouses: IWarehouse[];
    plans: IStoragePlan[];
    subscriptions: IStorageSubscription[];
    supplies: ISupplyRequest[];
    products: IStorageProduct[];
    payments: StoragePaymentResponse[];
    allocations: { shipmentId: string; productId: string; quantity: number }[];
  };
};
type Db = DemoDbForExtras & DemoOperationsDb & DemoStorageDb;
type StorageContext = Omit<Context, "db"> & { db: Db };
const uid = () => "storage-" + crypto.randomUUID(),
  stamp = () => new Date().toISOString();
const fail = (message: string, status = 400): Reply => [status, { message }];
let queue: Promise<unknown> = Promise.resolve();
function transaction<T>(fn: () => Promise<T> | T): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => undefined);
  return next;
}
export function ensureDemoStorage(
  db: DemoDbForExtras & Partial<DemoStorageDb>,
) {
  if (db.storage?.schemaVersion === 2) return;
  const country =
    db.countries.find((row) => row.code === "SA") || db.countries[0];
  const state = db.states.find((row) => row.countryId === country?.id);
  const city = db.cities.find((row) => row.stateId === state?.id);
  db.storage = {
    schemaVersion: 2,
    warehouses: [
      {
        id: "storage-warehouse-riyadh",
        pickup: {
          phone: "+966-555123456",
          countryId: country?.id || "",
          stateId: state?.id || "",
          cityId: city?.id || "",
          street: "Warehouse pickup street",
          nationalAddress: "WH1234",
          zipCode: city?.postalCode || "",
        },
        name: "Riyadh warehouse / مستودع الرياض",
        address: "Riyadh, Saudi Arabia / الرياض، المملكة العربية السعودية",
        mapAddress: "https://www.google.com/maps?q=24.7136,46.6753",
        information:
          "Incoming supplies are received after approval. / يستقبل المستودع طلبات التوريد بعد الموافقة.",
      },
    ],
    plans: [
      {
        id: "storage-plan-essential",
        name: "Essential / الأساسية",
        price: 120,
        discountPrice: 99,
        durationDays: 30,
        features: ["Standard / عادي", "Dry / جاف"],
        isActive: true,
      },
      {
        id: "storage-plan-cold",
        name: "Cold storage / التخزين المبرد",
        price: 240,
        discountPrice: 199,
        durationDays: 30,
        features: [
          "Standard / عادي",
          "Dry / جاف",
          "Chilled / مبرد",
          "Frozen / مجمد",
        ],
        isActive: true,
      },
    ],
    subscriptions: [],
    supplies: [],
    products: [],
    payments: [],
    allocations: [],
  };
}
function current(db: Db, userId: string) {
  const row = db.storage.subscriptions.find(
    (row) =>
      row.userId === userId &&
      row.status === "active" &&
      Date.parse(row.startsAt) <= Date.now() &&
      Date.parse(row.endsAt) > Date.now(),
  );
  return row
    ? { ...row, plan: db.storage.plans.find((plan) => plan.id === row.planId) }
    : null;
}
function owner(db: Db, userId: string) {
  return db.users.find((row) => row.id === userId) || getDemoUser();
}
function supplyView(db: Db, row: ISupplyRequest) {
  return {
    ...row,
    warehouse: db.storage.warehouses.find(
      (item) => item.id === row.warehouseId,
    ),
    user: owner(db, row.userId),
  };
}
function activate(db: Db, payment: StoragePaymentResponse) {
  const existing = db.storage.subscriptions.find(
    (row) => row.paymentId === payment.id,
  );
  if (existing) return existing;
  if (current(db, payment.userId))
    throw new Error("An active storage subscription already exists");
  const plan = db.storage.plans.find((row) => row.id === payment.storagePlanId);
  if (!plan) throw new Error("Storage plan not found");
  const row: IStorageSubscription = {
    id: uid(),
    userId: payment.userId,
    planId: plan.id,
    paymentId: payment.id,
    status: "active",
    price: payment.amount,
    startsAt: stamp(),
    endsAt: new Date(Date.now() + plan.durationDays * 86400000).toISOString(),
  };
  db.storage.subscriptions.push(row);
  return row;
}
export async function handleDemoStorage(
  context: StorageContext,
): Promise<Reply | undefined> {
  const { db, path, data } = context;
  const method = context.method.toUpperCase(),
    userId = getDemoUser().id;
  const paymentRead = /^v1\/payments\/([^/]+)$/.exec(path);
  if (paymentRead && method === "GET") {
    const payment = db.storage.payments.find(row => row.id === paymentRead[1]);
    if (payment) return payment.userId === userId ? [200, payment] : fail("Payment not found", 404);
  }
  const paymentStatus = /^v1\/payments\/([^/]+)\/check-status$/.exec(path);
  if (
    !path.startsWith("v1/storage/") &&
    !path.startsWith("v1/warehouses") &&
    !paymentStatus
  )
    return undefined;
  if (
    paymentStatus &&
    !db.storage.payments.some((row) => row.id === paymentStatus[1])
  )
    return undefined;
  return await transaction(() => {
    const user = owner(db, userId) as User,
      admin = canManageStorage(user),
      merchant = user.role === "user";
    const write = method !== "GET",
      operation = method === "POST" ? "create" : "update";
    if (!merchant && !admin) return fail("Storage access denied", 403);
    if (paymentStatus) {
      const payment = db.storage.payments.find(
        (row) => row.id === paymentStatus[1] && row.userId === userId,
      );
      if (!merchant || !payment) return fail("Payment not found", 404);
      if (data.moyasarPaymentId !== "demo-moyasar-" + payment.id)
        return fail("Payment verification failed");
      try {
        activate(db, payment);
        payment.status = "success";
        context.save();
        return [200, payment];
      } catch (e) {
        return fail((e as Error).message, 409);
      }
    }
    if (path === "v1/storage/subscriptions/current" && method === "GET")
      return [200, current(db, userId)];
    if (path === "v1/storage/subscriptions/checkout" && method === "POST") {
      if (!merchant) return fail("Merchant access required", 403);
      if (current(db, userId))
        return fail("An active storage subscription already exists", 409);
      const plan = db.storage.plans.find(
        (row) => row.id === data.planId && row.isActive,
      );
      if (!plan) return fail("Storage plan not found", 404);
      const amount = storagePlanPrice(plan),
        total = Math.round(amount * 115) / 100;
      if (!Number.isFinite(amount) || amount < 0 || (amount > 0 && total < 1))
        return fail("Invalid storage plan price");
      const payment: StoragePaymentResponse = {
        id: uid(),
        userId,
        storagePlanId: plan.id,
        amount,
        taxTotal: Math.round((total - amount) * 100) / 100,
        total,
        status: amount === 0 ? "success" : "pending",
      };
      db.storage.payments.push(payment);
      const subscription = amount === 0 ? activate(db, payment) : undefined;
      context.save();
      return [
        201,
        {
          payment,
          checkout:
            amount === 0
              ? null
              : {
                  publishable_api_key: "pk_test_demo_storage",
                  amount: Math.round(total * 100),
                  currency: "SAR",
                  description: "Storage subscription " + plan.name,
                  callback_url:
                    window.location.origin +
                    "/storage/payment-result?paymentId=" +
                    encodeURIComponent(payment.id),
                  methods: ["creditcard"],
                },
          ...(subscription ? { subscription } : {}),
        },
      ];
    }
    if (path.startsWith("v1/warehouses")) {
      const id = path.slice("v1/warehouses/".length);
      if (method === "GET") {
        if (path === "v1/warehouses/admin") {
          if (!admin) return fail("Admin access required", 403);
          return [200, db.storage.warehouses];
        }
        if (!current(db, userId))
          return fail("Active storage subscription required", 403);
        if (path === "v1/warehouses") return [200, db.storage.warehouses];
        const row = db.storage.warehouses.find((row) => row.id === id);
        return row ? [200, row] : fail("Warehouse not found", 404);
      }
      if (!canManageStorage(user, operation))
        return fail("Admin access required", 403);
      const parsed = warehouseSchema((key) => key).safeParse(data);
      if (parsed.success === false) return fail(parsed.error.issues[0].message);
      const value = parsed.data;
      if (method === "POST" && path === "v1/warehouses") {
        const row = {
          ...value,
          id: uid(),
          createdAt: stamp(),
          updatedAt: stamp(),
        } as IWarehouse;
        db.storage.warehouses.push(row);
        context.save();
        return [201, row];
      }
      const row = db.storage.warehouses.find((row) => row.id === id);
      if (method === "PATCH" && row) {
        Object.assign(row, value, { updatedAt: stamp() });
        context.save();
        return [200, row];
      }
      return fail("Warehouse not found", 404);
    }
    if (path.startsWith("v1/storage/plans")) {
      const id = path.slice("v1/storage/plans/".length);
      if (method === "GET") {
        if (path === "v1/storage/plans/admin") {
          if (!admin) return fail("Admin access required", 403);
          return [200, db.storage.plans];
        }
        if (path === "v1/storage/plans")
          return [200, db.storage.plans.filter((row) => row.isActive)];
        const row = db.storage.plans.find((row) => row.id === id);
        return row ? [200, row] : fail("Storage plan not found", 404);
      }
      if (!canManageStorage(user, operation))
        return fail("Admin access required", 403);
      const parsed = storagePlanSchema((key) => key).safeParse({
        ...data,
        featuresText: Array.isArray(data.features)
          ? data.features.join("\n")
          : "",
      });
      if (parsed.success === false) return fail(parsed.error.issues[0].message);
      const { featuresText, ...fields } = parsed.data;
      const value = {
        ...fields,
        ...(fields.discountPrice == null ? { discountPrice: undefined } : {}),
        features: featuresText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      };
      if (method === "POST" && path === "v1/storage/plans") {
        const row = {
          ...value,
          id: uid(),
          createdAt: stamp(),
          updatedAt: stamp(),
        } as IStoragePlan;
        db.storage.plans.push(row);
        context.save();
        return [201, row];
      }
      const row = db.storage.plans.find((row) => row.id === id);
      if (method === "PATCH" && row) {
        Object.assign(row, value, { updatedAt: stamp() });
        context.save();
        return [200, row];
      }
      return fail("Storage plan not found", 404);
    }
    if (path === "v1/storage/supply-requests/admin" && method === "GET") {
      if (!admin) return fail("Admin access required", 403);
      return [200, db.storage.supplies.map((row) => supplyView(db, row))];
    }
    if (path === "v1/storage/supply-requests") {
      if (!merchant) return fail("Merchant access required", 403);
      if (method === "GET")
        return [
          200,
          db.storage.supplies
            .filter((row) => row.userId === userId)
            .map((row) => supplyView(db, row)),
        ];
      if (method === "POST") {
        const subscription = current(db, userId);
        if (!hasActiveStorageSubscription(subscription, userId))
          return fail("Active storage subscription required", 403);
        const parsed = supplyRequestSchema(
          (key) => key,
          subscription.plan.features,
        ).safeParse(data);
        if (parsed.success === false)
          return fail(parsed.error.issues[0].message);
        if (
          !db.storage.warehouses.some(
            (row) => row.id === parsed.data.warehouseId,
          )
        )
          return fail("Warehouse not found", 404);
        const row: ISupplyRequest = {
          id: uid(),
          userId,
          warehouseId: parsed.data.warehouseId,
          products: parsed.data.products as ISupplyRequest["products"],
          status: "pending",
          createdAt: stamp(),
          updatedAt: stamp(),
        };
        db.storage.supplies.unshift(row);
        context.save();
        return [201, supplyView(db, row)];
      }
    }
    const review =
      /^v1\/storage\/supply-requests\/admin\/([^/]+)\/status$/.exec(path);
    if (review && method === "PATCH") {
      if (!canManageStorage(user, "update"))
        return fail("Admin access required", 403);
      const row = db.storage.supplies.find((row) => row.id === review[1]);
      if (!row) return fail("Supply request not found", 404);
      if (!allowedSupplyTransitions(row.status).includes(data.status))
        return fail("Invalid supply request transition");
      if (data.status === "received")
        for (const product of row.products) {
          const existing = db.storage.products.find(
            (item) =>
              item.userId === row.userId &&
              item.warehouseId === row.warehouseId &&
              item.storageType === product.storageType &&
              (product.sku
                ? item.sku === product.sku
                : item.name === product.name),
          );
          if (existing) {
            existing.quantity += product.quantity;
            existing.unitPrice = product.unitPrice;
            existing.updatedAt = stamp();
          } else
            db.storage.products.push({
              id: uid(),
              userId: row.userId,
              warehouseId: row.warehouseId,
              name: product.name,
              sku: product.sku,
              storageType: product.storageType,
              quantity: product.quantity,
              unitPrice: product.unitPrice,
              createdAt: stamp(),
              updatedAt: stamp(),
            });
        }
      row.status = data.status;
      row.updatedAt = stamp();
      context.save();
      return [200, supplyView(db, row)];
    }
    if (path === "v1/storage/products" && method === "GET") {
      if (!merchant || !current(db, userId))
        return fail("Active storage subscription required", 403);
      return [
        200,
        db.storage.products.filter(
          (row) =>
            row.userId === userId &&
            row.quantity > 0 &&
            (!context.params.warehouseId ||
              row.warehouseId === context.params.warehouseId),
        ),
      ];
    }
    return fail("Unknown storage endpoint", 404);
  });
}
export async function withDemoStorageShipment(
  context: StorageContext,
  run: () => Promise<Reply | undefined> | Reply | undefined,
  internalReview = false,
): Promise<Reply | undefined> {
  const userId = getDemoUser().id;
  const original = structuredClone(context.data);
  if (
    context.method === "post" &&
    context.path === "v1/shipments/review/companies" &&
    !internalReview
  ) {
    const suitableCompanies = [],
      unsuitableCompanies = [];
    const merchant = context.db.users.find((row) => row.id === userId);
    try {
      for (const company of context.db.shippingCompanies.filter(
        (row) => row.isActive,
      )) {
        const shippingCompany = Object.fromEntries(
          ["id", "name", "serviceName", "color", "logoUrl", "iconUrl"].map(
            (key) => [key, company[key]],
          ),
        );
        const reasons = [];
        if (!company.shippingMethods?.includes(original.method))
          reasons.push({
            code: "METHOD_NOT_SUPPORTED",
            message: "Shipping method is not supported",
          });
        if (company.isAuthorizationRequired && !merchant?.isAuthorized)
          reasons.push({
            code: "AUTHORIZATION_REQUIRED",
            message: "Account authorization is required",
          });
        if (
          original.isCod &&
          !company.shippingMethods?.includes("cashOnDelivery")
        )
          reasons.push({
            code: "COD_NOT_SUPPORTED",
            message: "Cash on delivery is not supported",
          });
        const coupon = context.db.coupons.find(
          (row) => row.id === original.couponCodeId,
        );
        if (
          coupon?.shippingCompanyId &&
          coupon.shippingCompanyId !== company.id
        )
          reasons.push({
            code: "COUPON_NOT_APPLICABLE",
            message: "Coupon is not available for this carrier",
          });
        for (const side of ["sender", "receiver"])
          for (const [kind, rows] of [
            ["state", context.db.shipmentStates],
            ["city", context.db.shipmentCities],
          ] as const) {
            if (kind === "state" && !company.hasState) continue;
            const field = side + kind[0].toUpperCase() + kind.slice(1) + "Id";
            if (
              rows.some((row) => row.shippingCompanyId === company.id) &&
              !rows.some(
                (row) =>
                  row.shippingCompanyId === company.id &&
                  row[kind + "Id"] === original[field] &&
                  row.isActive !== false,
              )
            )
              reasons.push({
                code: (side + "_" + kind + "_NOT_SUPPORTED").toUpperCase(),
                message: "Address is not covered",
              });
          }
        if (reasons.length) {
          unsuitableCompanies.push({ shippingCompany, reasons });
          continue;
        }
        context.data = {
          ...structuredClone(original),
          shippingCompanyId: company.id,
        };
        const reply = await withDemoStorageShipment(context, run, true);
        if (reply?.[0] === 200) {
          const { quoteId, ...calculation } = reply[1] as DemoRow;
          suitableCompanies.push({ shippingCompany, calculation, quoteId });
        } else
          unsuitableCompanies.push({
            shippingCompany,
            reasons: [
              {
                code: "PRICING_FAILED",
                message: (reply?.[1] as DemoRow)?.message || "Pricing failed",
              },
            ],
          });
      }
      context.save();
      return [
        200,
        {
          suitableCompanies: suitableCompanies.sort(
            (a, b) => a.calculation.total - b.calculation.total,
          ),
          unsuitableCompanies,
        },
      ];
    } finally {
      context.data = original;
    }
  }
  const selected = Array.isArray(context.data.products)
    ? context.data.products.filter((product) => product.warehouseProductId)
    : [];
  if (
    (context.path === "v1/shipments/review/companies" ||
      context.path === "v1/shipments") &&
    (selected.length || context.data.warehouseId)
  ) {
    if (!hasActiveStorageSubscription(current(context.db, userId), userId))
      return fail("Active storage subscription required", 403);
    const warehouse = context.db.storage.warehouses.find(
      (row) => row.id === context.data.warehouseId,
    );
    if (!warehouse?.pickup)
      return fail(
        "Warehouse pickup details must be completed by an administrator",
      );
    if (!selected.length || selected.length !== context.data.products.length)
      return fail("Select warehouse products");
    for (const item of selected) {
      const row = context.db.storage.products.find(
        (row) =>
          row.id === item.warehouseProductId &&
          row.userId === userId &&
          row.warehouseId === warehouse.id,
      );
      if (!row) return fail("Invalid warehouse product", 403);
      Object.assign(item, { title: row.name, price: row.unitPrice });
    }
    const pickup = warehouse.pickup,
      country = context.db.countries.find((row) => row.id === pickup.countryId),
      state = context.db.states.find((row) => row.id === pickup.stateId),
      city = context.db.cities.find((row) => row.id === pickup.cityId),
      company = context.db.shippingCompanies.find(
        (row) => row.id === context.data.shippingCompanyId,
      );
    const mapping = (rows: DemoRow[]) =>
      rows.find((row) => row.shippingCompanyId === company?.id)?.name || "";
    for (const key of Object.keys(context.data))
      if (key.startsWith("sender")) delete context.data[key];
    delete context.data.isCommercial;
    Object.assign(context.data, {
      senderName: warehouse.name,
      senderPhone: pickup.phone,
      senderCountryId: pickup.countryId,
      senderCountryName: country?.name.en || "",
      senderCountryCode: country?.code || "",
      ...(company?.hasState
        ? {
            senderStateId: pickup.stateId,
            senderStateName: mapping(
              context.db.shipmentStates.filter(
                (row) => row.stateId === pickup.stateId,
              ),
            ),
          }
        : {}),
      senderCityId: pickup.cityId,
      senderCityName: mapping(
        context.db.shipmentCities.filter((row) => row.cityId === pickup.cityId),
      ),
      senderStreet:
        pickup.street +
        (company?.id === "66002f5c07d4cc8bca3eb0e0"
          ? "-"
          : " - العنوان الوطني: ") +
        pickup.nationalAddress,
      ...(pickup.email ? { senderEmail: pickup.email } : {}),
      ...(pickup.zipCode ? { senderZipCode: pickup.zipCode } : {}),
    });
  }
  const fingerprint = (data: DemoRow) => {
    const {
      userId: _owner,
      quoteId: _quote,
      shippingCompanyId: _carrier,
      ...fields
    } = data;
    const normalize = (value: any): any =>
      Array.isArray(value)
        ? value.map(normalize)
        : value && typeof value === "object"
          ? Object.fromEntries(
              Object.entries(value)
                .filter(([, v]) => v !== undefined)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, v]) => [key, normalize(v)]),
            )
          : value;
    return JSON.stringify(normalize(fields));
  };
  if (
    context.method === "post" &&
    context.path === "v1/shipments/review/companies"
  ) {
    const result = await run();
    if (result && result[0] === 200) {
      const quote = {
        id: uid(),
        userId,
        fingerprint: fingerprint(original),
        shippingCompanyId: context.data.shippingCompanyId,
        expiresAt: Date.now() + 600000,
        consumed: false,
      };
      (context.db.storage.quotes ||= []).push(quote);
      context.save();
      return [200, { ...(result[1] as DemoRow), quoteId: quote.id }];
    }
    return result;
  }
  if (
    context.method !== "post" ||
    context.path !== "v1/shipments" ||
    (!selected.length && !context.data.quoteId)
  )
    return undefined;
  return await transaction(async () => {
    const quote = context.data.quoteId
      ? context.db.storage.quotes?.find(
          (row) =>
            row.id === context.data.quoteId &&
            row.userId === userId &&
            row.shippingCompanyId === context.data.shippingCompanyId &&
            row.expiresAt > Date.now() &&
            !row.consumed,
        )
      : undefined;
    if (
      context.data.quoteId &&
      (!quote || quote.fingerprint !== fingerprint(original))
    )
      return fail("Shipment quote is invalid, expired, used or changed", 409);
    if (
      selected.length &&
      !hasActiveStorageSubscription(current(context.db, userId), userId)
    )
      return fail("Active storage subscription required", 403);
    const quantities = new Map<string, number>();
    for (const item of selected) {
      if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0)
        return fail("Invalid quantity");
      quantities.set(
        item.warehouseProductId,
        (quantities.get(item.warehouseProductId) || 0) + item.quantity,
      );
    }
    for (const [id, quantity] of quantities) {
      const product = context.db.storage.products.find(
        (row) => row.id === id && row.userId === userId,
      );
      if (!product || product.quantity < quantity)
        return fail("Insufficient warehouse stock", 409);
    }
    const response = await run();
    if (response && response[0] >= 200 && response[0] < 300) {
      if (quote) quote.consumed = true;
      const entity = response[1] as { id?: string; shipment?: { id?: string } };
      const shipmentId = entity.id || entity.shipment?.id || uid();
      for (const [id, quantity] of quantities) {
        context.db.storage.products.find((row) => row.id === id).quantity -=
          quantity;
        context.db.storage.allocations.push({
          shipmentId,
          productId: id,
          quantity,
        });
      }
      context.save();
    }
    return response;
  });
}
