import { getDemoUser } from "./demoMode";
import type { Context, DemoDbForExtras, DemoRow } from "./demoExtraApi";

// This module is installed only by the demo Axios adapter. No requests are forwarded.
export type DemoOperationsDb = {
  shipments: DemoRow[];
  payments: DemoRow[];
  logs: DemoRow[];
  affiliateTransactions: DemoRow[];
  operationsVersion: number;
};
type Db = DemoDbForExtras & DemoOperationsDb;
type Reply = [number, any];
const now = () => new Date().toISOString();
const uid = () => `demo-${crypto.randomUUID()}`;
const round = (n: number) => Math.round(n * 100) / 100;
const matches = (value: any, filter: any) =>
  filter === undefined ||
  filter === "" ||
  filter === "all" ||
  (Array.isArray(filter)
    ? filter.includes(value)
    : String(value) === String(filter));
const staff = () => getDemoUser().role !== "user";
const owner = (id?: string) => (staff() ? id : getDemoUser().id);
const allowed = (row: DemoRow) => staff() || row.userId === getDemoUser().id;
const error = (message: string, status = 400): Reply => [status, { message }];
const paginate = (rows: DemoRow[], p: DemoRow) => {
  const size = Math.max(1, Number(p.pageSize) || 10);
  const start = Math.max(0, Number(p.page) || 0) * size;
  return { results: rows.slice(start, start + size), total: rows.length };
};
function filtered(rows: DemoRow[], p: DemoRow) {
  return rows.filter(
    (row) =>
      [
        "userId",
        "shippingCompanyId",
        "receiverId",
        "senderId",
        "status",
        "codStatus",
        "method",
        "type",
        "updatedById",
        "createdById",
        "affiliateTransactionTitle",
        "isCod",
        "isReturned",
      ].every((key) =>
        matches(
          key === "isReturned"
            ? Boolean(row[key] || row.returnedFromShipmentId)
            : row[key],
          p[key],
        ),
      ) &&
      (!p.closedInvoice ||
        p.closedInvoice === "all" ||
        Boolean(row.closeInvoiceNumber) ===
          (String(p.closedInvoice) === "true")) &&
      (!p.dateFrom || row.createdAt >= p.dateFrom) &&
      (!p.dateTo || row.createdAt <= p.dateTo) &&
      (!p.search ||
        JSON.stringify(row)
          .toLowerCase()
          .includes(String(p.search).toLowerCase())),
  );
}
function account(db: Db, id?: string) {
  return db.users.find((row) => row.id === id);
}
function populatedShipment(db: Db, row: DemoRow): DemoRow {
  return {
    ...row,
    user: account(db, row.userId),
    updatedBy: account(db, row.updatedById),
    shippingCompany: db.shippingCompanies.find(
      (c) => c.id === row.shippingCompanyId,
    ),
    sender: db.shippingUsers.find((c) => c.id === row.senderId),
    receiver: db.shippingUsers.find((c) => c.id === row.receiverId),
  };
}
function requestView(db: Db, row: DemoRow) {
  return {
    ...row,
    user: account(db, row.userId),
    updatedBy: account(db, row.updatedById),
    shipment:
      db.shipments.find((s) => s.id === row.shipmentId) &&
      populatedShipment(db, db.shipments.find((s) => s.id === row.shipmentId)!),
    shipments: (row.shipmentIds || [])
      .map((id: string) => db.shipments.find((s) => s.id === id))
      .filter(Boolean)
      .map((s: DemoRow) => populatedShipment(db, s)),
  };
}
function audit(db: Db, message: string, row: DemoRow, type = "shipment") {
  db.logs.unshift({
    id: uid(),
    message,
    type,
    level: "info",
    modelName: type,
    context: "demo",
    userId: row.userId,
    shipmentId: type === "shipment" ? row.id : undefined,
    meta: {
      userId: row.userId,
      data: JSON.parse(
        JSON.stringify(
          type === "shipment" ? { ...row.shipmentDetails, ...row } : row,
        ),
      ),
    },
    createdAt: now(),
  });
}
function ledger(
  db: Db,
  userId: string,
  amount: number,
  type: "deposit" | "withdraw",
  relatedBalance: "wallet" | "cod",
  notes: string,
  title: string,
) {
  const user = account(db, userId)!;
  const field = relatedBalance === "cod" ? "codBalance" : "balance";
  const previousBalance = Number(user[field]) || 0;
  user[field] = round(
    previousBalance + (type === "deposit" ? amount : -amount),
  );
  if (field === "balance") user.walletBalance = user.balance;
  db.transactions.unshift({
    id: uid(),
    userId,
    amount,
    type,
    relatedBalance,
    notes,
    transactionTitle: title,
    title: { en: notes, ar: notes },
    reference: `DEMO-TXN-${crypto.randomUUID().slice(0, 8)}`,
    previousBalance,
    currentBalance: user[field],
    createdById: getDemoUser().id,
    createdAt: now(),
    updatedAt: now(),
  });
}
function quote(db: Db, data: DemoRow): DemoRow | null {
  const carrier = db.shippingCompanies.find(
    (c) => c.id === data.shippingCompanyId && c.isActive !== false,
  );
  if (!carrier) return null;
  const user = account(db, owner(data.userId));
  const custom = user?.prices?.find(
    (p: DemoRow) => p.shippingCompanyId === carrier.id,
  );
  const weight = Math.max(
    Number(data.weight) || 0,
    ((Number(data.length) || 0) *
      (Number(data.width) || 0) *
      (Number(data.height) || 0)) /
      (/aramex/i.test(carrier.name) ? 4000 : 5000),
  );
  const extraWeight = Math.max(0, weight - Number(carrier.maxWeight || 20));
  const extraWeightPrice = round(
    extraWeight * Number(carrier.extraWeightPrice || 0),
  );
  const shippingCompanyPrice =
    Number(custom?.localPrice ?? carrier.localPrice ?? 35) *
    (data.method === "international" ? 3 : 1);
  const codPrice = data.isCod
    ? Number(custom?.codPrice ?? carrier.codPrice ?? 10)
    : 0;
  const subtotal = round(shippingCompanyPrice + extraWeightPrice + codPrice);
  const coupon = db.coupons.find(
    (c) =>
      c.code === data.couponCode &&
      c.isActive !== false &&
      (!c.shippingCompanyId || c.shippingCompanyId === carrier.id),
  );
  const couponDiscount = coupon
    ? Math.min(
        subtotal,
        coupon.type === "percentage"
          ? (subtotal * Number(coupon.value)) / 100
          : Number(coupon.value) || 0,
      )
    : 0;
  return {
    shippingCompanyPrice,
    extraWeight,
    extraWeightPrice,
    maximumWeight: carrier.maxWeight || 20,
    codPrice,
    subtotal,
    fuelTotal: 0,
    internationalDiscount: 0,
    internationalDiscountRate: 0,
    couponDiscount,
    totalDiscount: couponDiscount,
    total: round(subtotal - couponDiscount),
  };
}
let documentUrl: string | undefined;
async function demoDocument() {
  if (!documentUrl) {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    pdf.text("ASHAMCO EXPRESS - DEMO SHIPPING DOCUMENT", 14, 20);
    pdf.text("Sample label / commercial invoice. For demo use only.", 14, 35);
    pdf.text(
      "Tracking, sender and receiver details are available in the shipment view.",
      14,
      45,
    );
    documentUrl = pdf.output("datauristring");
  }
  return documentUrl;
}
function details(db: Db, user: DemoRow, n: number) {
  const country =
    db.countries.find((c) => c.id === user.address?.countryId) ||
    db.countries[0];
  const state = db.states.find((s) => s.countryId === country?.id);
  const city = db.cities.find((c) => c.stateId === state?.id);
  const location = {
    CountryId: country?.id,
    CountryName: country?.name?.en,
    CountryCode: country?.code,
    StateId: state?.id,
    StateName: state?.name?.en,
    CityId: city?.id,
    CityName: city?.name?.en,
    Street: "12 Demo Street",
    ZipCode: city?.postalCode || "11511",
  };
  return Object.fromEntries([
    ...["sender", "receiver"].flatMap((prefix) =>
      Object.entries({
        ...location,
        Name:
          prefix === "sender" ? user.companyName : `Demo Recipient ${n + 1}`,
        Phone: user.phone || "+20-1000000000",
        Email: user.email,
      }).map(([key, value]) => [prefix + key, value]),
    ),
    ["length", 20],
    ["width", 15],
    ["height", 10],
    ["weight", 2],
    ["packagesCount", 1],
    ["description", "Demo parcel"],
    ["isCommercial", false],
  ]);
}

