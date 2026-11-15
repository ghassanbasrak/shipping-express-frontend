import { apiService as api } from "app/store/apiService";
import type { User } from "src/app/auth/user";
import IPayment from "./models/IPayment";
export const addTagTypes = [
  "Payments",
  "Payment",
  "PaymentsUser",
  "Transactions",
  "TransactionAccount",
  "ShipmentAccount",
  "MerchantDuesSummary",
  "StorageSubscription",
] as const;
const PaymentsApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getPayments: build.query<GetPaymentsApiResponse, GetPaymentsApiArg>({
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
      providesTags: ["Payments"],
    }),
    getPayment: build.query<IPayment, string>({
      query: (id) => ({ url: `v1/payments/${id}` }),
      providesTags: (_, __, id) => [{ type: "Payment", id }],
    }),
    getPaymentsUser: build.query<User, string>({
      query: (id) => ({ url: `v1/users/${id}` }),
      providesTags: (_, __, id) => [{ type: "PaymentsUser", id }],
    }),
    createPayment: build.mutation<CheckoutApiResponse, CreatePaymentApiArg>({
      query: (value) => ({
        url: "v1/payments/moyasar",
        method: "POST",
        data: { amount: value.amount },
      }),
      invalidatesTags: ["Payments"],
    }),
    checkPaymentStatus: build.mutation<IPayment, CheckPaymentStatusApiArg>({
      query: (value) => ({
        url: `v1/payments/${value.id}/check-status`,
        method: "POST",
        data: {},
      }),
      invalidatesTags: (_, __, value) => [
        "Payments",
        { type: "Payment", id: value.id },
        "PaymentsUser",
        "Transactions",
        "TransactionAccount",
        "ShipmentAccount",
        "MerchantDuesSummary",
        { type: "StorageSubscription", id: value.userId },
      ],
    }),
  }),
  overrideExisting: false,
});
export type GetPaymentsApiResponse = {
  results: IPayment[];
  total: number;
};
export type GetPaymentsApiArg = {
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
  payment: IPayment;
  checkoutUrl: string;
};
export type CreatePaymentApiArg = { amount: number };
export type CheckPaymentStatusApiArg = { id: string; userId: string };
export const {
  useGetPaymentsQuery,
  useLazyGetPaymentsQuery,
  useGetPaymentQuery,
  useLazyGetPaymentQuery,
  useGetPaymentsUserQuery,
  useCreatePaymentMutation,
  useCheckPaymentStatusMutation,
} = PaymentsApi;
export default PaymentsApi;
