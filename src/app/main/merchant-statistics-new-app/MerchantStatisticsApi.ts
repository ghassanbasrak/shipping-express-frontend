import { apiService as api } from "app/store/apiService";
import type { GetMerchantStatisticsApiArg as StatisticsArg } from "../merchant-statistics-app/MerchantStatisticsApi";
import IMerchantStatistics from "./models/IMerchantStatistics";
const MerchantStatisticsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMerchantStatisticsNew: build.mutation<
      IMerchantStatistics | null,
      GetMerchantStatisticsApiArg
    >({
      query: (value) => ({
        url: "v1/users/statistics-new",
        method: "POST",
        data: {
          userId: value.userId,
          bankTransferTotals: value.bankTransferTotals,
          otherFees: value.otherFees,
          ...(value.dateFrom ? { dateFrom: value.dateFrom } : {}),
          ...(value.dateTo ? { dateTo: value.dateTo } : {}),
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export type GetMerchantStatisticsApiArg = StatisticsArg & {
  bankTransferTotals: number;
  otherFees: number;
};
export const { useGetMerchantStatisticsNewMutation } = MerchantStatisticsApi;
export default MerchantStatisticsApi;