// Missing collections are added once; saved rows and intentionally empty collections survive upgrades.
export function ensureDemoOperations(
  base: DemoDbForExtras & Partial<DemoOperationsDb>,
): asserts base is Db {
  const users = base.users.filter((u) => u.role === "user");
  users.forEach((u, n) => {
    u.loyaltyType ??= n % 3 === 0 ? "custom" : "normal";
    u.active ??= !u.isBlocked;
    u.isAuthorized ??= true;
    u.affiliateCode ??= `DEMO${n + 1}`;
    if (n > 1) u.referredById ??= "demo-affiliate";
    u.prices ??= [];
  });
  if (!Array.isArray(base.shipments))
    base.shipments = users.flatMap((u, i) =>
      Array.from({ length: i < 2 ? 14 : 3 }, (_, n) => {
        const carrier =
          base.shippingCompanies[
            (i + n) % Math.max(1, Math.min(base.shippingCompanies.length, 4))
          ];
        const status = [
          "delivered",
          "processing",
          "pending",
          "canceled",
          "returned",
          "delivered",
          "processing",
        ][n % 7];
        const isCod = n % 3 === 0;
        const codStatus = isCod
          ? ["paid", "pending", "settled", "block", "canceled"][
              Math.floor(n / 3) % 5
            ]
          : undefined;
        const shipmentDetails = details(base as Db, u, n);
        const id = `demo-shipment-${i + 1}-${n + 1}`;
        const shipmentPrice = {
          shippingCompanyPrice: Number(carrier?.localPrice || 35),
          extraWeight: 0,
          extraWeightPrice: 0,
          maximumWeight: 20,
          codPrice: isCod ? 10 : 0,
          subtotal: Number(carrier?.localPrice || 35) + (isCod ? 10 : 0),
          total: Number(carrier?.localPrice || 35) + (isCod ? 10 : 0),
          fuelTotal: 0,
          totalDiscount: 0,
        };
        return {
          id,
          userId: u.id,
          senderId: base.shippingUsers.find(
            (c) => c.userId === u.id && c.type === "sender",
          )?.id,
          receiverId: base.shippingUsers.find(
            (c) => c.userId === u.id && c.type === "receiver",
          )?.id,
          shippingCompanyId: carrier?.id,
          updatedById: "demo-admin",
          reference: `DEMO-${i + 1}-${n + 1}`,
          trackingNumber: `DEMO${String(i + 1).padStart(3, "0")}${String(n + 1).padStart(4, "0")}`,
          method: n % 4 === 2 ? "international" : "local",
          type: n % 2 ? "document" : "box",
          status,
          isCod,
          codPrice: isCod ? 180 + n * 10 : 0,
          codStatus,
          isReturned: status === "returned",
          orderReturned: false,
          shipmentDetails,
          shipmentPrice,
          price: shipmentPrice,
          shipmentCod: isCod
            ? {
                id: `demo-cod-${id}`,
                shipmentId: id,
                userId: u.id,
                codPrice: 180 + n * 10,
                codStatus,
              }
            : undefined,
          shipmentProducts:
            n % 4 === 2 ? [{ title: "Sample merchandise", price: 100 }] : [],
          trackingStats: [
            {
              description: `Demo shipment ${status}`,
              date: new Date(Date.now() - n * 86400000).toISOString(),
              location: shipmentDetails.receiverCityName,
            },
          ],
          createdAt: new Date(
            Date.now() - (n + (i % 5)) * 86400000,
          ).toISOString(),
          updatedAt: now(),
        };
      }),
    );
  if (!Array.isArray(base.payments))
    base.payments = users.flatMap((u, i) =>
      Array.from({ length: i < 2 ? 12 : 2 }, (_, n) => ({
        id: `demo-payment-${i + 1}-${n + 1}`,
        userId: u.id,
        status: ["success", "pending", "failed"][n % 3],
        amount: 100 + n * 50,
        total: round((100 + n * 50) * 1.15),
        taxTotal: round((100 + n * 50) * 0.15),
        feeTotal: 0,
        transactionId: `demo-checkout-${i + 1}-${n + 1}`,
        reference: `DEMO-PAY-${i + 1}-${n + 1}`,
        platform: "demo",
        isPlan: false,
        balanceApplied: n % 3 === 0,
        createdAt: new Date(Date.now() - n * 86400000).toISOString(),
        updatedAt: now(),
      })),
    );
  if (!Array.isArray(base.affiliateTransactions))
    base.affiliateTransactions = base.shipments
      .filter((s) => account(base as Db, s.userId)?.referredById)
      .map((s, n) => ({
        id: `demo-affiliate-transaction-${n + 1}`,
        userId: account(base as Db, s.userId)?.referredById,
        affiliateId: account(base as Db, s.userId)?.referredById,
        shipmentId: s.id,
        type: "deposit",
        status: s.status === "delivered" ? "success" : "pending",
        amount: 8 + (n % 8),
        affiliateTransactionTitle: "shipment",
        notes: `Commission for ${s.trackingNumber}`,
        createdById: "demo-admin",
        createdAt: s.createdAt,
      }));
  if (!Array.isArray(base.logs))
    base.logs = [
      ...base.shipments.slice(0, 40).map((s) => ({
        id: `demo-log-${s.id}`,
        message: `Shipment ${s.trackingNumber} ${s.status}`,
        type: "shipment",
        modelName: "Shipment",
        context: "demo",
        level: "info",
        shipmentId: s.id,
        userId: s.userId,
        meta: {
          userId: s.userId,
          data: JSON.parse(JSON.stringify({ ...s.shipmentDetails, ...s })),
        },
        createdAt: s.createdAt,
      })),
      ...[
        ["payment", base.payments],
        ["transaction", base.transactions],
        ["request", base.requests],
        ["user", users],
      ].flatMap(([type, records]: [string, DemoRow[]]) =>
        records.slice(0, 5).map((row) => ({
          id: `demo-log-${type}-${row.id}`,
          type,
          modelName: type,
          context: "demo",
          level: "info",
          message: `Demo ${type} activity`,
          userId: type === "user" ? row.id : row.userId,
          meta: {
            userId: type === "user" ? row.id : row.userId,
            data: JSON.parse(JSON.stringify(row)),
          },
          createdAt: row.createdAt,
        })),
      ),
    ];
  if (!base.operationsVersion) {
    const candidates = base.shipments.filter((s) => s.status === "processing");
    base.requests.push(
      ...candidates.slice(2, 14).map((s, n) => {
        const status =
          n % 3 === 0 ? "pending" : n % 3 === 1 ? "approved" : "rejected";
        s.status =
          status === "pending"
            ? "cancelRequest"
            : status === "approved"
              ? "canceled"
              : "processing";
        return {
          id: `demo-cancel-request-${n + 1}`,
          type: "cancelShipment",
          status,
          shipmentId: s.id,
          userId: s.userId,
          updatedById: "demo-admin",
          reference: `DEMO-CANCEL-${n + 1}`,
          createdAt: s.createdAt,
        };
      }),
    );
    base.requests.push(
      ...users.slice(2, 16).map((u, n) => ({
        id: `demo-withdraw-request-${n + 1}`,
        type: n % 2 ? "walletCharge" : "withdrew",
        userId: u.id,
        amount: 100 + n * 10,
        shipmentIds: [],
        status: ["pending", "approved", "rejected"][n % 3],
        bank: "alrajhiBank",
        transactionReference: `DEMO-WD-${n + 1}`,
        description: "Demo COD withdrawal",
        updatedById: "demo-admin",
        createdAt: new Date(Date.now() - n * 86400000).toISOString(),
      })),
    );
    base.operationsVersion = 1;
  }
}

