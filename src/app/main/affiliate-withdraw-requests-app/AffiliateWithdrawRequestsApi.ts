import { apiService as api } from "app/store/apiService";
import type { User } from "src/app/auth/user";
import IAffiliateWithdrawRequest from "./models/IAffiliateWithdrawRequest";
export const addTagTypes = [
  "AffiliateWithdrawRequests",
  "AffiliateWithdrawRequest",
  "AffiliateWithdrawRequestsUser",
  "AffiliateWithdrawBalance",
] as const;
const AffiliateWithdrawRequestsApi = api
  .enhanceEndpoints({ addTagTypes })
  .injectEndpoints({
    endpoints: (build) => ({
      getAffiliateWithdrawRequests: build.query<
        GetAffiliateWithdrawRequestsApiResponse,
        GetAffiliateWithdrawRequestsApiArg
      >({
        query: (filters) => ({
          url: "v1/requests",
          params: {
            page: filters.page,
            pageSize: filters.pageSize,
            type: "affiliateWithdraw",
            ...(filters.searchText ? { search: filters.searchText } : {}),
            ...(filters.statusFilter && filters.statusFilter !== "all"
              ? { status: filters.statusFilter }
              : {}),
            ...(filters.userIdFilter && filters.userIdFilter !== "all"
              ? { userId: filters.userIdFilter }
              : {}),
            ...(filters.updatedByIdFilter && filters.updatedByIdFilter !== "all"
              ? { updatedById: filters.updatedByIdFilter }
              : {}),
            ...(filters.dateFromFilter
              ? { dateFrom: filters.dateFromFilter }
              : {}),
            ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
          },
        }),
        providesTags: ["AffiliateWithdrawRequests"],
      }),

      getAffiliateWithdrawBalance: build.query<
        GetAffiliateWithdrawBalanceApiResponse,
        string
      >({
        query: (id) => ({
          url: "v1/affiliate-transactions/balance",
          params: { affiliateId: id },
        }),
        providesTags: (_, __, id) => [{ type: "AffiliateWithdrawBalance", id }],
      }),
      getAffiliateWithdrawRequest: build.query<
        IAffiliateWithdrawRequest,
        string
      >({
        query: (id) => ({ url: `v1/requests/${id}` }),
        providesTags: (_, __, id) => [{ type: "AffiliateWithdrawRequest", id }],
      }),
      createAffiliateWithdrawRequest: build.mutation<
        IAffiliateWithdrawRequest,
        CreateAffiliateWithdrawRequestApiArg
      >({
        query: (value) => ({
          url: "v1/requests",
          method: "POST",
          data: {
            amount: value.amount,
            ...(value.description ? { description: value.description } : {}),
            userId: value.userId,
            type: "affiliateWithdraw",
            status: "pending",
          },
        }),
        invalidatesTags: (_, __, value) => [
          "AffiliateWithdrawRequests",
          { type: "AffiliateWithdrawBalance", id: value.userId },
        ],
      }),
      getAffiliateWithdrawRequestsUser: build.query<User, string>({
        query: (id) => ({ url: `v1/users/${id}` }),
        providesTags: (_, __, id) => [
          { type: "AffiliateWithdrawRequestsUser", id },
        ],
      }),
      setAffiliateWithdrawRequestStatus: build.mutation<
        IAffiliateWithdrawRequest,
        SetAffiliateWithdrawRequestStatusApiArg
      >({
        query: (value) => ({
          url: `v1/requests/${value.id}`,
          method: "PATCH",
          data:
            value.status === "approved"
              ? {
                  status: value.status,
                  bank: value.bank,
                  transactionReference: value.transactionReference,
                  ...(value.transactionDescription
                    ? { transactionDescription: value.transactionDescription }
                    : {}),
                  ...(value.transactionImageUrl
                    ? { transactionImageUrl: value.transactionImageUrl }
                    : {}),
                }
              : { status: value.status },
        }),
        invalidatesTags: (_, __, value) => [
          "AffiliateWithdrawRequests",
          { type: "AffiliateWithdrawRequest", id: value.id },
          ...(value.userId
            ? [
                {
                  type: "AffiliateWithdrawRequestsUser" as const,
                  id: value.userId,
                },
                { type: "AffiliateWithdrawBalance" as const, id: value.userId },
              ]
            : []),
        ],
      }),
    }),
    overrideExisting: false,
  });
export default AffiliateWithdrawRequestsApi;
export type GetAffiliateWithdrawRequestsApiResponse = {
  results: IAffiliateWithdrawRequest[];
  total: number;
};
export type GetAffiliateWithdrawRequestsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  statusFilter?: string;
  userIdFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
  updatedByIdFilter?: string;
};
export type SetAffiliateWithdrawRequestStatusApiArg = {
  id: string;
  status: "approved" | "rejected";
  bank?: string;
  transactionReference?: string;
  transactionDescription?: string;
  transactionImageUrl?: string;
  userId?: string;
};

export type GetAffiliateWithdrawBalanceApiResponse = { balance: number };
export type CreateAffiliateWithdrawRequestApiArg = {
  amount: number;
  description?: string;
  userId: string;
};
export const {
  useGetAffiliateWithdrawBalanceQuery,
  useGetAffiliateWithdrawRequestQuery,
  useCreateAffiliateWithdrawRequestMutation,
  useGetAffiliateWithdrawRequestsQuery,
  useLazyGetAffiliateWithdrawRequestsQuery,
  useGetAffiliateWithdrawRequestsUserQuery,
  useSetAffiliateWithdrawRequestStatusMutation,
} = AffiliateWithdrawRequestsApi;
