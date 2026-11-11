import type { User } from "src/app/auth/user";
import { hasOperationPermission } from "src/app/auth/permissions";
import type {
  GetTopMerchantsResponse,
  GetDashboardAlertsResponse,
  DashboardAlerts,
} from "./DashboardApi";
export const canViewDashboard = (user: User) =>
  user.role === "admin" && hasOperationPermission("dashboard", "view", user);
export const dashboardPeriods = {
  today: "today",
  yesterday: "yesterday",
  lastWeek: "last_week",
  lastMonth: "last_month",
} as const;
export const revenuePeriods = {
  day: "day",
  week: "week",
  month: "month",
  quarter: "quarter",
  year: "year",
} as const;
export const dashboardFlowTypes = {
  local: "local",
  international: "international",
  cod: "cod",
} as const;
export const dashboardMerchantSort = {
  orders: "orders",
  sales: "sales",
  growth: "growth",
} as const;
export const dashboardShipmentStatuses = {
  all: "all",
  order: "order",
  processing: "processing",
  delivered: "delivered",
  canceled: "canceled",
  returned: "returned",
  refundedToCustomer: "refundedToCustomer",
} as const;
export const toDashboardPeriodTitle = (value: string) =>
  ({
    today: "TODAY",
    yesterday: "YESTERDAY",
    last_week: "LAST_WEEK",
    last_month: "LAST_MONTH",
    day: "DAY",
    week: "WEEK",
    month: "MONTH",
    quarter: "QUARTER",
    year: "YEAR",
  })[value] || value;
export const toDashboardFlowTitle = (value: string) =>
  ({ local: "LOCAL", international: "INTERNATIONAL", cod: "COD" })[value] ||
  value;
export const toDashboardFlowColor = (value: string) =>
  ({ local: "#0f9d8c", international: "#5576de", cod: "#bd8733" })[value] ||
  "#64748b";
export const toDashboardStageTitle = (value: string) =>
  ({
    order: "ORDER_RECEIVED",
    processing: "PROCESSING",
    delivered: "DELIVERED",
    canceled: "CANCELED",
    returned: "RETURNED",
    refundedToCustomer: "REFUNDED_TO_CUSTOMER",
    all: "ALL_STATUSES",
  })[value] || value;
export const toDashboardSortTitle = (value: string) =>
  ({ orders: "ORDERS_COUNT", sales: "REPORTED_SALES", growth: "GROWTH" })[
    value
  ] || value;
export const dashboardMerchantRows = (response?: GetTopMerchantsResponse) =>
  Array.isArray(response) ? response : response?.data || [];
export const dashboardAlerts = (
  response?: GetDashboardAlertsResponse,
): DashboardAlerts =>
  response && "data" in response
    ? response.data || {}
    : ((response || {}) as DashboardAlerts);
