import { apiService as api } from "app/store/apiService";
import type { User } from "src/app/auth/user";
import ITopupRequest from "./models/ITopupRequest";
export const addTagTypes = [
  "TopupRequests",
  "TopupRequest",
  "TopupRequestsUser",
  "Transactions",
  "TransactionAccount",
  "ShipmentAccount",
  "MerchantDuesSummary",
] as const;
const TopupRequestsApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getTopupRequests: build.query<
      GetTopupRequestsApiResponse,
      GetTopupRequestsApiArg
    >({
      query: (filters) => ({
        url: "v1/payments",
        params: {
          page: filters.page,
          pageSize: filters.pageSize,
          ...(filters.searchText ? { search: filters.searchText } : {}),
          ...(filters.userIdFilter && filters.userIdFilter !== "all"
            ? { userId: filters.userIdFilter }
            : {}),
          ...(filters.statusFilter && filters.statusFilter !== "all"
            ? { status: filters.statusFilter }
            : {}),
          ...(filters.dateFromFilter
            ? { dateFrom: filters.dateFromFilter }
            : {}),
          ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
        },
      }),
      providesTags: ["TopupRequests"],
    }),
    getTopupRequest: build.query<ITopupRequest, string>({
      query: (id) => ({ url: `v1/payments/${id}` }),
      providesTags: (_, __, id) => [{ type: "TopupRequest", id }],
    }),
    getTopupRequestsUser: build.query<User, string>({
      query: (id) => ({ url: `v1/users/${id}` }),
      providesTags: (_, __, id) => [{ type: "TopupRequestsUser", id }],
    }),
    createTopupRequest: build.mutation<
      CheckoutApiResponse,
      CreateTopupRequestApiArg
    >({
      query: (value) => ({
        url: "v1/payments/paytabs",
        method: "POST",
        data: {
          amount: value.amount,
          total: value.total,
          feeTotal: value.feeTotal,
          taxTotal: value.taxTotal,
          isPlan: false,
          userId: value.userId,
        },
      }),
      invalidatesTags: ["TopupRequests"],
    }),
    recreateTopupCheckout: build.mutation<CheckoutApiResponse, string>({
      query: (id) => ({
        url: `v1/payments/${id}/recreate-checkout`,
        method: "POST",
      }),
      invalidatesTags: (_, __, id) => [
        "TopupRequests",
        { type: "TopupRequest", id },
      ],
    }),
    checkTopupStatus: build.mutation<ITopupRequest, CheckTopupStatusApiArg>({
      query: (value) => ({
        url: `v1/payments/${value.id}/check-status`,
        method: "POST",
        data: value.resourcePath
          ? { resourcePath: value.resourcePath }
          : value.transactionId
            ? { resourcePath: `/v1/checkouts/${value.transactionId}/payment` }
            : {},
      }),
      invalidatesTags: (_, __, value) => [
        "TopupRequests",
        { type: "TopupRequest", id: value.id },
        "TopupRequestsUser",
        "Transactions",
        "TransactionAccount",
        "ShipmentAccount",
        "MerchantDuesSummary",
      ],
    }),
  }),
  overrideExisting: false,
});
export type GetTopupRequestsApiResponse = {
  results: ITopupRequest[];
  total: number;
};
export type GetTopupRequestsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  userIdFilter?: string;
  statusFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
  dateFromInvalid?: boolean;
  dateToInvalid?: boolean;
};
export type CheckoutApiResponse = Partial<ITopupRequest> & { link?: string };
export type CreateTopupRequestApiArg = {
  amount: number;
  total: number;
  feeTotal: number;
  taxTotal: number;
  userId: string;
};
export type CheckTopupStatusApiArg = {
  id: string;
  resourcePath?: string;
  transactionId?: string;
};
export const {
  useGetTopupRequestsQuery,
  useLazyGetTopupRequestsQuery,
  useGetTopupRequestQuery,
  useLazyGetTopupRequestQuery,
  useGetTopupRequestsUserQuery,
  useCreateTopupRequestMutation,
  useRecreateTopupCheckoutMutation,
  useCheckTopupStatusMutation,
} = TopupRequestsApi;
export default TopupRequestsApi;
