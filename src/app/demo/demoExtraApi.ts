import type { AxiosRequestConfig } from "axios";
import { getDemoUser } from "./demoMode";

export type DemoRow = Record<string, any>;
export type DemoExtraDb = {
  affiliateBalances: Record<string, number>;
  shipmentStates: DemoRow[];
  shipmentCities: DemoRow[];
  users: DemoRow[];
  plans: DemoRow[];
  coupons: DemoRow[];
  alerts: DemoRow[];
  shippingUsers: DemoRow[];
  applications: DemoRow[];
  products: DemoRow[];
  requests: DemoRow[];
  transactions: DemoRow[];
};
export type DemoDbForExtras = DemoExtraDb & {
  countries: DemoRow[];
  shippingCompanies: DemoRow[];
  states: DemoRow[];
  cities: DemoRow[];
};
type Response = [number, unknown];
export type Context = {
  db: DemoDbForExtras;
  config: AxiosRequestConfig;
  path: string;
  method: string;
  params: Record<string, any>;
  data: DemoRow;
  save: () => void;
};
const stamp = "2026-10-01T09:00:00.000Z";
const uid = () => `demo-${crypto.randomUUID()}`;
const date = (n: number) =>
  new Date(Date.UTC(2026, 8, 1 + (n % 26), 9)).toISOString();
const text = (value: unknown) => JSON.stringify(value ?? "").toLowerCase();
const has = (value: unknown, term: unknown) =>
  !term || text(value).includes(String(term).toLowerCase());
const oneOf = (actual: unknown, expected: unknown) =>
  !expected ||
  expected === "all" ||
  (Array.isArray(expected) ? expected.includes(actual) : actual === expected);
const dateMatches = (row: DemoRow, params: DemoRow) =>
  (!params.dateFrom || (row.createdAt || "") >= params.dateFrom) &&
  (!params.dateTo || (row.createdAt || "") <= params.dateTo);
const page = (rows: DemoRow[], params: DemoRow) => {
  const size = Math.max(1, Number(params.pageSize) || 10);
  const start = Math.max(0, Number(params.page) || 0) * size;
  return { results: rows.slice(start, start + size), total: rows.length };
};