function eligible(db: Db, userId: string) {
  return db.shipments.filter(
    (s) =>
      s.userId === userId &&
      s.isCod &&
      s.codStatus === "paid" &&
      !s.shipmentCod?.relatedRequestId,
  );
}
function completePayment(db: Db, payment: DemoRow) {
  if (!payment.balanceApplied) {
    ledger(
      db,
      payment.userId,
      Number(payment.amount),
      "deposit",
      "wallet",
      `Demo top-up ${payment.reference}`,
      "top-up balance",
    );
    payment.balanceApplied = true;
    audit(db, "Demo payment completed", payment, "payment");
  }
  payment.status = "success";
  payment.updatedAt = now();
}
function dashboard(db: Db, ctx: Context): Reply | null {
  const { path, params: p } = ctx;
  const source = filtered(db.shipments, {
    shippingCompanyId: p.companyId,
    status: p.status === "order" ? "pending" : p.status,
  });
  const period = p.period || p.time_filter || "week";
  const days = /year/i.test(period)
    ? 365
    : /quarter/i.test(period)
      ? 90
      : /month/i.test(period)
        ? 30
        : /week/i.test(period)
          ? 7
          : 1;
  const today = new Date().setHours(0, 0, 0, 0);
  const end = period === "yesterday" ? today : Date.now() + 1;
  const cutoff = period === "today" ? today : end - days * 86400000;
  const rows = source.filter(
    (s) => Date.parse(s.createdAt) >= cutoff && Date.parse(s.createdAt) < end,
  );
  const previous = source.filter(
    (s) =>
      Date.parse(s.createdAt) < cutoff &&
      Date.parse(s.createdAt) >= cutoff - days * 86400000,
  );
  const growth = (a: number, b: number) => (b ? round(((a - b) / b) * 100) : 0);
  const revenue = (list: DemoRow[]) =>
    round(
      list.reduce((sum, s) => sum + Number(s.shipmentPrice?.total || 0), 0),
    );
  if (path === "v1/admin/merchants/active-summary") {
    const count = (list: DemoRow[]) => new Set(list.map((s) => s.userId)).size;
    return [
      200,
      {
        activeMerchants: count(rows),
        activeMerchantsChange: growth(count(rows), count(previous)),
      },
    ];
  }
  if (path === "v1/shipments/admin/shipments/total-summary")
    return [
      200,
      { total: rows.length, change: growth(rows.length, previous.length) },
    ];
  if (path === "v1/admin/revenue/summary")
    return [
      200,
      {
        revenue: revenue(rows),
        change: growth(revenue(rows), revenue(previous)),
        currency: "SAR",
      },
    ];
  if (path === "v1/admin/revenue/growth")
    return [
      200,
      { growth: growth(revenue(rows), revenue(previous)), period: p.period },
    ];
  if (path === "v1/shipments/admin/shipments/process-flow") {
    const flow = (list: DemoRow[]) =>
      Object.fromEntries(
        [
          "order",
          "processing",
          "delivered",
          "canceled",
          "returned",
          "refundedToCustomer",
        ].map((s) => [
          s,
          list.filter((row) => row.status === (s === "order" ? "pending" : s))
            .length,
        ]),
      );
    return [
      200,
      {
        local: flow(rows.filter((s) => s.method === "local" && !s.isCod)),
        international: flow(rows.filter((s) => s.method === "international")),
        cod: flow(rows.filter((s) => s.isCod)),
      },
    ];
  }
  if (path === "v1/admin/merchants/top-performance") {
    const result = db.users
      .filter((u) => u.role === "user")
      .map((u) => {
        const orders = rows.filter((s) => s.userId === u.id);
        return {
          merchant_name: u.companyName || `${u.firstName} ${u.lastName}`,
          total_sales: revenue(orders),
          orders_count: orders.length,
          growth_percentage: growth(
            orders.length,
            previous.filter((s) => s.userId === u.id).length,
          ),
          currency: "SAR",
        };
      });
    result.sort((a, b) =>
      p.sortBy === "growth"
        ? b.growth_percentage - a.growth_percentage
        : p.sortBy === "orders"
          ? b.orders_count - a.orders_count
          : b.total_sales - a.total_sales,
    );
    return [200, result.slice(0, Number(p.limit) || 5)];
  }
  if (path === "v1/admin/dashboard/alerts")
    return [
      200,
      {
        urgent_support_tickets: 0,
        shipments_delayed: db.shipments.filter((s) => s.status === "failed")
          .length,
        pending_payments: db.payments.filter((s) => s.status === "pending")
          .length,
        merchants_need_approval: db.users.filter(
          (u) => u.role === "user" && u.verificationStatus === "pending",
        ).length,
      },
    ];
  if (path === "v1/admin/dashboard/recent-activity")
    return [
      200,
      {
        new_orders: rows.length,
        shipments_sent: rows.filter((s) => s.status === "processing").length,
        deliveries_completed: rows.filter((s) => s.status === "delivered")
          .length,
        new_merchants: db.users.filter(
          (u) => u.role === "user" && Date.parse(u.createdAt) >= cutoff,
        ).length,
        time_filter: period,
      },
    ];
  return null;
}

