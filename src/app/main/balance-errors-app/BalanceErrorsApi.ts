import { apiService as api } from "app/store/apiService";
import type { User } from "src/app/auth/user";
import IBalanceError from "./models/IBalanceError";
const BalanceErrorsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getBalanceErrors: build.query<
      GetBalanceErrorsApiResponse,
      GetBalanceErrorsApiArg
    >({
      query: (range) => ({
        url: "v1/transactions/balance-errors",
        params: { dateFrom: range.dateFrom, dateTo: range.dateTo },
      }),
    }),
  }),
});
export type GetBalanceErrorsApiArg = { dateFrom: string; dateTo: string };
export type GetBalanceErrorsApiResponse = {
  users?: {
    userId?: string;
    user?: User;
    groups?: { transactions?: IBalanceError[] }[];
  }[];
};
export const { useLazyGetBalanceErrorsQuery } = BalanceErrorsApi;
export default BalanceErrorsApi;
