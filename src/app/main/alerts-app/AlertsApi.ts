import _ from "lodash";
import { apiService as api } from "app/store/apiService";
import { PartialDeep } from "type-fest";
import IAlert from "./models/IAlert";
import { alertEditableFields } from "./models/AlertModel";
export const addTagTypes = ["Alerts", "Alert"] as const;
const AlertsApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getAlerts: build.query<GetAlertsApiResponse, GetAlertsApiArg>({
      query: (filters) => ({
        url: "v1/alerts",
        params: {
          page: filters.page,
          pageSize: filters.pageSize,
          ...(filters.searchText ? { search: filters.searchText } : {}),

          ...(filters.userIdFilter && filters.userIdFilter !== "all"
            ? { userId: filters.userIdFilter }
            : {}),
          ...(filters.dateFromFilter
            ? { dateFrom: filters.dateFromFilter }
            : {}),
          ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
        },
      }),
      providesTags: ["Alerts"],
    }),
    getAlert: build.query<GetAlertApiResponse, GetAlertApiArg>({
      query: (id) => ({ url: `v1/alerts/${id}` }),
      providesTags: (_, __, id) => [{ type: "Alert", id }],
    }),
    createAlert: build.mutation<CreateAlertApiResponse, CreateAlertApiArg>({
      query: (value) => ({
        url: "v1/alerts",
        method: "POST",
        data: _.pick(value, alertEditableFields),
      }),
      invalidatesTags: ["Alerts"],
    }),
    updateAlert: build.mutation<UpdateAlertApiResponse, UpdateAlertApiArg>({
      query: (value) => ({
        url: `v1/alerts/${value.id}`,
        method: "PATCH",
        data: _.pick(value, alertEditableFields),
      }),
      invalidatesTags: (_, __, value) => [
        "Alerts",
        { type: "Alert", id: value.id },
      ],
    }),
    removeAlert: build.mutation<RemoveAlertApiResponse, RemoveAlertApiArg>({
      query: (id) => ({ url: `v1/alerts/${id}`, method: "DELETE" }),
      invalidatesTags: (_, __, id) => ["Alerts", { type: "Alert", id }],
    }),
  }),
  overrideExisting: false,
});
export default AlertsApi;
export type GetAlertsApiResponse = { results: IAlert[]; total: number };
export type GetAlertsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  userIdFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
};
export type GetAlertApiResponse = IAlert;
export type GetAlertApiArg = string;
export type CreateAlertApiResponse = IAlert;
export type CreateAlertApiArg = PartialDeep<IAlert>;
export type UpdateAlertApiResponse = IAlert;
export type UpdateAlertApiArg = Partial<IAlert> & { id: string };
export type RemoveAlertApiResponse = unknown;
export type RemoveAlertApiArg = string;
export const {
  useGetAlertsQuery,
  useLazyGetAlertsQuery,
  useGetAlertQuery,
  useCreateAlertMutation,
  useUpdateAlertMutation,
  useRemoveAlertMutation,
} = AlertsApi;
export type AlertsApiType = {
  [AlertsApi.reducerPath]: ReturnType<typeof AlertsApi.reducer>;
};
