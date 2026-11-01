import { apiService as api } from "app/store/apiService";
import type { User } from "src/app/auth/user";
import IShipment from "../shipments-app/models/IShipment";
import IWithdrawRequest from "./models/IWithdrawRequest";
export const addTagTypes = [
  "WithdrawRequests",
  "WithdrawRequest",
  "WithdrawRequestsUser",
  "WithdrawBalance",
  "WithdrawEligibleShipments",
  "Shipments",
  "MerchantDues",
  "MerchantDuesSummary",
  "ShipmentSummary",
  "ShipmentAccount",
] as const;
const WithdrawRequestsApi = api
  .enhanceEndpoints({ addTagTypes })
  .injectEndpoints({
    endpoints: (build) => ({
      getWithdrawRequestShipments: build.query<
        { results: IShipment[]; total: number },
        void
      >({
        query: () => ({
          url: "v1/shipments",
          params: { page: 0, pageSize: 1000, isCod: true, codStatus: "paid" },
        }),
        providesTags: ["WithdrawEligibleShipments"],
      }),
      getWithdrawRequests: build.query<
        GetWithdrawRequestsApiResponse,
        GetWithdrawRequestsApiArg
      >({
        query: (filters) => ({
          url: "v1/requests?type=withdrew&type=walletCharge",
          params: {
            page: filters.page,
            pageSize: filters.pageSize,
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
        providesTags: ["WithdrawRequests"],
      }),

      getWithdrawBalance: build.query<GetWithdrawBalanceApiResponse, string>({
        query: (id) => ({
          url: `v1/requests/available-for-withdrew/${id}`,
        }),
        providesTags: (_, __, id) => [{ type: "WithdrawBalance", id }],
      }),
      getWithdrawRequest: build.query<IWithdrawRequest, string>({
        query: (id) => ({ url: `v1/requests/${id}` }),
        providesTags: (_, __, id) => [{ type: "WithdrawRequest", id }],
      }),
      createWithdrawRequest: build.mutation<
        IWithdrawRequest,
        CreateWithdrawRequestApiArg
      >({
        query: (value) => ({
          url: "v1/requests",
          method: "POST",
          data: {
            amount: value.amount,
            ...(value.description ? { description: value.description } : {}),
            userId: value.userId,
            type: value.type,
            shipmentIds: value.shipmentIds,
            status: "pending",
          },
        }),
        invalidatesTags: (_, __, value) => [
          "WithdrawRequests",
          "WithdrawEligibleShipments",
          "Shipments",
          "MerchantDues",
          "MerchantDuesSummary",
          "ShipmentSummary",
          "ShipmentAccount",
          { type: "WithdrawBalance", id: value.userId },
        ],
      }),
      getWithdrawRequestsUser: build.query<User, string>({
        query: (id) => ({ url: `v1/users/${id}` }),
        providesTags: (_, __, id) => [{ type: "WithdrawRequestsUser", id }],
      }),
      setWithdrawRequestStatus: build.mutation<
        IWithdrawRequest,
        SetWithdrawRequestStatusApiArg
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
          "WithdrawRequests",
          "WithdrawEligibleShipments",
          "Shipments",
          "MerchantDues",
          "MerchantDuesSummary",
          "ShipmentSummary",
          "ShipmentAccount",
          { type: "WithdrawRequest", id: value.id },
          ...(value.userId
            ? [
                {
                  type: "WithdrawRequestsUser" as const,
                  id: value.userId,
                },
                { type: "WithdrawBalance" as const, id: value.userId },
              ]
            : []),
        ],
      }),
    }),
    overrideExisting: false,
  });
export default WithdrawRequestsApi;
export type GetWithdrawRequestsApiResponse = {
  results: IWithdrawRequest[];
  total: number;
};
export type GetWithdrawRequestsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  statusFilter?: string;
  userIdFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
  dateFromInvalid?: boolean;
  dateToInvalid?: boolean;
  updatedByIdFilter?: string;
};
export type SetWithdrawRequestStatusApiArg = {
  id: string;
  status: "approved" | "rejected";
  bank?: string;
  transactionReference?: string;
  transactionDescription?: string;
  transactionImageUrl?: string;
  userId?: string;
};

export type GetWithdrawBalanceApiResponse = { amount: number };
export type CreateWithdrawRequestApiArg = {
  amount: number;
  shipmentIds: string[];
  type: "withdrew" | "walletCharge";
  description?: string;
  userId: string;
};
export const {
  useGetWithdrawRequestShipmentsQuery,
  useLazyGetWithdrawBalanceQuery,
  useLazyGetWithdrawRequestShipmentsQuery,
  useGetWithdrawBalanceQuery,
  useGetWithdrawRequestQuery,
  useCreateWithdrawRequestMutation,
  useGetWithdrawRequestsQuery,
  useLazyGetWithdrawRequestsQuery,
  useGetWithdrawRequestsUserQuery,
  useSetWithdrawRequestStatusMutation,
} = WithdrawRequestsApi;
