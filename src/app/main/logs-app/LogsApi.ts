import { apiService as api } from "app/store/apiService";
import ILog from "./models/ILog";
export const addTagTypes = ["Logs", "Log"] as const;
const LogsApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getLogs: build.query<GetLogsApiResponse, GetLogsApiArg>({
      query: (filters) => ({
        url: "v1/logs",
        params: {
          page: filters.page,
          pageSize: filters.pageSize,
          ...(filters.searchText ? { search: filters.searchText } : {}),
          ...(filters.typeFilter && filters.typeFilter !== "all"
            ? { type: filters.typeFilter }
            : {}),
          ...(filters.userIdFilter && filters.userIdFilter !== "all"
            ? { userId: filters.userIdFilter }
            : {}),
          ...(filters.dateFromFilter
            ? { dateFrom: filters.dateFromFilter }
            : {}),
          ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
        },
      }),
      providesTags: ["Logs"],
    }),
    getLog: build.query<ILog, string>({
      query: (id) => ({ url: `v1/logs/${id}` }),
      providesTags: (_, __, id) => [{ type: "Log", id }],
    }),
  }),
  overrideExisting: false,
});
export type GetLogsApiResponse = { results: ILog[]; total: number };
export type GetLogsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  userIdFilter?: string;
  typeFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
  dateFromInvalid?: boolean;
  dateToInvalid?: boolean;
};
export const { useGetLogsQuery, useGetLogQuery } = LogsApi;
export default LogsApi;
