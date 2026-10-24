import _ from "lodash";
import { apiService as api } from "app/store/apiService";
import { PartialDeep } from "type-fest";
import type { User } from "src/app/auth/user";
import IApplication from "./models/IApplication";
import { applicationEditableFields } from "./models/ApplicationModel";
export const addTagTypes = [
  "Applications",
  "Application",
  "ApplicationUser",
] as const;
const ApplicationsApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getApplications: build.query<
      GetApplicationsApiResponse,
      GetApplicationsApiArg
    >({
      query: (filters) => ({
        url: "v1/applications",
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
      providesTags: ["Applications"],
    }),
    getApplication: build.query<
      GetApplicationApiResponse,
      GetApplicationApiArg
    >({
      query: (id) => ({ url: `v1/applications/${id}` }),
      providesTags: (_, __, id) => [{ type: "Application", id }],
    }),
    getApplicationUser: build.query<User, string>({
      query: (id) => ({ url: `v1/users/${id}` }),
      providesTags: (_, __, id) => [{ type: "ApplicationUser", id }],
    }),
    getApplicationUsers: build.query<
      GetApplicationUsersApiResponse,
      GetApplicationUsersApiArg
    >({
      query: (filters) => ({
        url: "v1/users",
        params: {
          type: "user",
          ...(filters.searchText ? { search: filters.searchText } : {}),
        },
      }),
    }),
    createApplication: build.mutation<
      CreateApplicationApiResponse,
      CreateApplicationApiArg
    >({
      query: (value) => ({
        url: "v1/applications",
        method: "POST",
        data: _.pick(value, applicationEditableFields),
      }),
      invalidatesTags: ["Applications"],
    }),
    updateApplication: build.mutation<
      UpdateApplicationApiResponse,
      UpdateApplicationApiArg
    >({
      query: (value) => ({
        url: `v1/applications/${value.id}`,
        method: "PATCH",
        data: _.pick(value, applicationEditableFields),
      }),
      invalidatesTags: (_, __, value) => [
        "Applications",
        { type: "Application", id: value.id },
      ],
    }),
    removeApplication: build.mutation<
      RemoveApplicationApiResponse,
      RemoveApplicationApiArg
    >({
      query: (id) => ({ url: `v1/applications/${id}`, method: "DELETE" }),
      invalidatesTags: (_, __, id) => [
        "Applications",
        { type: "Application", id },
      ],
    }),
  }),
  overrideExisting: false,
});
export default ApplicationsApi;
export type GetApplicationsApiResponse = {
  results: IApplication[];
  total: number;
};
export type GetApplicationsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  userIdFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
};
export type GetApplicationApiResponse = IApplication;
export type GetApplicationApiArg = string;
export type CreateApplicationApiResponse = IApplication;
export type CreateApplicationApiArg = PartialDeep<IApplication>;
export type UpdateApplicationApiResponse = IApplication;
export type UpdateApplicationApiArg = IApplication;
export type RemoveApplicationApiResponse = unknown;
export type RemoveApplicationApiArg = string;
export type GetApplicationUsersApiResponse = { results: User[]; total: number };
export type GetApplicationUsersApiArg = { searchText?: string };
export const {
  useGetApplicationsQuery,
  useLazyGetApplicationsQuery,
  useGetApplicationQuery,
  useGetApplicationUserQuery,
  useGetApplicationUsersQuery,
  useCreateApplicationMutation,
  useUpdateApplicationMutation,
  useRemoveApplicationMutation,
} = ApplicationsApi;
export type ApplicationsApiType = {
  [ApplicationsApi.reducerPath]: ReturnType<typeof ApplicationsApi.reducer>;
};
