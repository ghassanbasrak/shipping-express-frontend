import { apiService as api } from "app/store/apiService";
import {
  GetTransactionsApiArg,
  GetTransactionsApiResponse,
} from "../transactions-app/TransactionsApi";
const TransactionReportsApi = api
  .enhanceEndpoints({ addTagTypes: ["Transactions"] })
  .injectEndpoints({
    endpoints: (build) => ({
      getTransactionReports: build.query<
        GetTransactionsApiResponse,
        GetTransactionReportsApiArg
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
            ...(filters.titleTypeFilter && filters.titleTypeFilter !== "all"
              ? { transactionTitle: filters.titleTypeFilter }
              : {}),
            relatedBalance: filters.relatedBalanceTypeFilter,
            ...(filters.userIdFilter && filters.userIdFilter !== "all"
              ? { userId: filters.userIdFilter }
              : {}),
            ...(filters.dateFromFilter
              ? { dateFrom: filters.dateFromFilter }
              : {}),
            ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
          },
        }),
        providesTags: ["Transactions"],
      }),
      getTransactionReportFile: build.query<
        GetTransactionReportFileApiResponse,
        GetTransactionReportFileApiArg
      >({
        query: (filters) => ({
          url: "v1/transactions/report",
          params: {
            reportType: filters.reportType,
            page: 0,
            pageSize: 50000,
            ...(filters.searchText ? { search: filters.searchText } : {}),
            ...(filters.typeFilter && filters.typeFilter !== "all"
              ? { type: filters.typeFilter }
              : {}),
            ...(filters.titleTypeFilter && filters.titleTypeFilter !== "all"
              ? { transactionTitle: filters.titleTypeFilter }
              : {}),
            relatedBalance: filters.relatedBalanceTypeFilter,
            ...(filters.userIdFilter && filters.userIdFilter !== "all"
              ? { userId: filters.userIdFilter }
              : {}),
            ...(filters.dateFromFilter
              ? { dateFrom: filters.dateFromFilter }
              : {}),
            ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
          },
        }),
      }),
    }),
    overrideExisting: false,
  });
export type GetTransactionReportsApiArg = Omit<
  GetTransactionsApiArg,
  "titleTypeFilter"
> & { titleTypeFilter?: string };
export type GetTransactionReportFileApiArg = GetTransactionReportsApiArg & {
  reportType: "pdf" | "xlsx";
};
export type GetTransactionReportFileApiResponse = { url?: string };
export const {
  useGetTransactionReportsQuery,
  useLazyGetTransactionReportFileQuery,
} = TransactionReportsApi;
export default TransactionReportsApi;
