import _ from "lodash";
import { apiService as api } from "app/store/apiService";
import { PartialDeep } from "type-fest";
import IShippingCompany from "./models/IShippingCompany";
import ShippingCompanyModel, {
  shippingCompanyEditableFields,
} from "./models/ShippingCompanyModel";

export const addTagTypes = ["ShippingCompanies", "ShippingCompany"] as const;
const ShippingCompaniesApi = api
  .enhanceEndpoints({ addTagTypes })
  .injectEndpoints({
    endpoints: (build) => ({
      getShippingCompanies: build.query<
        GetShippingCompaniesApiResponse,
        GetShippingCompaniesApiArg
      >({
        query: (filters) => ({
          url: "v1/shipping-companies",
          params: {
            page: filters.page,
            pageSize: filters.pageSize,
            ...(filters.searchText ? { search: filters.searchText } : {}),
          },
        }),
        providesTags: ["ShippingCompanies"],
      }),
      getShippingCompany: build.query<
        GetShippingCompanyApiResponse,
        GetShippingCompanyApiArg
      >({
        query: (id) => ({ url: `v1/shipping-companies/${id}` }),
        providesTags: (_, __, id) => [{ type: "ShippingCompany", id }],
      }),
      createShippingCompany: build.mutation<
        CreateShippingCompanyApiResponse,
        CreateShippingCompanyApiArg
      >({
        query: (value) => ({
          url: "v1/shipping-companies",
          method: "POST",
          data: _.pick(
            ShippingCompanyModel(value),
            shippingCompanyEditableFields,
          ),
        }),
        invalidatesTags: ["ShippingCompanies"],
      }),
      updateShippingCompany: build.mutation<
        UpdateShippingCompanyApiResponse,
        UpdateShippingCompanyApiArg
      >({
        query: (value) => ({
          url: `v1/shipping-companies/${value.id}`,
          method: "PATCH",
          data: _.pick(value, shippingCompanyEditableFields),
        }),
        invalidatesTags: (_, __, value) => [
          "ShippingCompanies",
          { type: "ShippingCompany", id: value.id },
        ],
      }),
      removeShippingCompany: build.mutation<
        RemoveShippingCompanyApiResponse,
        RemoveShippingCompanyApiArg
      >({
        query: (id) => ({
          url: `v1/shipping-companies/${id}`,
          method: "DELETE",
        }),
        invalidatesTags: (_, __, id) => [
          "ShippingCompanies",
          { type: "ShippingCompany", id },
        ],
      }),
    }),
    overrideExisting: false,
  });

export default ShippingCompaniesApi;
export type GetShippingCompaniesApiResponse = {
  results: IShippingCompany[];
  total: number;
};
export type GetShippingCompaniesApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
};
export type GetShippingCompanyApiResponse = IShippingCompany;
export type GetShippingCompanyApiArg = string;
export type CreateShippingCompanyApiResponse = IShippingCompany;
export type CreateShippingCompanyApiArg = PartialDeep<IShippingCompany>;
export type UpdateShippingCompanyApiResponse = IShippingCompany;
export type UpdateShippingCompanyApiArg = PartialDeep<IShippingCompany> & {
  id: string;
};
export type RemoveShippingCompanyApiResponse = unknown;
export type RemoveShippingCompanyApiArg = string;

export const {
  useGetShippingCompaniesQuery,
  useGetShippingCompanyQuery,
  useCreateShippingCompanyMutation,
  useUpdateShippingCompanyMutation,
  useRemoveShippingCompanyMutation,
} = ShippingCompaniesApi;
export type ShippingCompaniesApiType = {
  [ShippingCompaniesApi.reducerPath]: ReturnType<
    typeof ShippingCompaniesApi.reducer
  >;
};
