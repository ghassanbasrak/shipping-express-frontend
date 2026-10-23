import _ from "lodash";
import { apiService as api } from "app/store/apiService";
import { PartialDeep } from "type-fest";
import IShipmentUser from "./models/IShipmentUser";
import { shipmentUserEditableFields } from "./models/ShipmentUserModel";
export const addTagTypes = ["ShipmentUsers", "ShipmentUser"] as const;
const ShipmentUsersApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getShipmentUsers: build.query<
      GetShipmentUsersApiResponse,
      GetShipmentUsersApiArg
    >({
      query: (filters) => ({
        url: "v1/shipping-users",
        params: {
          page: filters.page,
          pageSize: filters.pageSize,
          ...(filters.searchText ? { search: filters.searchText } : {}),
          ...(filters.typeFilter && filters.typeFilter !== "all"
            ? { type: filters.typeFilter }
            : {}),
        },
      }),
      providesTags: ["ShipmentUsers"],
    }),
    getShipmentUser: build.query<
      GetShipmentUserApiResponse,
      GetShipmentUserApiArg
    >({
      query: (id) => ({ url: `v1/shipping-users/${id}` }),
      providesTags: (_, __, id) => [{ type: "ShipmentUser", id }],
    }),
    createShipmentUser: build.mutation<
      CreateShipmentUserApiResponse,
      CreateShipmentUserApiArg
    >({
      query: (value) => ({
        url: "v1/shipping-users",
        method: "POST",
        data: _.pick(value, shipmentUserEditableFields),
      }),
      invalidatesTags: ["ShipmentUsers"],
    }),
    updateShipmentUser: build.mutation<
      UpdateShipmentUserApiResponse,
      UpdateShipmentUserApiArg
    >({
      query: (value) => ({
        url: `v1/shipping-users/${value.id}`,
        method: "PATCH",
        data: _.pick(value, shipmentUserEditableFields),
      }),
      invalidatesTags: (_, __, value) => [
        "ShipmentUsers",
        { type: "ShipmentUser", id: value.id },
      ],
    }),
    removeShipmentUser: build.mutation<
      RemoveShipmentUserApiResponse,
      RemoveShipmentUserApiArg
    >({
      query: (id) => ({ url: `v1/shipping-users/${id}`, method: "DELETE" }),
      invalidatesTags: (_, __, id) => [
        "ShipmentUsers",
        { type: "ShipmentUser", id },
      ],
    }),
  }),
  overrideExisting: false,
});
export default ShipmentUsersApi;
export type GetShipmentUsersApiResponse = {
  results: IShipmentUser[];
  total: number;
};
export type GetShipmentUsersApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  typeFilter?: string;
};
export type GetShipmentUserApiResponse = IShipmentUser;
export type GetShipmentUserApiArg = string;
export type CreateShipmentUserApiResponse = IShipmentUser;
export type CreateShipmentUserApiArg = PartialDeep<IShipmentUser>;
export type UpdateShipmentUserApiResponse = IShipmentUser;
export type UpdateShipmentUserApiArg = IShipmentUser;
export type RemoveShipmentUserApiResponse = unknown;
export type RemoveShipmentUserApiArg = string;
export const {
  useGetShipmentUsersQuery,
  useLazyGetShipmentUsersQuery,
  useGetShipmentUserQuery,
  useCreateShipmentUserMutation,
  useUpdateShipmentUserMutation,
  useRemoveShipmentUserMutation,
} = ShipmentUsersApi;
export type ShipmentUsersApiType = {
  [ShipmentUsersApi.reducerPath]: ReturnType<typeof ShipmentUsersApi.reducer>;
};