export function createDemoExtras(base: {
  countries: DemoRow[];
  shippingCompanies: DemoRow[];
  states: DemoRow[];
  cities: DemoRow[];
}): DemoExtraDb {
  const egypt =
    base.countries.find((row) => row.code === "EG") || base.countries[0] || {};
  const state = base.states.find((row) => row.countryId === egypt.id) || {};
  const city = base.cities.find((row) => row.stateId === state.id) || {};
  const users: DemoRow[] = [
    {
      id: "demo-admin",
      role: "admin",
      firstName: "Demo",
      lastName: "Admin",
      email: "demo@ashamco.local",
      createdAt: stamp,
      features: [],
      isRegistered: true,
      isBlocked: false,
      verificationStatus: "approved",
      emailVerified: true,
      phoneVerified: true,
    },
    {
      id: "demo-employee",
      role: "employee",
      firstName: "Mona",
      lastName: "Reviewer",
      email: "reviewer@ashamco.local",
      createdAt: stamp,
      features: [],
      isRegistered: true,
      isBlocked: false,
      verificationStatus: "approved",
      emailVerified: true,
      phoneVerified: true,
    },
    ...Array.from({ length: 23 }, (_, n) => ({
      id:
        n === 0
          ? "demo-merchant"
          : n === 1
            ? "demo-affiliate"
            : `demo-merchant-${n + 1}`,
      role: "user",
      type: "user",
      firstName: n < 2 ? "Demo" : ["Nour", "Khaled", "Sara", "Omar"][n % 4],
      lastName: n < 2 ? (n === 0 ? "Merchant" : "Affiliate") : `Store ${n + 1}`,
      companyName: `Demo Store ${n + 1}`,
      email: `merchant${n + 1}@ashamco.local`,
      phone: `+20-100000${String(n).padStart(4, "0")}`,
      isAffiliate: n === 1 || (n > 1 && n % 5 === 0),
      balance: n === 0 ? 5000 : n === 1 ? 4500 : 1000 + n * 170,
      walletBalance: n === 0 ? 5000 : n === 1 ? 4500 : 1000 + n * 170,
      codBalance: n === 0 ? 1800 : 600 + n * 90,
      address: { countryId: egypt.id, stateId: state.id, cityId: city.id },
      createdAt: date(n),
      verificationStatus: n < 2 || n % 3 === 0 ? "approved" : "pending",
      isRegistered: true,
      isBlocked: false,
      emailVerified: true,
      phoneVerified: true,
    })),
  ];
  const merchants = users.filter((row) => row.role === "user");
  const shipmentStates = base.states.flatMap((row) =>
    (row.shippingCompanyIds || []).map((shippingCompanyId: string) => ({
      id: `demo-shipment-state-${row.id}-${shippingCompanyId}`,
      stateId: row.id,
      shippingCompanyId,
      name: row.name.en,
      isActive: true,
    })),
  );
  const shipmentCities = base.cities.flatMap((row) => {
    const parent = base.states.find((item) => item.id === row.stateId);
    return (parent?.shippingCompanyIds || []).map(
      (shippingCompanyId: string) => ({
        id: `demo-shipment-city-${row.id}-${shippingCompanyId}`,
        cityId: row.id,
        shippingCompanyId,
        name: row.name.en,
        isActive: true,
      }),
    );
  });
  const plans = Array.from(
    { length: 20 },
    (_, n) =>
      ["Starter", "Growth", "Business", "Enterprise"][n % 4] +
      (n >= 4 ? ` ${Math.floor(n / 4) + 1}` : ""),
  ).map((name, n) => ({
    id: `demo-plan-${n + 1}`,
    name,
    description: `${name} shipping plan`,
    price: n * 150 + 100,
    features: ["local", "cashOnDelivery", "international"],
    status: n % 5 === 3 ? "disabled" : "active",
    prices: base.shippingCompanies.map((company, i) => ({
      id: `demo-plan-price-${n}-${i}`,
      shippingCompanyId: company.id,
      localPrice: Math.max(0, 30 + i * 5 - n * 2),
      codPrice: 10 + i,
      internationalDiscountRate: n * 2,
      returnFees: i === 0 ? 0 : 10 + i,
    })),
    createdAt: date(n),
  }));
  const coupons = Array.from({ length: 28 }, (_, n) => ({
    id: `demo-coupon-${n + 1}`,
    shippingCompanyId:
      base.shippingCompanies[n % base.shippingCompanies.length].id,
    code: `DEMO${String(n + 1).padStart(3, "0")}`,
    type: n % 2 ? "percentage" : "fixed",
    value: n % 2 ? 10 : 25,
    maxUsageCount: 100 + n,
    usageCount: n * 2,
    isActive: n % 4 !== 0,
    expiresAt: n % 3 ? null : "2027-12-31T00:00:00.000Z",
    createdAt: date(n),
  }));
  const alerts = Array.from({ length: 23 }, (_, n) => ({
    id: `demo-alert-${n + 1}`,
    type: n % 4 === 0 ? "onlyImage" : "normal",
    viewType: n % 4 === 0 ? "popup" : n % 2 ? "alert" : "popup",
    title: `Demo announcement ${n + 1}`,
    content: `Sample update for merchants ${n + 1}.`,
    imageUrl: n % 4 === 0 ? "/assets/images/logo/logo.png" : undefined,
    createdAt: date(n),
  }));
  const shippingUsers = Array.from({ length: 38 }, (_, n) => ({
    id: `demo-shipping-user-${n + 1}`,
    userId: merchants[n % merchants.length].id,
    fullName: `Contact ${n + 1}`,
    phone: `+20-10123${String(n).padStart(4, "0")}`,
    type: n % 2 ? "receiver" : "sender",
    email: `contact${n + 1}@example.com`,
    address: {
      countryId: egypt.id,
      stateId: state.id,
      cityId: city.id,
      street: `Street ${n + 1}`,
      zipCode: "11511",
    },
    senderShipmentsCount: n % 7,
    receiverShipmentsCount: n % 5,
    createdAt: date(n),
  }));
  const applications = Array.from({ length: 22 }, (_, n) => ({
    id: `demo-application-${n + 1}`,
    name: { en: `Demo App ${n + 1}`, ar: `تطبيق ${n + 1}` },
    clientName: `demo-client-${n + 1}`,
    userId: merchants[n % merchants.length].id,
    scopes: [
      {
        id: `demo-scope-${n}-1`,
        feature: "shipments",
        read: true,
        write: n % 2 === 0,
        maxHourlyUsage: 100,
      },
      {
        id: `demo-scope-${n}-2`,
        feature: "shipping-users",
        read: true,
        write: true,
        maxHourlyUsage: 50,
      },
    ],
    apiKey: `demo-key-${n + 1}`,
    createdAt: date(n),
  }));
  const products = ["Small bags", "Medium bags", "Large bags", "Labels"].map(
    (name, n) => ({
      id: `demo-supply-${n + 1}`,
      name: { en: name, ar: `مستلزمات ${n + 1}` },
      description: {
        en: `Bundle of ${10 * (n + 1)}`,
        ar: `مجموعة ${10 * (n + 1)}`,
      },
      price: 45 + n * 30,
      count: 10 * (n + 1),
      imageUrl: "/assets/images/logo/logo.png",
    }),
  );
  const requestTypes = [
    "verification",
    "bankTransfer",
    "affiliateWithdraw",
    "bags",
  ];
  const requests = requestTypes.flatMap((type, t) =>
    Array.from({ length: 24 }, (_, n) => {
      const user =
        type === "affiliateWithdraw"
          ? merchants.filter((item) => item.isAffiliate)[
              n % merchants.filter((item) => item.isAffiliate).length
            ]
          : merchants[n % merchants.length];
      const status =
        n % 4 === 0 ? "approved" : n % 4 === 1 ? "rejected" : "pending";
      return {
        id: `demo-request-${type}-${n + 1}`,
        type,
        status,
        userId: user.id,
        updatedById: status === "pending" ? undefined : "demo-admin",
        amount:
          type === "bags" ? products[n % products.length].price : 80 + n * 12,
        description: `Demo ${type} request ${n + 1}`,
        notes: status === "rejected" ? "Please check the details" : "",
        bank: status === "approved" ? "alrajhiBank" : undefined,
        transactionReference:
          status === "approved" ? `DEMO-TRX-${n + 1}` : undefined,
        transactionImageUrl:
          status === "approved" ? "/assets/images/logo/logo.png" : undefined,
        name: user.companyName,
        userType: "company",
        taxNumber: `TX${n + 1000}`,
        crNumber: `CR${n + 1000}`,
        identityUrl:
          type === "verification" ? "/assets/images/logo/logo.png" : undefined,
        paymentPlanId:
          type === "bankTransfer" ? plans[n % plans.length].id : undefined,
        productIds:
          type === "bags" ? [products[n % products.length].id] : undefined,
        fullName:
          type === "bags" ? user.firstName + " " + user.lastName : undefined,
        phone: type === "bags" ? user.phone : undefined,
        shippingAddress:
          type === "bags"
            ? {
                countryId: egypt.id,
                stateId: state.id,
                cityId: city.id,
                street: `Street ${n + 1}`,
              }
            : undefined,
        reference: `DEMO-${type.toUpperCase()}-${n + 1}`,
        createdAt: date(n),
        updatedAt: date(n),
      };
    }),
  );
  const transactions = Array.from({ length: 70 }, (_, n) => {
    const user = merchants[n % merchants.length];
    const relatedBalance = n % 3 === 0 ? "cod" : "wallet";
    const type = n % 2 ? "withdraw" : "deposit";
    const amount = 40 + n * 5;
    const titles =
      relatedBalance === "cod"
        ? [
            "cod shipment payment",
            "withdrew request",
            "rejected withdrew request",
            "settlement of financial dues",
          ]
        : [
            "shipment extra weight fees",
            "returned shipment fees",
            "top-up balance",
            "bank transfer",
            "new shipment",
            "re activate canceled",
            "canceled shipment balance",
            "balance update",
            "bags request",
          ];
    return {
      id: `demo-transaction-${n + 1}`,
      reference: `DEMO-TXN-${n + 1}`,
      userId: user.id,
      createdById: "demo-admin",
      type,
      relatedBalance,
      operationType: "custom",
      transactionTitle: titles[n % titles.length],
      title: {
        en: `Demo ${type}`,
        ar: type === "deposit" ? "إيداع تجريبي" : "سحب تجريبي",
      },
      description: {
        en: `Sample ledger entry ${n + 1}`,
        ar: `حركة تجريبية ${n + 1}`,
      },
      amount,
      previousBalance: 1000 + n * 15,
      currentBalance: 1000 + n * 15 + (type === "deposit" ? amount : -amount),
      notes: `Demo transaction ${n + 1}`,
      createdAt: date(n),
    };
  });
  return {
    affiliateBalances: Object.fromEntries(
      merchants
        .filter((row) => row.isAffiliate)
        .map((row) => [row.id, 2500 + Number(row.balance) / 2]),
    ),
    shipmentStates,
    shipmentCities,
    users,
    plans,
    coupons,
    alerts,
    shippingUsers,
    applications,
    products,
    requests,
    transactions,
  };
}

