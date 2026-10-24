import { apiService as api } from "app/store/apiService";
import type { User } from "src/app/auth/user";
import ITransaction from "./models/ITransaction";
export const addTagTypes = [
  "Transactions",
  "Transaction",
  "TransactionAccount",
] as const;
const TransactionsApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getTransactions: build.query<
      GetTransactionsApiResponse,
      GetTransactionsApiArg
    >({
      query: (filters) => ({
        url: "v1/transactions",
        params: {
          page: filters.page,
          pageSize: filters.pageSize,
          ...(filters.searchText ? { search: filters.searchText } : {}),
          ...(filters.typeFilter && filters.typeFilter !== "all"
            ? { type: filters.typeFilter }
            : {}),
          ...(filters.titleTypeFilter?.length
            ? { transactionTitle: filters.titleTypeFilter }
            : {}),
          ...(filters.relatedBalanceTypeFilter &&
          filters.relatedBalanceTypeFilter !== "all"
            ? { relatedBalance: filters.relatedBalanceTypeFilter }
            : {}),
          ...(filters.userIdFilter && filters.userIdFilter !== "all"
            ? { userId: filters.userIdFilter }
            : {}),
          ...(filters.createdByIdFilter && filters.createdByIdFilter !== "all"
            ? { createdById: filters.createdByIdFilter }
            : {}),
          ...(filters.dateFromFilter
            ? { dateFrom: filters.dateFromFilter }
            : {}),
          ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
        },
        paramsSerializer: { indexes: null },
      }),
      providesTags: ["Transactions"],
    }),
    getTransaction: build.query<ITransaction, string>({
      query: (id) => ({ url: `v1/transactions/${id}` }),
      providesTags: (_, __, id) => [{ type: "Transaction", id }],
    }),
    getTransactionsAccount: build.query<User, string>({
      query: (id) => ({ url: `v1/users/${id}` }),
      providesTags: (_, __, id) => [{ type: "TransactionAccount", id }],
    }),
    getTransactionsUsers: build.query<
      GetTransactionsUsersApiResponse,
      { searchText?: string }
    >({
      query: (filters) => ({
        url: "v1/users",
        params: {
          type: "user",
          ...(filters.searchText ? { search: filters.searchText } : {}),
        },
      }),
    }),
    createTransaction: build.mutation<ITransaction, SaveTransactionApiArg>({
      query: (value) => ({
        url: "v1/transactions",
        method: "POST",
        data: {
          userId: value.userId,
          type: value.type,
          relatedBalance: value.relatedBalance,
          amount: value.amount,
          ...(value.notes ? { notes: value.notes } : {}),
          ...(value.relatedBalance === "wallet"
            ? {
                operationType: value.operationType || "custom",
                ...(value.type === "deposit"
                  ? { applyTax: Boolean(value.applyTax) }
                  : {}),
              }
            : {}),
        },
      }),
      invalidatesTags: (_, error, value) =>
        error
          ? []
          : [
              "Transactions",
              { type: "TransactionAccount", id: value.userId },
              { type: "TransactionAccount", id: "me" },
            ],
    }),
    updateTransaction: build.mutation<ITransaction, UpdateTransactionApiArg>({
      query: ({ id, value }) => ({
        url: `v1/transactions/${id}`,
        method: "PATCH",
        data: {
          userId: value.userId,
          type: value.type,
          relatedBalance: value.relatedBalance,
          amount: value.amount,
          ...(value.notes ? { notes: value.notes } : {}),
          ...(value.relatedBalance === "wallet"
            ? {
                operationType: value.operationType || "custom",
                ...(value.type === "deposit"
                  ? { applyTax: Boolean(value.applyTax) }
                  : {}),
              }
            : {}),
        },
      }),
      invalidatesTags: (_, error, value) =>
        error
          ? []
          : [
              "Transactions",
              { type: "Transaction", id: value.id },
              "TransactionAccount",
            ],
    }),
  }),
  overrideExisting: false,
});
export type GetTransactionsApiResponse = {
  results: ITransaction[];
  total: number;
};
export type GetTransactionsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  typeFilter?: string;
  titleTypeFilter?: string[];
  relatedBalanceTypeFilter?: string;
  userIdFilter?: string;
  createdByIdFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
  dateFromInvalid?: boolean;
  dateToInvalid?: boolean;
};
export type GetTransactionsUsersApiResponse = {
  results: User[];
  total: number;
};
export type SaveTransactionApiArg = {
  userId: string;
  type: string;
  relatedBalance: string;
  amount: number;
  notes?: string;
  operationType?: string;
  applyTax?: boolean;
};
export type UpdateTransactionApiArg = {
  id: string;
  value: SaveTransactionApiArg;
};
export const {
  useGetTransactionsQuery,
  useLazyGetTransactionsQuery,
  useGetTransactionQuery,
  useGetTransactionsAccountQuery,
  useGetTransactionsUsersQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
} = TransactionsApi;
export default TransactionsApi;
