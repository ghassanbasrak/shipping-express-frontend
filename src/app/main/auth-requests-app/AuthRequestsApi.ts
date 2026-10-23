import { apiService as api } from "app/store/apiService";
import type { User } from "src/app/auth/user";
import IAuthRequest from "./models/IAuthRequest";
export const addTagTypes = [
  "AuthRequests",
  "AuthRequest",
  "AuthRequestsUser",
] as const;
const AuthRequestsApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getAuthRequests: build.query<
      GetAuthRequestsApiResponse,
      GetAuthRequestsApiArg
    >({
      query: (filters) => ({
        url: "v1/requests",
        params: {
          page: filters.page,
          pageSize: filters.pageSize,
          type: "authorization",
          ...(filters.searchText ? { search: filters.searchText } : {}),
          ...(filters.statusFilter && filters.statusFilter !== "all"
            ? { status: filters.statusFilter }
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
      providesTags: ["AuthRequests"],
    }),
    getAuthRequest: build.query<IAuthRequest, string>({
      query: (id) => ({ url: `v1/requests/${id}` }),
      providesTags: (_, __, id) => [{ type: "AuthRequest", id }],
    }),
    getAuthRequestsUser: build.query<User, string>({
      query: (id) => ({ url: `v1/users/${id}` }),
      providesTags: (_, __, id) => [{ type: "AuthRequestsUser", id }],
    }),
    setAuthRequestStatus: build.mutation<
      IAuthRequest,
      SetAuthRequestStatusApiArg
    >({
      query: (value) => ({
        url: `v1/requests/${value.id}`,
        method: "PATCH",
        data: { status: value.status },
      }),
      invalidatesTags: (_, __, value) => [
        "AuthRequests",
        { type: "AuthRequest", id: value.id },
        ...(value.userId
          ? [{ type: "AuthRequestsUser" as const, id: value.userId }]
          : []),
      ],
    }),
    createAuthRequest: build.mutation<IAuthRequest, CreateAuthRequestApiArg>({
      query: (value) => ({
        url: "v1/requests",
        method: "POST",
        data: {
          description: value.description,
          fileUrl: value.fileUrl,
          userId: value.userId,
          type: "authorization",
          status: "pending",
        },
      }),
      invalidatesTags: ["AuthRequests"],
    }),
  }),
  overrideExisting: false,
});
export default AuthRequestsApi;
export type GetAuthRequestsApiResponse = {
  results: IAuthRequest[];
  total: number;
};
export type GetAuthRequestsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  statusFilter?: string;
  userIdFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
};
export type SetAuthRequestStatusApiArg = {
  id: string;
  status: "approved" | "rejected";
  userId?: string;
};
export type CreateAuthRequestApiArg = Pick<
  IAuthRequest,
  "description" | "fileUrl" | "userId"
>;
export const {
  useGetAuthRequestsQuery,
  useLazyGetAuthRequestsQuery,
  useGetAuthRequestQuery,
  useGetAuthRequestsUserQuery,
  useSetAuthRequestStatusMutation,
  useCreateAuthRequestMutation,
} = AuthRequestsApi;