function populated(ctx: Context, resource: string, row: DemoRow): DemoRow {
  const { db } = ctx;
  const user = row.userId && db.users.find((item) => item.id === row.userId);
  if (resource === "shipment-states" || resource === "shipment-cities")
    return {
      ...row,
      shippingCompany: db.shippingCompanies.find(
        (item) => item.id === row.shippingCompanyId,
      ),
    };
  if (resource === "states")
    return {
      ...row,
      country: db.countries.find((item) => item.id === row.countryId),
      shipmentStates: db.shipmentStates
        .filter((item) => item.stateId === row.id)
        .map((item) => populated(ctx, "shipment-states", item)),
    };
  if (resource === "cities")
    return {
      ...row,
      country: db.countries.find((item) => item.id === row.countryId),
      state: db.states.find((item) => item.id === row.stateId),
      shipmentCities: db.shipmentCities
        .filter((item) => item.cityId === row.id)
        .map((item) => populated(ctx, "shipment-cities", item)),
    };
  if (resource === "payment-plans")
    return {
      ...row,
      prices: (row.prices || []).map((price: DemoRow) => ({
        ...price,
        shippingCompany: db.shippingCompanies.find(
          (item) => item.id === price.shippingCompanyId,
        ),
      })),
    };
  if (resource === "coupons")
    return {
      ...row,
      shippingCompany: db.shippingCompanies.find(
        (item) => item.id === row.shippingCompanyId,
      ),
    };
  if (resource === "users")
    return {
      ...row,
      paymentPlan:
        db.plans.find((plan) => plan.id === row.paymentPlanId) ||
        row.paymentPlan,
      prices: (row.prices || []).map((price: DemoRow) => ({
        ...price,
        shippingCompany: db.shippingCompanies.find(
          (c) => c.id === price.shippingCompanyId,
        ),
      })),
      address: {
        ...row.address,
        country: db.countries.find((c) => c.id === row.address?.countryId),
        state: db.states.find((s) => s.id === row.address?.stateId),
        city: db.cities.find((c) => c.id === row.address?.cityId),
      },
    };
  if (resource === "shipping-users")
    return {
      ...row,
      user,
      country: db.countries.find((item) => item.id === row.address?.countryId),
      state: db.states.find((item) => item.id === row.address?.stateId),
      city: db.cities.find((item) => item.id === row.address?.cityId),
      address: {
        ...row.address,
        country: db.countries.find(
          (item) => item.id === row.address?.countryId,
        ),
        state: db.states.find((item) => item.id === row.address?.stateId),
        city: db.cities.find((item) => item.id === row.address?.cityId),
      },
    };
  if (resource === "applications") return { ...row, user };
  if (resource === "requests")
    return {
      ...row,
      user,
      updatedBy: db.users.find((item) => item.id === row.updatedById),
      paymentPlan: db.plans.find((item) => item.id === row.paymentPlanId),
      products: (row.productIds || [])
        .map((id: string) => db.products.find((item) => item.id === id))
        .filter(Boolean),
      shippingAddress: row.shippingAddress && {
        ...row.shippingAddress,
        country: db.countries.find(
          (item) => item.id === row.shippingAddress.countryId,
        ),
        state: db.states.find(
          (item) => item.id === row.shippingAddress.stateId,
        ),
        city: db.cities.find((item) => item.id === row.shippingAddress.cityId),
      },
    };
  if (resource === "transactions")
    return {
      ...row,
      user,
      createdBy: db.users.find((item) => item.id === row.createdById),
    };
  return row;
}

