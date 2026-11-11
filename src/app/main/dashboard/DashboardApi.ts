import { apiService as api } from "app/store/apiService";
import IShipmentFlow from "./models/IShipmentFlow";
import IDashboardMerchant from "./models/IDashboardMerchant";
export const addTagTypes = ["DashboardOverview"] as const;
const DashboardApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getDashboardActiveMerchants: build.query<
      GetActiveMerchantsResponse,
      DashboardFilters
    >({
      query: (f) => ({
        url: "v1/admin/merchants/active-summary",
        params: {
          period: f.period,
          ...(f.companyId ? { companyId: f.companyId } : {}),
        },
      }),
      providesTags: ["DashboardOverview"],
    }),
    getDashboardShipmentsTotal: build.query<
      GetShipmentsTotalResponse,
      DashboardShipmentFilters
    >({
      query: (f) => ({
        url: "v1/shipments/admin/shipments/total-summary",
        params: {
          period: f.period,
          ...(f.companyId ? { companyId: f.companyId } : {}),
          ...(f.status && f.status !== "all" ? { status: f.status } : {}),
        },
      }),
      providesTags: ["DashboardOverview"],
    }),
    getDashboardRevenue: build.query<GetRevenueResponse, DashboardFilters>({
      query: (f) => ({
        url: "v1/admin/revenue/summary",
        params: {
          period: f.period,
          ...(f.companyId ? { companyId: f.companyId } : {}),
        },
      }),
      providesTags: ["DashboardOverview"],
    }),
    getDashboardGrowth: build.query<GetGrowthResponse, DashboardFilters>({
      query: (f) => ({
        url: "v1/admin/revenue/growth",
        params: {
          period: f.period,
          ...(f.companyId ? { companyId: f.companyId } : {}),
        },
      }),
      providesTags: ["DashboardOverview"],
    }),
    getDashboardFlow: build.query<
      GetShipmentFlowResponse,
      DashboardFlowFilters
    >({
      query: (f) => ({
        url: "v1/shipments/admin/shipments/process-flow",
        params: {
          period: f.period,
          types: f.types.join(","),
          ...(f.companyId ? { companyId: f.companyId } : {}),
        },
      }),
      providesTags: ["DashboardOverview"],
    }),
    getDashboardTopMerchants: build.query<
      GetTopMerchantsResponse,
      TopMerchantFilters
    >({
      query: (f) => ({
        url: "v1/admin/merchants/top-performance",
        params: { period: f.period, sortBy: f.sortBy, limit: f.limit },
      }),
      providesTags: ["DashboardOverview"],
    }),
    getDashboardAlerts: build.query<
      GetDashboardAlertsResponse,
      { period: string }
    >({
      query: (f) => ({
        url: "v1/admin/dashboard/alerts",
        params: { period: f.period },
      }),
      providesTags: ["DashboardOverview"],
    }),
    getDashboardActivity: build.query<
      GetDashboardActivityResponse,
      { time_filter: string }
    >({
      query: (f) => ({
        url: "v1/admin/dashboard/recent-activity",
        params: { time_filter: f.time_filter },
      }),
      providesTags: ["DashboardOverview"],
    }),
  }),
});
export type DashboardFilters = { period: string; companyId?: string };
export type DashboardShipmentFilters = DashboardFilters & { status?: string };
export type DashboardFlowFilters = DashboardFilters & { types: string[] };
export type TopMerchantFilters = {
  period: string;
  sortBy: string;
  limit: number;
};
export type GetActiveMerchantsResponse = {
  activeMerchants?: number | string | null;
  activeMerchantsChange?: number | string | null;
};
export type GetShipmentsTotalResponse = {
  total?: number | string | null;
  change?: number | string | null;
};
export type GetRevenueResponse = {
  revenue?: number | string | null;
  change?: number | string | null;
  currency?: string;
};
export type GetGrowthResponse = {
  growth?: number | string | null;
  period?: string;
};
export type GetShipmentFlowResponse = {
  local?: IShipmentFlow;
  international?: IShipmentFlow;
  cod?: IShipmentFlow;
};
export type GetTopMerchantsResponse =
  | IDashboardMerchant[]
  | { data?: IDashboardMerchant[] };
export type DashboardAlerts = {
  urgent_support_tickets?: number | string | null;
  shipments_delayed?: number | string | null;
  pending_payments?: number | string | null;
  merchants_need_approval?: number | string | null;
};
export type GetDashboardAlertsResponse =
  | DashboardAlerts
  | { data?: DashboardAlerts };
export type GetDashboardActivityResponse = {
  new_orders?: number | string | null;
  shipments_sent?: number | string | null;
  deliveries_completed?: number | string | null;
  new_merchants?: number | string | null;
  time_filter?: string;
};
export const {
  useGetDashboardActiveMerchantsQuery,
  useGetDashboardShipmentsTotalQuery,
  useGetDashboardRevenueQuery,
  useGetDashboardGrowthQuery,
  useGetDashboardFlowQuery,
  useGetDashboardTopMerchantsQuery,
  useGetDashboardAlertsQuery,
  useGetDashboardActivityQuery,
} = DashboardApi;
export default DashboardApi;