export async function handleDemoOperations(
  ctx: Context & { db: Db },
): Promise<Reply | null> {
  const { db, path, method, params: p, data, save } = ctx;
  const [, resource, rawId, action] = path.split("/");
  const id = rawId === "me" ? getDemoUser().id : rawId;
  const adminResult = dashboard(db, ctx);
  if (adminResult)
    return staff() ? adminResult : error("Staff access required", 403);
  if (resource === "configs" && method === "get") {
    const rows = db.shipments.filter(allowed);
    return [
      200,
      {
        activeShipments: rows.filter((s) =>
          ["pending", "processing"].includes(s.status),
        ).length,
        canceledShipments: rows.filter((s) => s.status === "canceled").length,
        localShipments: rows.filter((s) => s.method === "local").length,
        internationalShipments: rows.filter((s) => s.method === "international")
          .length,
      },
    ];
  }
  if (resource === "users") {
    if (id === "affiliates" && action === "summary" && method === "post") {
      const affiliateId = owner(data.affiliateId);
      const customers = db.users.filter((u) => u.referredById === affiliateId);
      const shipments = db.shipments.filter((s) =>
        customers.some((u) => u.id === s.userId),
      );
      const profits = db.affiliateTransactions.filter(
        (t) => t.userId === affiliateId,
      );
      return [
        200,
        {
          users: customers.length,
          profits: round(
            profits
              .filter((t) => t.status === "success")
              .reduce((n, t) => n + Number(t.amount), 0),
          ),
          pendingProfits: round(
            profits
              .filter((t) => t.status === "pending")
              .reduce((n, t) => n + Number(t.amount), 0),
          ),
          shipments: {
            total: shipments.length,
            delivered: shipments.filter((s) => s.status === "delivered").length,
            pending: shipments.filter((s) => s.status === "pending").length,
            processing: shipments.filter((s) => s.status === "processing")
              .length,
          },
        },
      ];
    }
    const user = account(db, id);
    if (action === "add-payment-plan" || action === "cancel-payment-plan") {
      if (!staff()) return error("Staff access required", 403);
      if (!user) return error("Account not found", 404);
      const plan = db.plans.find((r) => r.id === data.paymentPlanId);
      if (action === "add-payment-plan" && !plan)
        return error("Plan not found", 404);
      user.paymentPlanId = plan?.id;
      user.paymentPlan = plan;
      user.loyaltyType = plan ? "custom" : "normal";
      user.prices = plan ? plan.prices.map((r: DemoRow) => ({ ...r })) : [];
      user.updatedAt = now();
      save();
      return [200, user];
    }
    if (method === "post" && !id) {
      if (!staff()) return error("Staff access required", 403);
      const created = {
        ...data,
        id: uid(),
        role: "user",
        type: "user",
        balance: 0,
        walletBalance: 0,
        codBalance: 0,
        isAffiliate: false,
        isBlocked: false,
        isRegistered: true,
        verificationStatus: "pending",
        createdAt: now(),
        updatedAt: now(),
      };
      db.users.unshift(created);
      save();
      return [201, created];
    }
    if (rawId === "me" && method === "patch") {
      if (!user) return error("Account not found", 404);
      Object.assign(user, data, {
        id: user.id,
        role: user.role,
        updatedAt: now(),
      });
      save();
      return [200, user];
    }
  }
  if (path === "v1/transactions/close-balance" && method === "post") {
    if (!staff()) return error("Staff access required", 403);
    const user = account(db, data.userId);
    if (!user) return error("Account not found", 404);
    if (["wallet", "all"].includes(data.type)) user.walletBalanceStatus = true;
    if (["cod", "all"].includes(data.type)) user.codBalanceStatus = true;
    save();
    return [
      200,
      {
        walletBalanceStatus: user.walletBalanceStatus,
        codBalanceStatus: user.codBalanceStatus,
      },
    ];
  }
  if (
    resource === "affiliate-transactions" &&
    id !== "balance" &&
    method === "get"
  ) {
    const rows: DemoRow[] = filtered(db.affiliateTransactions, {
      ...p,
      userId: owner(p.userId),
    }).map((t) => ({
      ...t,
      user: account(db, t.userId),
      affiliate: account(db, t.affiliateId),
      createdBy: account(db, t.createdById),
      shipment: db.shipments.find((s) => s.id === t.shipmentId),
    }));
    return id
      ? rows.find((t) => t.id === id)
        ? [200, rows.find((t) => t.id === id)]
        : error("Transaction not found", 404)
      : [200, paginate(rows, p)];
  }
  if (resource === "logs" && method === "get") {
    if (!staff()) return error("Staff access required", 403);
    const rows: DemoRow[] = filtered(db.logs, p).map((row) => ({
      ...row,
      shipment: db.shipments.find((s) => s.id === row.shipmentId),
      meta: { ...row.meta, user: account(db, row.meta?.userId) },
    }));
    const log = rows.find((r) => r.id === id);
    return id
      ? log
        ? [200, log]
        : error("Log not found", 404)
      : [200, paginate(rows, p)];
  }
  if (resource === "payments") {
    if (id === "paytabs" && method === "post") {
      const userId = owner(data.userId);
      if (!account(db, userId) || !(Number(data.amount) > 0))
        return error("Invalid top-up");
      const payment = {
        ...data,
        id: uid(),
        userId,
        status: "pending",
        platform: "demo",
        isPlan: false,
        transactionId: uid(),
        reference: `DEMO-PAY-${Date.now()}`,
        createdAt: now(),
        updatedAt: now(),
      };
      db.payments.unshift(payment);
      save();
      // Checkout stays in the local app and uses the existing callback and status workflow.
      return [
        201,
        {
          ...payment,
          link: `${window.location.origin}/payment/${payment.userId}/${payment.id}/success?paymentId=${encodeURIComponent(payment.transactionId)}`,
        },
      ];
    }
    if (id === "payment-status" && method === "post") {
      const payment = db.payments.find(
        (r) => r.transactionId === data.key && allowed(r),
      );
      return payment
        ? [
            200,
            {
              Data: {
                CustomerReference: payment.id,
                InvoiceStatus: "Paid",
                InvoiceId: payment.transactionId,
                InvoiceTransactions: [],
              },
            },
          ]
        : error("Payment not found", 404);
    }
    const payment = db.payments.find((r) => r.id === id);
    if (!id && method === "get")
      return [
        200,
        paginate(
          filtered(db.payments.filter(allowed), {
            ...p,
            userId: owner(p.userId),
          }).map((r) => ({ ...r, user: account(db, r.userId) })),
          p,
        ),
      ];
    if (!payment) return error("Payment not found", 404);
    if (!allowed(payment)) return error("Not available for this account", 403);
    if (method === "get")
      return [200, { ...payment, user: account(db, payment.userId) }];
    if (method === "post" && action === "recreate-checkout") {
      if (payment.status === "success")
        return error("Payment already completed", 409);
      return [
        200,
        {
          ...payment,
          link: `${window.location.origin}/payment/${payment.userId}/${payment.id}/success?paymentId=${encodeURIComponent(payment.transactionId)}`,
        },
      ];
    }
    if (
      (method === "post" && action === "check-status") ||
      method === "patch"
    ) {
      if (action === "check-status" || data.status === "success")
        completePayment(db, payment);
      else if (!payment.balanceApplied)
        Object.assign(payment, {
          status: data.status || payment.status,
          updatedAt: now(),
        });
      save();
      return [200, { ...payment, user: account(db, payment.userId) }];
    }
    return error("Unsupported payment action", 405);
  }
  if (resource === "requests") {
    if (id === "available-for-withdrew" && method === "get") {
      const userId = owner(action);
      return [
        200,
        {
          amount: round(
            eligible(db, userId!).reduce(
              (sum, s) => sum + Number(s.codPrice),
              0,
            ),
          ),
        },
      ];
    }
    const operationTypes = ["cancelShipment", "withdrew", "walletCharge"];
    const existing = db.requests.find((r) => r.id === id);
    if (method === "get") {
      if (id && existing && operationTypes.includes(existing.type))
        return allowed(existing)
          ? [200, requestView(db, existing)]
          : error("Not available for this account", 403);
      if (
        !id &&
        (Array.isArray(p.type) ? p.type : [p.type]).some((type) =>
          operationTypes.includes(type),
        )
      )
        return [
          200,
          paginate(
            filtered(db.requests.filter(allowed), {
              ...p,
              userId: owner(p.userId),
            }).map((r) => requestView(db, r)),
            p,
          ),
        ];
    }
    if (method === "post" && !id && operationTypes.includes(data.type)) {
      const userId = owner(data.userId);
      if (!account(db, userId)) return error("Account not found", 404);
      const row: DemoRow = {
        ...data,
        id: uid(),
        userId,
        status: "pending",
        reference: `DEMO-REQ-${Date.now()}`,
        createdAt: now(),
      };
      if (data.type === "cancelShipment") {
        const shipment = db.shipments.find(
          (s) => s.id === data.shipmentId && s.userId === userId,
        );
        if (!shipment || shipment.status !== "processing")
          return error("Only processing shipments can be canceled", 409);
        if (
          db.requests.some(
            (r) =>
              r.shipmentId === shipment.id &&
              r.type === "cancelShipment" &&
              r.status === "pending",
          )
        )
          return error("Cancellation already pending", 409);
        shipment.status = "cancelRequest";
      } else {
        if (
          db.requests.some(
            (r) =>
              r.userId === userId &&
              ["withdrew", "walletCharge"].includes(r.type) &&
              r.status === "pending",
          )
        )
          return error("Withdrawal already pending", 409);
        const ids = [...new Set<string>(data.shipmentIds || [])];
        const shipments = eligible(db, userId!).filter((s) =>
          ids.includes(s.id),
        );
        const total = round(
          shipments.reduce((n, s) => n + Number(s.codPrice), 0),
        );
        if (
          !ids.length ||
          shipments.length !== ids.length ||
          !(Number(data.amount) > 0) ||
          round(Number(data.amount)) !== total
        )
          return error("Select eligible paid COD shipments");
        row.amount = total;
        row.shipmentIds = ids;
        shipments.forEach((s) => {
          s.codStatus = "block";
          s.shipmentCod = {
            ...s.shipmentCod,
            codStatus: "block",
            relatedRequestId: row.id,
          };
        });
      }
      db.requests.unshift(row);
      save();
      return [201, requestView(db, row)];
    }
    if (
      method === "patch" &&
      existing &&
      operationTypes.includes(existing.type)
    ) {
      if (!staff()) return error("Staff access required", 403);
      if (existing.status !== "pending")
        return error("Request already reviewed", 409);
      if (!["approved", "rejected"].includes(data.status))
        return error("Invalid decision");
      const approved = data.status === "approved";
      if (existing.type === "cancelShipment") {
        const shipment = db.shipments.find((s) => s.id === existing.shipmentId);
        if (shipment) {
          shipment.status = approved ? "canceled" : "processing";
          shipment.updatedAt = now();
          audit(db, `Cancellation ${data.status}`, shipment);
        }
      } else {
        const user = account(db, existing.userId);
        if (
          !user ||
          (approved && Number(user.codBalance) < Number(existing.amount))
        )
          return error("Insufficient COD balance", 409);
        if (approved) {
          ledger(
            db,
            existing.userId,
            Number(existing.amount),
            "withdraw",
            "cod",
            `Demo withdrawal ${existing.reference}`,
            "withdrew request",
          );
          if (existing.type === "walletCharge")
            ledger(
              db,
              existing.userId,
              round(Number(existing.amount) / 1.15),
              "deposit",
              "wallet",
              `Demo COD transfer ${existing.reference}`,
              "top-up balance",
            );
        }
        db.shipments
          .filter((s) => (existing.shipmentIds || []).includes(s.id))
          .forEach((s) => {
            s.codStatus = approved ? "settled" : "paid";
            s.shipmentCod = {
              ...s.shipmentCod,
              codStatus: s.codStatus,
              relatedRequestId: approved ? existing.id : undefined,
            };
          });
      }
      Object.assign(existing, data, {
        id: existing.id,
        updatedById: getDemoUser().id,
        updatedAt: now(),
      });
      save();
      return [200, requestView(db, existing)];
    }
  }
  if (resource === "shipment-cods" && method === "patch") {
    if (!staff()) return error("Staff access required", 403);
    const shipment = db.shipments.find((s) => s.shipmentCod?.id === id);
    if (!shipment) return error("COD record not found", 404);
    if (shipment.codStatus === "paid")
      return [200, populatedShipment(db, shipment)];
    if (shipment.codStatus !== "pending")
      return error("Only pending COD can be settled", 409);
    shipment.codStatus = "paid";
    shipment.shipmentCod.codStatus = "paid";
    ledger(
      db,
      shipment.userId,
      Number(shipment.codPrice),
      "deposit",
      "cod",
      `COD settlement ${shipment.trackingNumber}`,
      "cod shipment payment",
    );
    save();
    return [200, populatedShipment(db, shipment)];
  }
  if (resource !== "shipments") return null;
  const rows = filtered(db.shipments.filter(allowed), {
    ...p,
    userId: owner(p.userId),
  });
  if (id === "shipment-cods" && action === "summary") {
    const total = (statuses: string[]) =>
      round(
        rows
          .filter((s) => s.isCod && statuses.includes(s.codStatus))
          .reduce((n, s) => n + Number(s.codPrice), 0),
      );
    return [
      200,
      {
        canceledDues: total(["canceled"]),
        pendingDues: total(["pending", "block"]),
        settledDues: total(["paid", "settled"]),
      },
    ];
  }
  if (id === "shipment" && action === "summary") {
    const group = (key: string, label: (value: string) => string) =>
      [...new Set(rows.map((s) => s[key]))].map((value) => ({
        label: label(value),
        value: rows.filter((s) => s[key] === value).length,
      }));
    return [
      200,
      {
        shippingCompanyAnalyticData: group(
          "shippingCompanyId",
          (id) =>
            db.shippingCompanies.find((c) => c.id === id)?.name ||
            "Demo carrier",
        ),
        methodAnalyticData: group("method", (id) => id),
        userAnalyticData: group(
          "userId",
          (id) => account(db, id)?.companyName || "Demo merchant",
        ),
      },
    ];
  }
  if (id === "review" && method === "post") {
    const price = quote(db, data);
    return price ? [200, price] : error("Choose an active carrier");
  }
  if (id === "shipment" && action === "label") {
    const shipment = db.shipments.find(
      (s) => s.id === p.shipmentId && allowed(s),
    );
    return shipment
      ? [200, { labelUrl: await demoDocument() }]
      : error("Shipment not found", 404);
  }
  if (!id && method === "get")
    return [
      200,
      paginate(
        rows.map((row) => populatedShipment(db, row)),
        p,
      ),
    ];
  if (!id && method === "post") {
    const userId = owner(data.userId);
    const user = account(db, userId);
    const price = quote(db, data);
    if (!user || !price) return error("Choose an account and active carrier");
    if (Number(user.balance) < price.total)
      return error("Insufficient wallet balance", 409);
    const shipmentId = uid();
    const shipment: DemoRow = {
      ...data,
      id: shipmentId,
      userId,
      status: "processing",
      reference: `DEMO-${Date.now()}`,
      trackingNumber: `DEMO${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      shipmentDetails: { ...data },
      shipmentPrice: price,
      price,
      shipmentProducts: data.products || [],
      codStatus: data.isCod ? "pending" : undefined,
      shipmentCod: data.isCod
        ? {
            id: uid(),
            shipmentId,
            userId,
            codPrice: Number(data.codPrice),
            codStatus: "pending",
          }
        : undefined,
      labelUrl: await demoDocument(),
      invoiceUrl:
        data.method === "international" ? await demoDocument() : undefined,
      trackingStats: [
        {
          description: "Shipment accepted in demo",
          date: now(),
          location: data.senderCityName,
        },
      ],
      createdAt: now(),
      updatedAt: now(),
    };
    if (data.returnedFromShipmentId) {
      const original = db.shipments.find(
        (s) => s.id === data.returnedFromShipmentId && s.userId === userId,
      );
      if (!original || original.returnedShipmentId)
        return error("Return already exists or original not found", 409);
      original.returnedShipmentId = shipmentId;
      original.orderReturned = true;
    }
    ledger(
      db,
      userId!,
      price.total,
      "withdraw",
      "wallet",
      `Shipment ${shipment.trackingNumber}`,
      "new shipment",
    );
    db.shipments.unshift(shipment);
    audit(db, "Demo shipment created", shipment);
    save();
    return [201, populatedShipment(db, shipment)];
  }
  const shipmentId =
    id === "shipment" && action === "tracking" ? path.split("/")[4] : id;
  const shipment = db.shipments.find((s) => s.id === shipmentId);
  if (!shipment) return error("Shipment not found", 404);
  if (!allowed(shipment)) return error("Not available for this account", 403);
  if (id === "shipment" && action === "tracking" && method === "get") {
    shipment.trackingStats.unshift({
      description: `Demo tracking: ${shipment.status}`,
      date: now(),
      location: shipment.shipmentDetails?.receiverCityName,
    });
    save();
    return [200, populatedShipment(db, shipment)];
  }
  if (method === "get")
    return [
      200,
      {
        ...populatedShipment(db, shipment),
        labelUrl: await demoDocument(),
        invoiceUrl:
          shipment.method === "international"
            ? await demoDocument()
            : undefined,
      },
    ];
  if (method === "patch") {
    if (!staff()) return error("Staff access required", 403);
    if (
      action === "review-extra-weight-price" ||
      action === "deduct-extra-weight-price"
    ) {
      const carrier = db.shippingCompanies.find(
        (c) => c.id === shipment.shippingCompanyId,
      );
      const extraWeightPrice = round(
        Math.max(
          0,
          Number(data.weight) - Number(shipment.shipmentDetails.weight || 0),
        ) * Number(carrier?.extraWeightPrice || 0),
      );
      if (action === "review-extra-weight-price")
        return [200, { extraWeightPrice }];
      if (!(Number(data.weight) > 0)) return error("Invalid weight");
      if (Number(account(db, shipment.userId)?.balance) < extraWeightPrice)
        return error("Insufficient wallet balance", 409);
      ledger(
        db,
        shipment.userId,
        extraWeightPrice,
        "withdraw",
        "wallet",
        `Extra weight ${shipment.trackingNumber}`,
        "shipment extra weight fees",
      );
      shipment.shipmentDetails.weight = Number(data.weight);
      shipment.shipmentPrice.total = round(
        Number(shipment.shipmentPrice.total) + extraWeightPrice,
      );
    } else {
      if (data.status) shipment.status = data.status;
      if (data.closeInvoiceNumber !== undefined)
        shipment.closeInvoiceNumber = data.closeInvoiceNumber;
    }
    shipment.updatedById = getDemoUser().id;
    shipment.updatedAt = now();
    audit(db, "Demo shipment updated", shipment);
    save();
    return [200, populatedShipment(db, shipment)];
  }
  return error("Unsupported shipment action", 405);
}