function listFilter(ctx: Context, resource: string, rows: DemoRow[]) {
  const { params } = ctx;
  const identity = getDemoUser();
  return rows
    .filter((row) => {
      if (
        identity.role === "user" &&
        ["requests", "transactions", "shipping-users"].includes(resource) &&
        row.userId !== identity.id
      )
        return false;
      if (resource === "users") {
        if (params.type === "user" && row.role !== "user") return false;
        if (
          params.isAffiliate !== undefined &&
          String(Boolean(row.isAffiliate)) !== String(params.isAffiliate)
        )
          return false;
        if (params.role && !oneOf(row.role, params.role)) return false;
        if (
          !oneOf(row.referredById, params.referredById) ||
          !oneOf(row.loyaltyType || "normal", params.loyaltyType) ||
          !oneOf(row.verificationStatus, params.verificationStatus)
        )
          return false;
        if (
          params.active !== undefined &&
          !oneOf(!row.isBlocked, String(params.active) === "true")
        )
          return false;
        if (params.balanceType === "positive" && !(Number(row.balance) > 0))
          return false;
        if (params.balanceType === "zero" && Number(row.balance) !== 0)
          return false;
        if (params.balanceType === "negative" && !(Number(row.balance) < 0))
          return false;
      }
      if (
        resource === "states" &&
        params.countryId &&
        row.countryId !== params.countryId
      )
        return false;
      if (
        resource === "cities" &&
        params.countryId &&
        row.countryId !== params.countryId
      )
        return false;
      if (
        resource === "cities" &&
        params.stateId &&
        row.stateId !== params.stateId
      )
        return false;
      if (
        resource === "shipment-states" &&
        params.stateId &&
        row.stateId !== params.stateId
      )
        return false;
      if (
        resource === "shipment-cities" &&
        params.cityId &&
        row.cityId !== params.cityId
      )
        return false;
      if (params.shippingCompanyId && params.shippingCompanyId !== "all") {
        if (
          resource === "states" &&
          !ctx.db.shipmentStates.some(
            (item) =>
              item.stateId === row.id &&
              item.shippingCompanyId === params.shippingCompanyId,
          )
        )
          return false;
        if (
          resource === "cities" &&
          !ctx.db.shipmentCities.some(
            (item) =>
              item.cityId === row.id &&
              item.shippingCompanyId === params.shippingCompanyId,
          )
        )
          return false;
        if (
          ["coupons", "shipment-states", "shipment-cities"].includes(
            resource,
          ) &&
          row.shippingCompanyId !== params.shippingCompanyId
        )
          return false;
      }
      if (
        !["requests", "transactions"].includes(resource) &&
        params.type &&
        resource !== "users" &&
        !oneOf(row.type, params.type)
      )
        return false;
      if (resource === "requests" && !oneOf(row.type, params.type))
        return false;
      if (resource === "transactions" && !oneOf(row.type, params.type))
        return false;
      if (
        !oneOf(row.status, params.status) ||
        !oneOf(row.userId, params.userId) ||
        !oneOf(row.updatedById, params.updatedById) ||
        !oneOf(row.createdById, params.createdById)
      )
        return false;
      if (
        !oneOf(row.relatedBalance, params.relatedBalance) ||
        !oneOf(row.transactionTitle, params.transactionTitle)
      )
        return false;
      if (!dateMatches(row, params) || !oneOf(row.code, params.code))
        return false;
      return has(
        [
          row.name,
          row.code,
          row.title,
          row.description,
          row.fullName,
          row.firstName,
          row.lastName,
          row.companyName,
          row.email,
          row.phone,
          row.reference,
          row.clientName,
          row.userId,
        ],
        params.search,
      );
    })
    .sort((a, b) =>
      params.orderColumn &&
      ["balance", "codBalance"].includes(params.orderColumn)
        ? (Number(a[params.orderColumn]) - Number(b[params.orderColumn])) *
          (params.orderDirection === "desc" ? -1 : 1)
        : 0,
    );
}

