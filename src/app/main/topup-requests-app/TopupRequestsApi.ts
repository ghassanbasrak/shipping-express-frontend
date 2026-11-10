import type { MoyasarFormConfig } from "app/shared-components/moyasar-checkout/MoyasarCheckout";
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
        url: "v1/payments/moyasar",
        method: "POST",
        data: { amount: value.amount },
      }),
      invalidatesTags: ["TopupRequests"],
    }),
    checkTopupStatus: build.mutation<ITopupRequest, CheckTopupStatusApiArg>({
      query: (value) => ({
        url: `v1/payments/${value.id}/check-status`,
        method: "POST",
        data: { moyasarPaymentId: value.moyasarPaymentId },
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
export type CheckoutApiResponse = {
  payment: ITopupRequest;
  checkout: MoyasarFormConfig;
};
export type CreateTopupRequestApiArg = { amount: number };
export type CheckTopupStatusApiArg = { id: string; moyasarPaymentId: string };
export const {
  useGetTopupRequestsQuery,
  useLazyGetTopupRequestsQuery,
  useGetTopupRequestQuery,
  useLazyGetTopupRequestQuery,
  useGetTopupRequestsUserQuery,
  useCreateTopupRequestMutation,
  useCheckTopupStatusMutation,
} = TopupRequestsApi;
export default TopupRequestsApi;
