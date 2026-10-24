import IPackagingSupply from "./models/IPackagingSupply";
import { apiService as api } from "app/store/apiService";
import type { User } from "src/app/auth/user";
import IPackageRequest from "./models/IPackageRequest";
export const addTagTypes = [
  "PackageRequests",
  "PackageRequest",
  "PackageRequestsUser",
] as const;
const PackageRequestsApi = api
  .enhanceEndpoints({ addTagTypes })
  .injectEndpoints({
    endpoints: (build) => ({
      getPackageRequests: build.query<
        GetPackageRequestsApiResponse,
        GetPackageRequestsApiArg
      >({
        query: (filters) => ({
          url: "v1/requests",
          params: {
            page: filters.page,
            pageSize: filters.pageSize,
            type: "bags",
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
        providesTags: ["PackageRequests"],
      }),

      getPackagingSupplies: build.query<GetPackagingSuppliesApiResponse, void>({
        query: () => ({
          url: "v1/products",
          params: { page: 0, pageSize: 50 },
        }),
      }),
      getPackageRequest: build.query<IPackageRequest, string>({
        query: (id) => ({ url: `v1/requests/${id}` }),
        providesTags: (_, __, id) => [{ type: "PackageRequest", id }],
      }),
      createPackageRequest: build.mutation<
        IPackageRequest,
        CreatePackageRequestApiArg
      >({
        query: (value) => ({
          url: "v1/requests",
          method: "POST",
          data: {
            productIds: value.productIds,
            amount: value.amount,
            fullName: value.fullName,
            phone: value.phone,
            shippingAddress: value.shippingAddress,
            ...(value.description ? { description: value.description } : {}),
            userId: value.userId,
            type: "bags",
            status: "pending",
          },
        }),
        invalidatesTags: (_, __, value) => [
          "PackageRequests",
          { type: "PackageRequestsUser", id: value.userId },
        ],
      }),
      getPackageRequestsUser: build.query<User, string>({
        query: (id) => ({ url: `v1/users/${id}` }),
        providesTags: (_, __, id) => [{ type: "PackageRequestsUser", id }],
      }),
      setPackageRequestStatus: build.mutation<
        IPackageRequest,
        SetPackageRequestStatusApiArg
      >({
        query: (value) => ({
          url: `v1/requests/${value.id}`,
          method: "PATCH",
          data: { status: value.status },
        }),
        invalidatesTags: (_, __, value) => [
          "PackageRequests",
          { type: "PackageRequest", id: value.id },
          ...(value.userId
            ? [{ type: "PackageRequestsUser" as const, id: value.userId }]
            : []),
        ],
      }),
    }),
    overrideExisting: false,
  });
export default PackageRequestsApi;
export type GetPackageRequestsApiResponse = {
  results: IPackageRequest[];
  total: number;
};
export type GetPackageRequestsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  statusFilter?: string;
  userIdFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
  updatedByIdFilter?: string;
};
export type SetPackageRequestStatusApiArg = {
  id: string;
  status: "approved" | "rejected";
  userId?: string;
};

export type GetPackagingSuppliesApiResponse = {
  results: IPackagingSupply[];
  total: number;
};
export type CreatePackageRequestApiArg = {
  userId: string;
  productIds: string[];
  amount: number;
  description?: string;
  fullName: string;
  phone: string;
  shippingAddress: {
    countryId?: string;
    stateId?: string;
    cityId?: string;
    street?: string;
    zipCode?: string;
  };
};
export const {
  useGetPackagingSuppliesQuery,
  useGetPackageRequestQuery,
  useCreatePackageRequestMutation,
  useGetPackageRequestsQuery,
  useLazyGetPackageRequestsQuery,
  useGetPackageRequestsUserQuery,
  useSetPackageRequestStatusMutation,
} = PackageRequestsApi;
