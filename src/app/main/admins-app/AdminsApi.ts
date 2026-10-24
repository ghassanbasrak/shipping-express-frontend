import _ from "lodash";
import { apiService as api } from "app/store/apiService";
import IAdmin from "./models/IAdmin";
import { adminEditableFields } from "./models/AdminModel";
export const addTagTypes = ["Admins", "Admin"] as const;
const AdminsApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getAdmins: build.query<GetAdminsApiResponse, GetAdminsApiArg>({
      query: (filters) => ({
        url: "v1/users?role=admin&role=employee",
        params: {
          page: filters.page,
          pageSize: filters.pageSize,
          ...(filters.searchText ? { search: filters.searchText } : {}),
        },
      }),
      providesTags: ["Admins"],
    }),
    getAdmin: build.query<GetAdminApiResponse, GetAdminApiArg>({
      query: (id) => ({ url: `v1/users/${id}` }),
      providesTags: (_, __, id) => [{ type: "Admin", id }],
    }),
    updateAdmin: build.mutation<UpdateAdminApiResponse, UpdateAdminApiArg>({
      query: (value) => ({
        url: `v1/users/${value.id}`,
        method: "PATCH",
        data: _.pick(value, adminEditableFields),
      }),
      invalidatesTags: (_, __, value) => [
        "Admins",
        { type: "Admin", id: value.id },
      ],
    }),
    setAdminBlocked: build.mutation<
      SetAdminBlockedApiResponse,
      SetAdminBlockedApiArg
    >({
      query: (value) => ({
        url: `v1/users/${value.id}`,
        method: "PATCH",
        data: { isBlocked: value.isBlocked },
      }),
      invalidatesTags: (_, __, value) => [
        "Admins",
        { type: "Admin", id: value.id },
      ],
    }),
  }),
  overrideExisting: false,
});
export default AdminsApi;
export type GetAdminsApiResponse = { results: IAdmin[]; total: number };
export type GetAdminsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
};
export type GetAdminApiResponse = IAdmin;
export type GetAdminApiArg = string;
export type UpdateAdminApiResponse = IAdmin;
export type UpdateAdminApiArg = Pick<IAdmin, "id" | "role" | "features">;
export type SetAdminBlockedApiResponse = IAdmin;
export type SetAdminBlockedApiArg = Pick<IAdmin, "id" | "isBlocked">;
export const {
  useGetAdminsQuery,
  useLazyGetAdminsQuery,
  useGetAdminQuery,
  useUpdateAdminMutation,
  useSetAdminBlockedMutation,
} = AdminsApi;
export type AdminsApiType = {
  [AdminsApi.reducerPath]: ReturnType<typeof AdminsApi.reducer>;
};
