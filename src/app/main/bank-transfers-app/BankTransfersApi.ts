import { apiService as api } from "app/store/apiService";
import type { User } from "src/app/auth/user";
import IBankTransfer from "./models/IBankTransfer";
export const addTagTypes = [
  "BankTransfers",
  "BankTransfer",
  "BankTransfersUser",
] as const;
const BankTransfersApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getBankTransfers: build.query<
      GetBankTransfersApiResponse,
      GetBankTransfersApiArg
    >({
      query: (filters) => ({
        url: "v1/requests",
        params: {
          page: filters.page,
          pageSize: filters.pageSize,
          type: "bankTransfer",
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
      providesTags: ["BankTransfers"],
    }),
    getBankTransfersUser: build.query<User, string>({
      query: (id) => ({ url: `v1/users/${id}` }),
      providesTags: (_, __, id) => [{ type: "BankTransfersUser", id }],
    }),
    setBankTransferStatus: build.mutation<
      IBankTransfer,
      SetBankTransferStatusApiArg
    >({
      query: (value) => ({
        url: `v1/requests/${value.id}`,
        method: "PATCH",
        data:
          value.status === "approved"
            ? { status: value.status, bank: value.bank }
            : { status: value.status, notes: value.notes ?? "" },
      }),
      invalidatesTags: (_, __, value) => [
        "BankTransfers",
        { type: "BankTransfer", id: value.id },
        ...(value.userId
          ? [{ type: "BankTransfersUser" as const, id: value.userId }]
          : []),
      ],
    }),
  }),
  overrideExisting: false,
});
export default BankTransfersApi;
export type GetBankTransfersApiResponse = {
  results: IBankTransfer[];
  total: number;
};
export type GetBankTransfersApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  statusFilter?: string;
  userIdFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
  updatedByIdFilter?: string;
};
export type SetBankTransferStatusApiArg = {
  id: string;
  status: "approved" | "rejected";
  bank?: string;
  notes?: string;
  userId?: string;
};

export const {
  useGetBankTransfersQuery,
  useLazyGetBankTransfersQuery,
  useGetBankTransfersUserQuery,
  useSetBankTransferStatusMutation,
} = BankTransfersApi;