async function reportUrl(
  rows: DemoRow[],
  format: "pdf" | "xlsx",
): Promise<string> {
  const content = rows.map((row) => ({
    Reference: row.reference || row.id,
    Account: row.user?.companyName || row.userId,
    Type: row.type,
    Balance: row.relatedBalance,
    Amount: row.amount,
    Date: row.createdAt,
  }));
  if (format === "xlsx") {
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(content),
      "Transactions",
    );
    return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${XLSX.write(workbook, { bookType: "xlsx", type: "base64" })}`;
  }
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  pdf.text("Demo transaction report", 14, 18);
  content.forEach((row, index) => {
    if (index > 0 && index % 38 === 0) pdf.addPage();
    pdf.text(
      `${row.Reference}  ${row.Account}  ${row.Type}  ${row.Amount}`,
      14,
      30 + (index % 38) * 6,
    );
  });
  return pdf.output("datauristring");
}

function statistics(ctx: Context): DemoRow | null {
  const account = ctx.db.users.find(
    (row) => row.id === ctx.data.userId && row.role === "user",
  );
  if (!account) return null;
  const entries = ctx.db.transactions.filter(
    (row) => row.userId === account.id && dateMatches(row, ctx.data),
  );
  const deposits = entries
    .filter((row) => row.type === "deposit")
    .reduce((sum, row) => sum + row.amount, 0);
  const withdrawals = entries
    .filter((row) => row.type === "withdraw")
    .reduce((sum, row) => sum + row.amount, 0);
  return {
    userId: account.id,
    user: account,
    financialAssets: {
      total: deposits + 250,
      shipments: deposits,
      codShipments: 100,
      extraWeight: 50,
      updateByAdministrator: 25,
      bankTransferFees: 25,
      others: 50,
    },
    currentObligations: {
      planBalance: 100,
      balanceCharge: 20,
      canceledShipments: 10,
      codBalance: withdrawals,
      others: 5,
    },
    bankTransfer: { total: deposits, cod: 50, others: 10 },
    codObligations: { total: 200, block: 20, pending: 60, paid: 120 },
  };
}

export async function handleDemoExtra(ctx: Context): Promise<Response | null> {
  const { db, method, params, data, save } = ctx;
  const [, resource, id, action] = ctx.path.split("/");
  if (
    resource === "affiliate-transactions" &&
    id === "balance" &&
    method === "get"
  ) {
    const account = db.users.find(
      (row) =>
        row.id ===
        (getDemoUser().role === "user" ? getDemoUser().id : params.affiliateId),
    );
    return account
      ? [
          200,
          {
            balance: Math.max(0, Number(db.affiliateBalances[account.id]) || 0),
          },
        ]
      : [404, { message: "Account not found" }];
  }
  if (resource === "users" && id === "statistics" && method === "post")
    return [200, statistics(ctx)];
  if (resource === "users" && id === "me" && method === "get") {
    const account = db.users.find((row) => row.id === getDemoUser().id);
    return account
      ? [200, populated(ctx, "users", account)]
      : [404, { message: "Account not found" }];
  }
  const collections: Record<string, keyof DemoDbForExtras> = {
    states: "states",
    cities: "cities",
    "shipment-states": "shipmentStates",
    "shipment-cities": "shipmentCities",
    users: "users",
    "payment-plans": "plans",
    coupons: "coupons",
    alerts: "alerts",
    "shipping-users": "shippingUsers",
    applications: "applications",
    products: "products",
    requests: "requests",
    transactions: "transactions",
  };
  if (resource === "transactions" && id === "report" && method === "get") {
    const rows = listFilter(ctx, "transactions", db.transactions).map((row) =>
      populated(ctx, "transactions", row),
    );
    return [
      200,
      {
        url: await reportUrl(
          rows,
          params.reportType === "xlsx" ? "xlsx" : "pdf",
        ),
      },
    ];
  }
  const collection = collections[resource];
  if (!collection) return null;
  const rows = db[collection] as DemoRow[];
  if (method === "get" && !id)
    return [
      200,
      page(
        listFilter(ctx, resource, rows).map((row) =>
          populated(ctx, resource, row),
        ),
        params,
      ),
    ];
  const index = rows.findIndex((row) => row.id === id);
  if (method === "get") {
    if (index < 0) return [404, { message: `${resource} not found` }];
    if (
      getDemoUser().role === "user" &&
      ["requests", "transactions", "shipping-users"].includes(resource) &&
      rows[index].userId !== getDemoUser().id
    )
      return [403, { message: "Not available for this account" }];
    return [200, populated(ctx, resource, rows[index])];
  }
  if (resource === "products")
    return [405, { message: "Catalog is read only" }];
  if (method === "post" && !id) {
    const record: DemoRow = {
      ...data,
      id: uid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (resource === "users")
      return [405, { message: "Demo staff creation is unavailable" }];
    if (resource === "shipping-users")
      record.userId =
        getDemoUser().role === "user"
          ? getDemoUser().id
          : data.userId || "demo-merchant";
    if (resource === "cities" && !record.countryId)
      record.countryId = db.states.find(
        (row) => row.id === record.stateId,
      )?.countryId;
    if (resource === "states") record.shippingCompanyIds = [];
    if (resource === "applications") record.apiKey = `demo-key-${record.id}`;
    if (resource === "requests") {
      record.userId =
        getDemoUser().role === "user" ? getDemoUser().id : data.userId;
      record.status = "pending";
      if (record.type === "bags") {
        const selected = (record.productIds || []).map((key: string) =>
          db.products.find((row) => row.id === key),
        );
        if (!selected.length || selected.some((row: DemoRow) => !row))
          return [400, { message: "Invalid supplies" }];
        record.amount = selected.reduce(
          (total: number, row: DemoRow) => total + row.price,
          0,
        );
      }
    }
    if (resource === "transactions") {
      if (getDemoUser().role === "user")
        return [403, { message: "Staff access required" }];
      const account = db.users.find((row) => row.id === data.userId);
      if (!account) return [400, { message: "Select an account" }];
      record.createdById = getDemoUser().id;
      record.transactionTitle = "balance update";
      record.previousBalance =
        Number(
          account[data.relatedBalance === "cod" ? "codBalance" : "balance"],
        ) || 0;
      const delta =
        data.type === "deposit" ? Number(data.amount) : -Number(data.amount);
      const net =
        data.relatedBalance === "wallet" &&
        data.type === "deposit" &&
        data.applyTax
          ? delta / 1.15
          : delta;
      record.currentBalance = record.previousBalance + net;
      record.reference = `DEMO-TXN-${Date.now()}`;
      account[data.relatedBalance === "cod" ? "codBalance" : "balance"] =
        record.currentBalance;
      if (data.relatedBalance === "wallet")
        account.walletBalance = record.currentBalance;
      record.title = { en: `Demo ${data.type}`, ar: "حركة تجريبية" };
    }
    if (
      resource === "shipment-states" &&
      !db.states.some((row) => row.id === record.stateId)
    )
      return [400, { message: "State not found" }];
    if (
      resource === "shipment-cities" &&
      !db.cities.some((row) => row.id === record.cityId)
    )
      return [400, { message: "City not found" }];
    rows.unshift(record);
    if (resource === "shipment-states") {
      const parent = db.states.find((row) => row.id === record.stateId);
      if (
        parent &&
        !parent.shippingCompanyIds.includes(record.shippingCompanyId)
      )
        parent.shippingCompanyIds.push(record.shippingCompanyId);
    }
    save();
    return [201, populated(ctx, resource, record)];
  }
  if (index < 0) return [404, { message: `${resource} not found` }];
  if (
    getDemoUser().role === "user" &&
    ["requests", "transactions"].includes(resource)
  )
    return [403, { message: "Staff access required" }];
  if (method === "patch") {
    const before = rows[index];
    const update: DemoRow = { ...data };
    if (resource === "requests") {
      if (before.status !== "pending" && before.type !== "verification")
        return [409, { message: "Request already reviewed" }];
      update.updatedById = getDemoUser().id;
      if (before.type === "bags" && update.status === "approved") {
        const account = db.users.find((row) => row.id === before.userId);
        if (!account || Number(account.balance) < Number(before.amount))
          return [409, { message: "Insufficient balance" }];
        account.balance -= Number(before.amount);
        account.walletBalance = account.balance;
      }
      if (before.type === "affiliateWithdraw" && update.status === "approved") {
        db.affiliateBalances[before.userId] = Math.max(
          0,
          Number(db.affiliateBalances[before.userId]) - Number(before.amount),
        );
      }
      if (before.type === "bankTransfer" && update.status === "approved") {
        const account = db.users.find((row) => row.id === before.userId);
        if (account) {
          account.balance += Number(before.amount);
          account.walletBalance = account.balance;
        }
      }
      if (before.type === "verification") {
        const account = db.users.find((row) => row.id === before.userId);
        if (account) account.verificationStatus = update.status;
      }
    }
    if (resource === "transactions") {
      const next = { ...before, ...update };
      const oldAccount = db.users.find((row) => row.id === before.userId);
      const nextAccount = db.users.find((row) => row.id === next.userId);
      if (!oldAccount || !nextAccount)
        return [400, { message: "Select an account" }];
      const field = (row: DemoRow) =>
        row.relatedBalance === "cod" ? "codBalance" : "balance";
      const delta = (row: DemoRow) =>
        (row.type === "deposit" ? Number(row.amount) : -Number(row.amount)) /
        (row.relatedBalance === "wallet" &&
        row.type === "deposit" &&
        row.applyTax
          ? 1.15
          : 1);
      oldAccount[field(before)] =
        Number(oldAccount[field(before)]) - delta(before);
      update.previousBalance = Number(nextAccount[field(next)]);
      nextAccount[field(next)] = update.previousBalance + delta(next);
      oldAccount.walletBalance = oldAccount.balance;
      nextAccount.walletBalance = nextAccount.balance;
      update.currentBalance = nextAccount[field(next)];
    }
    rows[index] = {
      ...before,
      ...update,
      id,
      updatedAt: new Date().toISOString(),
    };
    save();
    return [200, populated(ctx, resource, rows[index])];
  }
  if (method === "delete") {
    if (["requests", "transactions"].includes(resource))
      return [405, { message: "Deletion is unavailable" }];
    const removed = rows.splice(index, 1)[0];
    if (resource === "shipment-states") {
      const parent = db.states.find((row) => row.id === removed.stateId);
      if (parent)
        parent.shippingCompanyIds = db.shipmentStates
          .filter((row) => row.stateId === parent.id)
          .map((row) => row.shippingCompanyId);
    }
    if (resource === "states") {
      db.cities = db.cities.filter((row) => row.stateId !== id);
      db.shipmentStates = db.shipmentStates.filter((row) => row.stateId !== id);
    }
    if (resource === "cities")
      db.shipmentCities = db.shipmentCities.filter((row) => row.cityId !== id);
    save();
    return [200, {}];
  }
  return [405, { message: "Unsupported demo action" }];
}
