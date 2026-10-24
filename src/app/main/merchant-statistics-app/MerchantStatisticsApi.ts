import { apiService as api } from "app/store/apiService";
import type { User } from "src/app/auth/user";
import IMerchantStatistics from "./models/IMerchantStatistics";
const MerchantStatisticsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMerchantStatistics: build.mutation<
      IMerchantStatistics | null,
      GetMerchantStatisticsApiArg
    >({
      query: (value) => ({
        url: "v1/users/statistics",
        method: "POST",
        data: {
          userId: value.userId,
          ...(value.dateFrom ? { dateFrom: value.dateFrom } : {}),
          ...(value.dateTo ? { dateTo: value.dateTo } : {}),
        },
      }),
    }),
    getStatisticsUsers: build.query<
      GetStatisticsUsersApiResponse,
      GetStatisticsUsersApiArg
    >({
      query: (filters) => ({
        url: "v1/users",
        params: {
          type: "user",
          ...(filters.searchText ? { search: filters.searchText } : {}),
        },
      }),
    }),
    getStatisticsUser: build.query<User, string>({
      query: (id) => ({ url: `v1/users/${id}` }),
    }),
  }),
  overrideExisting: false,
});
export type GetMerchantStatisticsApiArg = {
  userId: string;
  dateFrom?: string;
  dateTo?: string;
};
export type GetStatisticsUsersApiArg = { searchText?: string };
export type GetStatisticsUsersApiResponse = { results: User[]; total: number };
export const {
  useGetMerchantStatisticsMutation,
  useGetStatisticsUsersQuery,
  useGetStatisticsUserQuery,
} = MerchantStatisticsApi;
export default MerchantStatisticsApi;
