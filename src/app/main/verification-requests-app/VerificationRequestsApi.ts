import { apiService as api } from "app/store/apiService";
import type { User } from "src/app/auth/user";
import IVerificationRequest from "./models/IVerificationRequest";
export const addTagTypes = [
  "VerificationRequests",
  "VerificationRequest",
  "VerificationRequestsUser",
] as const;
const VerificationRequestsApi = api
  .enhanceEndpoints({ addTagTypes })
  .injectEndpoints({
    endpoints: (build) => ({
      getVerificationRequests: build.query<
        GetVerificationRequestsApiResponse,
        GetVerificationRequestsApiArg
      >({
        query: (filters) => ({
          url: "v1/requests",
          params: {
            page: filters.page,
            pageSize: filters.pageSize,
            type: "verification",
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
        providesTags: ["VerificationRequests"],
      }),
      getVerificationRequest: build.query<IVerificationRequest, string>({
        query: (id) => ({ url: `v1/requests/${id}` }),
        providesTags: (_, __, id) => [{ type: "VerificationRequest", id }],
      }),
      getVerificationRequestsUser: build.query<User, string>({
        query: (id) => ({ url: `v1/users/${id}` }),
        providesTags: (_, __, id) => [{ type: "VerificationRequestsUser", id }],
      }),
      setVerificationRequestStatus: build.mutation<
        IVerificationRequest,
        SetVerificationRequestStatusApiArg
      >({
        query: (value) => ({
          url: `v1/requests/${value.id}`,
          method: "PATCH",
          data: { status: value.status },
        }),
        invalidatesTags: (_, __, value) => [
          "VerificationRequests",
          { type: "VerificationRequest", id: value.id },
          ...(value.userId
            ? [{ type: "VerificationRequestsUser" as const, id: value.userId }]
            : []),
        ],
      }),
    }),
    overrideExisting: false,
  });
export default VerificationRequestsApi;
export type GetVerificationRequestsApiResponse = {
  results: IVerificationRequest[];
  total: number;
};
export type GetVerificationRequestsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  statusFilter?: string;
  userIdFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
  updatedByIdFilter?: string;
};
export type SetVerificationRequestStatusApiArg = {
  id: string;
  status: "approved" | "rejected";
  userId?: string;
};

export const {
  useGetVerificationRequestsQuery,
  useLazyGetVerificationRequestsQuery,
  useGetVerificationRequestQuery,
  useGetVerificationRequestsUserQuery,
  useSetVerificationRequestStatusMutation,
} = VerificationRequestsApi;
