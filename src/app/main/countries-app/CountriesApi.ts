import _ from "lodash";
import { apiService as api } from "app/store/apiService";
import { PartialDeep } from "type-fest";
import CountryModel, { countryEditableFields } from "./models/CountryModel";
import ICountry, { IShipmentCountry } from "./models/ICountry";
import IShippingCompany from "../shipping-companies-app/models/IShippingCompany";

export const addTagTypes = [
  "Countries",
  "ShippingCompanies",
  "Country",
  "ShipmentCountries",
  "AuthPlaces",
] as const;

const CountriesApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getCountries: build.query<GetCountriesApiResponse, GetCountriesApiArg>({
      query: (filters) => ({
        url: "v1/countries",
        params: {
          page: filters.page,
          pageSize: filters.pageSize,
          ...(filters.searchText ? { search: filters.searchText } : {}),
          ...(filters.shippingCompanyIdFilter &&
          filters.shippingCompanyIdFilter !== "all"
            ? { shippingCompanyId: filters.shippingCompanyIdFilter }
            : {}),
          ...(filters.dateFromFilter
            ? { dateFrom: filters.dateFromFilter }
            : {}),
          ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
        },
      }),
      providesTags: ["Countries"],
    }),
    getCountry: build.query<GetCountryApiResponse, GetCountryApiArg>({
      query: (countryId) => ({ url: `v1/countries/${countryId}` }),
      providesTags: (_, __, id) => [{ type: "Country", id }],
    }),
    createCountry: build.mutation<
      CreateCountryApiResponse,
      CreateCountryApiArg
    >({
      query: (newCountry) => ({
        url: "v1/countries",
        method: "POST",
        data: _.pick(CountryModel(newCountry), countryEditableFields),
      }),
      invalidatesTags: ["Countries", { type: "AuthPlaces", id: "countries" }],
    }),
    updateCountry: build.mutation<
      UpdateCountryApiResponse,
      UpdateCountryApiArg
    >({
      query: (country) => ({
        url: `v1/countries/${country.id}`,
        method: "PATCH",
        data: _.pick(country, countryEditableFields),
      }),
      invalidatesTags: (_, __, country) => [
        "Countries",
        { type: "Country", id: country.id },
        { type: "AuthPlaces", id: "countries" },
      ],
    }),
    removeCountry: build.mutation<
      RemoveCountryApiResponse,
      RemoveCountryApiArg
    >({
      query: (countryId) => ({
        url: `v1/countries/${countryId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, id) => [
        "Countries",
        { type: "Country", id },
        { type: "ShipmentCountries", id },
        { type: "AuthPlaces", id: "countries" },
      ],
    }),
    getShipmentCountries: build.query<
      GetShipmentCountriesApiResponse,
      GetShipmentCountriesApiArg
    >({
      query: (countryId) => ({
        url: "v1/shipment-countries",
        params: { countryId, page: 0, pageSize: 1000 },
      }),
      providesTags: (_, __, id) => [{ type: "ShipmentCountries", id }],
    }),
    saveShipmentCountry: build.mutation<
      SaveShipmentCountryApiResponse,
      SaveShipmentCountryApiArg
    >({
      query: (row) => ({
        url:
          row.id || row._id
            ? `v1/shipment-countries/${row.id || row._id}`
            : "v1/shipment-countries",
        method: row.id || row._id ? "PATCH" : "POST",
        data: _.pick(row, [
          "countryId",
          "shippingCompanyId",
          "name",
          "isActive",
        ]),
      }),
      invalidatesTags: (_, __, row) => [
        "Countries",
        { type: "ShipmentCountries", id: row.countryId },
      ],
    }),
    setShipmentCountryActive: build.mutation<
      SaveShipmentCountryApiResponse,
      SaveShipmentCountryApiArg
    >({
      query: (row) => ({
        url: `v1/shipment-countries/${row.id || row._id}`,
        method: "PATCH",
        data: {
          isActive: row.isActive,
          ...(row.isActive ? { name: row.name } : {}),
        },
      }),
      invalidatesTags: (_, __, row) => [
        "Countries",
        { type: "ShipmentCountries", id: row.countryId },
      ],
    }),
    removeShipmentCountry: build.mutation<
      RemoveShipmentCountryApiResponse,
      RemoveShipmentCountryApiArg
    >({
      query: (row) => ({
        url: `v1/shipment-countries/${row.id || row._id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, row) => [
        "Countries",
        { type: "ShipmentCountries", id: row.countryId },
      ],
    }),
    getCountriesShippingCompanies: build.query<
      GetCountriesShippingCompaniesApiResponse,
      void
    >({
      query: () => ({
        url: "v1/shipping-companies",
        params: { page: 0, pageSize: 1000 },
      }),
      providesTags: ["ShippingCompanies"],
    }),
    getCountriesLanguages: build.query<GetCountriesLanguagesApiResponse, void>({
      query: () => ({ url: "v1/languages" }),
    }),
  }),
  overrideExisting: false,
});

export default CountriesApi;

export type GetCountriesApiResponse = { results: ICountry[]; total: number };
export type GetCountriesApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  shippingCompanyIdFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
};
export type GetCountryApiResponse = ICountry;
export type GetCountryApiArg = string;
export type CreateCountryApiResponse = ICountry;
export type CreateCountryApiArg = PartialDeep<ICountry>;
export type UpdateCountryApiResponse = ICountry;
export type UpdateCountryApiArg = ICountry;
export type RemoveCountryApiResponse = unknown;
export type RemoveCountryApiArg = string;
export type GetShipmentCountriesApiResponse = {
  results: IShipmentCountry[];
  total: number;
};
export type GetShipmentCountriesApiArg = string;
export type SaveShipmentCountryApiResponse = IShipmentCountry;
export type SaveShipmentCountryApiArg = IShipmentCountry;
export type RemoveShipmentCountryApiResponse = unknown;
export type RemoveShipmentCountryApiArg = IShipmentCountry;
export type GetCountriesShippingCompaniesApiResponse = {
  results: IShippingCompany[];
  total: number;
};
export type GetCountriesLanguagesApiResponse = { results: string[] };
export const {
  useGetCountriesQuery,
  useGetCountryQuery,
  useGetShipmentCountriesQuery,
  useCreateCountryMutation,
  useUpdateCountryMutation,
  useRemoveCountryMutation,
  useSaveShipmentCountryMutation,
  useSetShipmentCountryActiveMutation,
  useRemoveShipmentCountryMutation,
  useGetCountriesShippingCompaniesQuery,
  useGetCountriesLanguagesQuery,
} = CountriesApi;

export type CountriesApiType = {
  [CountriesApi.reducerPath]: ReturnType<typeof CountriesApi.reducer>;
};
