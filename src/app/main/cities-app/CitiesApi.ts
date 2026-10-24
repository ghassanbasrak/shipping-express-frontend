import _ from "lodash";
import { apiService as api } from "app/store/apiService";
import { PartialDeep } from "type-fest";
import CityModel, { cityEditableFields } from "./models/CityModel";
import ICity, { IShipmentCity } from "./models/ICity";

export const addTagTypes = [
  "Cities",
  "City",
  "ShipmentCities",
  "AuthPlaces",
  "ShippingCompanies",
  "ShippingCompany",
] as const;
const CitiesApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getCities: build.query<GetCitiesApiResponse, GetCitiesApiArg>({
      query: (filters) => ({
        url: "v1/cities",
        params: {
          page: filters.page,
          pageSize: filters.pageSize,
          ...(filters.searchText ? { search: filters.searchText } : {}),
          ...(filters.shippingCompanyIdFilter &&
          filters.shippingCompanyIdFilter !== "all"
            ? { shippingCompanyId: filters.shippingCompanyIdFilter }
            : {}),
          ...(filters.countryIdFilter && filters.countryIdFilter !== "all"
            ? { countryId: filters.countryIdFilter }
            : {}),
          ...(filters.stateIdFilter && filters.stateIdFilter !== "all"
            ? { stateId: filters.stateIdFilter }
            : {}),
          ...(filters.dateFromFilter
            ? { dateFrom: filters.dateFromFilter }
            : {}),
          ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
        },
      }),
      providesTags: ["Cities"],
    }),
    getCity: build.query<GetCityApiResponse, GetCityApiArg>({
      query: (id) => ({ url: `v1/cities/${id}` }),
      providesTags: (_, __, id) => [{ type: "City", id }],
    }),
    createCity: build.mutation<CreateCityApiResponse, CreateCityApiArg>({
      query: (value) => ({
        url: "v1/cities",
        method: "POST",
        data: _.pick(CityModel(value), cityEditableFields),
      }),
      invalidatesTags: [
        "Cities",
        "ShippingCompanies",
        "ShippingCompany",
        { type: "AuthPlaces", id: "cities" },
      ],
    }),
    updateCity: build.mutation<UpdateCityApiResponse, UpdateCityApiArg>({
      query: (value) => ({
        url: `v1/cities/${value.id}`,
        method: "PATCH",
        data: _.pick(value, cityEditableFields),
      }),
      invalidatesTags: (_, __, value) => [
        "Cities",
        { type: "City", id: value.id },
        { type: "AuthPlaces", id: "cities" },
      ],
    }),
    removeCity: build.mutation<RemoveCityApiResponse, RemoveCityApiArg>({
      query: (id) => ({ url: `v1/cities/${id}`, method: "DELETE" }),
      invalidatesTags: (_, __, id) => [
        "Cities",
        { type: "City", id },
        { type: "ShipmentCities", id },
        "ShippingCompanies",
        "ShippingCompany",
        { type: "AuthPlaces", id: "cities" },
      ],
    }),
    getShipmentCities: build.query<
      GetShipmentCitiesApiResponse,
      GetShipmentCitiesApiArg
    >({
      query: (cityId) => ({
        url: "v1/shipment-cities",
        params: { cityId, page: 0, pageSize: 1000 },
      }),
      providesTags: (_, __, id) => [{ type: "ShipmentCities", id }],
    }),
    saveShipmentCity: build.mutation<
      SaveShipmentCityApiResponse,
      SaveShipmentCityApiArg
    >({
      query: (row) => ({
        url:
          row.id || row._id
            ? `v1/shipment-cities/${row.id || row._id}`
            : "v1/shipment-cities",
        method: row.id || row._id ? "PATCH" : "POST",
        data: _.pick(row, ["cityId", "shippingCompanyId", "name", "isActive"]),
      }),
      invalidatesTags: (_, __, row) => [
        "Cities",
        { type: "ShipmentCities", id: row.cityId },
        "ShippingCompanies",
      ],
    }),
    setShipmentCityActive: build.mutation<
      SaveShipmentCityApiResponse,
      SaveShipmentCityApiArg
    >({
      query: (row) => ({
        url: `v1/shipment-cities/${row.id || row._id}`,
        method: "PATCH",
        data: {
          isActive: row.isActive,
          ...(row.isActive ? { name: row.name } : {}),
        },
      }),
      invalidatesTags: (_, __, row) => [
        "Cities",
        { type: "ShipmentCities", id: row.cityId },
      ],
    }),
    removeShipmentCity: build.mutation<
      RemoveShipmentCityApiResponse,
      RemoveShipmentCityApiArg
    >({
      query: (row) => ({
        url: `v1/shipment-cities/${row.id || row._id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, row) => [
        "Cities",
        { type: "ShipmentCities", id: row.cityId },
      ],
    }),
  }),
  overrideExisting: false,
});
export default CitiesApi;

export type GetCitiesApiResponse = { results: ICity[]; total: number };
export type GetCitiesApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  shippingCompanyIdFilter?: string;
  countryIdFilter?: string;
  stateIdFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
};
export type GetCityApiResponse = ICity;
export type GetCityApiArg = string;
export type CreateCityApiResponse = ICity;
export type CreateCityApiArg = PartialDeep<ICity>;
export type UpdateCityApiResponse = ICity;
export type UpdateCityApiArg = ICity;
export type RemoveCityApiResponse = unknown;
export type RemoveCityApiArg = string;
export type GetShipmentCitiesApiResponse = {
  results: IShipmentCity[];
  total: number;
};
export type GetShipmentCitiesApiArg = string;
export type SaveShipmentCityApiResponse = IShipmentCity;
export type SaveShipmentCityApiArg = IShipmentCity;
export type RemoveShipmentCityApiResponse = unknown;
export type RemoveShipmentCityApiArg = IShipmentCity;

export const {
  useGetCitiesQuery,
  useLazyGetCitiesQuery,
  useGetCityQuery,
  useCreateCityMutation,
  useUpdateCityMutation,
  useRemoveCityMutation,
  useGetShipmentCitiesQuery,
  useLazyGetShipmentCitiesQuery,
  useSaveShipmentCityMutation,
  useSetShipmentCityActiveMutation,
  useRemoveShipmentCityMutation,
} = CitiesApi;
export type CitiesApiType = {
  [CitiesApi.reducerPath]: ReturnType<typeof CitiesApi.reducer>;
};
