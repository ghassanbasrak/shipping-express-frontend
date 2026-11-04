import { apiService as api } from "app/store/apiService";
import type { User } from "src/app/auth/user";
import IShipment from "../shipments-app/models/IShipment";
export const addTagTypes = [
  "MerchantDues",
  "MerchantDuesSummary",
  "Shipments",
  "ShipmentSummary",
  "ShipmentAccount",
] as const;
const MerchantDuesApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getMerchantDues: build.query<
      GetMerchantDuesApiResponse,
      GetMerchantDuesApiArg
    >({
      query: (filters) => ({
        url: "v1/shipments",
        params: {
          isCod: true,
          page: filters.page,
          pageSize: filters.pageSize,
          ...(filters.searchText ? { search: filters.searchText } : {}),
          ...(filters.shippingCompanyIdFilter &&
          filters.shippingCompanyIdFilter !== "all"
            ? { shippingCompanyId: filters.shippingCompanyIdFilter }
            : {}),
          ...(filters.userIdFilter && filters.userIdFilter !== "all"
            ? { userId: filters.userIdFilter }
            : {}),
          ...(filters.updatedByIdFilter && filters.updatedByIdFilter !== "all"
            ? { updatedById: filters.updatedByIdFilter }
            : {}),
          ...(filters.shipmentStatusFilters?.length
            ? { status: filters.shipmentStatusFilters }
            : {}),
          ...(filters.shipmentPaymentStatusFilter?.length
            ? { codStatus: filters.shipmentPaymentStatusFilter }
            : {}),
          ...(filters.shipmentReceiverIdFilter
            ? { receiverId: filters.shipmentReceiverIdFilter }
            : {}),
          ...(filters.dateFromFilter
            ? { dateFrom: filters.dateFromFilter }
            : {}),
          ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
        },
        paramsSerializer: { indexes: null },
      }),
      providesTags: ["MerchantDues", "Shipments"],
    }),
    getMerchantDuesSummary: build.query<
      GetMerchantDuesSummaryApiResponse,
      GetMerchantDuesSummaryApiArg
    >({
      query: (filters) => ({
        url: "v1/shipments/shipment-cods/summary",
        params: {
          ...(filters.shippingCompanyIdFilter &&
          filters.shippingCompanyIdFilter !== "all"
            ? { shippingCompanyId: filters.shippingCompanyIdFilter }
            : {}),
          ...(filters.userIdFilter && filters.userIdFilter !== "all"
            ? { userId: filters.userIdFilter }
            : {}),
          ...(filters.shipmentReceiverIdFilter
            ? { receiverId: filters.shipmentReceiverIdFilter }
            : {}),
        },
      }),
      providesTags: ["MerchantDuesSummary", "ShipmentSummary"],
    }),
    getMerchantDuesUser: build.query<User, string>({
      query: (id) => ({ url: `v1/users/${id}` }),
      providesTags: (_, __, id) => [{ type: "ShipmentAccount", id }],
    }),
  }),
  overrideExisting: false,
});
export type GetMerchantDuesApiResponse = {
  results: IShipment[];
  total: number;
};
export type GetMerchantDuesApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  shippingCompanyIdFilter?: string;
  userIdFilter?: string;
  updatedByIdFilter?: string;
  shipmentReceiverIdFilter?: string;
  shipmentStatusFilters?: string[];
  shipmentPaymentStatusFilter?: string[];
  dateFromFilter?: string;
  dateToFilter?: string;
  dateFromInvalid?: boolean;
  dateToInvalid?: boolean;
  instanceKey?: string;
};
export type GetMerchantDuesSummaryApiArg = {
  shippingCompanyIdFilter?: string;
  userIdFilter?: string;
  shipmentReceiverIdFilter?: string;
};
export type GetMerchantDuesSummaryApiResponse = {
  canceledDues?: number;
  pendingDues?: number;
  settledDues?: number;
};
export const {
  useGetMerchantDuesQuery,
  useLazyGetMerchantDuesQuery,
  useGetMerchantDuesSummaryQuery,
  useGetMerchantDuesUserQuery,
} = MerchantDuesApi;
export default MerchantDuesApi;
