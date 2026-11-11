import { apiService as api } from "app/store/apiService";

export const dashboardTagTypes = ["DashboardOverview"] as const;
const DashboardApi = api
  .enhanceEndpoints({ addTagTypes: dashboardTagTypes })
  .injectEndpoints({
    endpoints: (build) => ({
      getDashboardActiveMerchants: build.query<ActiveMerchantsResponse, DashboardFilters>({
        query: (filters) => ({
          url: "v1/admin/merchants/active-summary",
          params: periodAndCarrier(filters),
        }),
        providesTags: ["DashboardOverview"],
      }),
      getDashboardShipmentsTotal: build.query<ShipmentsTotalResponse, DashboardShipmentFilters>({
        query: (filters) => ({
          url: "v1/shipments/admin/shipments/total-summary",
          params: {
            ...periodAndCarrier(filters),
            ...(filters.status && filters.status !== "all" ? { status: filters.status } : {}),
          },
        }),
        providesTags: ["DashboardOverview"],
      }),
      getDashboardRevenue: build.query<RevenueResponse, DashboardFilters>({
        query: (filters) => ({
          url: "v1/admin/revenue/summary",
          params: periodAndCarrier(filters),
        }),
        providesTags: ["DashboardOverview"],
      }),
      getDashboardGrowth: build.query<GrowthResponse, DashboardFilters>({
        query: (filters) => ({
          url: "v1/admin/revenue/growth",
          params: periodAndCarrier(filters),
        }),
        providesTags: ["DashboardOverview"],
      }),
      getDashboardFlow: build.query<ShipmentFlowResponse, DashboardFlowFilters>({
        query: (filters) => ({
          url: "v1/shipments/admin/shipments/process-flow",
          params: { ...periodAndCarrier(filters), types: filters.types.join(",") },
        }),
        providesTags: ["DashboardOverview"],
      }),
      getDashboardTopMerchants: build.query<TopMerchantsResponse, TopMerchantFilters>({
        query: (filters) => ({
          url: "v1/admin/merchants/top-performance",
          params: { period: filters.period, sortBy: filters.sortBy, limit: filters.limit },
        }),
        providesTags: ["DashboardOverview"],
      }),
      getDashboardAlerts: build.query<DashboardAlertsResponse, { period: string }>({
        query: (filters) => ({
          url: "v1/admin/dashboard/alerts",
          params: { period: filters.period },
        }),
        providesTags: ["DashboardOverview"],
      }),
      getDashboardActivity: build.query<DashboardActivityResponse, { time_filter: string }>({
        query: (filters) => ({
          url: "v1/admin/dashboard/recent-activity",
          params: { time_filter: filters.time_filter },
        }),
        providesTags: ["DashboardOverview"],
      }),
    }),
    overrideExisting: false,
  });

function periodAndCarrier(filters: DashboardFilters) {
  return {
    period: filters.period,
    ...(filters.companyId ? { companyId: filters.companyId } : {}),
  };
}
export type DashboardFilters = { period: string; companyId?: string };
export type DashboardShipmentFilters = DashboardFilters & { status?: string };
export type DashboardFlowFilters = DashboardFilters & { types: string[] };
export type TopMerchantFilters = { period: string; sortBy: string; limit: number };
export type ActiveMerchantsResponse = { activeMerchants?: number | string | null; activeMerchantsChange?: number | string | null };
export type ShipmentsTotalResponse = { total?: number | string | null; change?: number | string | null };
export type RevenueResponse = { revenue?: number | string | null; change?: number | string | null; currency?: string };
export type GrowthResponse = { growth?: number | string | null; period?: string };
export type ShipmentFlowCounts = { order?: number | string | null; processing?: number | string | null; delivered?: number | string | null; canceled?: number | string | null; returned?: number | string | null; refundedToCustomer?: number | string | null };
export type ShipmentFlowResponse = { local?: ShipmentFlowCounts; international?: ShipmentFlowCounts; cod?: ShipmentFlowCounts };
export type DashboardMerchant = { merchant_name?: string; orders_count?: number | string | null; total_sales?: number | string | null; growth_percentage?: number | string | null; currency?: string };
export type TopMerchantsResponse = DashboardMerchant[] | { data?: DashboardMerchant[] };
export type DashboardAlerts = { urgent_support_tickets?: number | string | null; shipments_delayed?: number | string | null; pending_payments?: number | string | null; merchants_need_approval?: number | string | null };
export type DashboardAlertsResponse = DashboardAlerts | { data?: DashboardAlerts };
export type DashboardActivityResponse = { new_orders?: number | string | null; shipments_sent?: number | string | null; deliveries_completed?: number | string | null; new_merchants?: number | string | null; time_filter?: string };
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
