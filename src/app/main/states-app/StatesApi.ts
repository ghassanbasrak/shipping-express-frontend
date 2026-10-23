import _ from "lodash";
import { apiService as api } from "app/store/apiService";
import { PartialDeep } from "type-fest";
import StateModel, { stateEditableFields } from "./models/StateModel";
import IState, { IShipmentState } from "./models/IState";

export const addTagTypes = [
  "States",
  "State",
  "ShipmentStates",
  "AuthPlaces",
  "ShippingCompanies",
  "ShippingCompany",
  "Cities",
] as const;
const StatesApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getStates: build.query<GetStatesApiResponse, GetStatesApiArg>({
      query: (filters) => ({
        url: "v1/states",
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
          ...(filters.dateFromFilter
            ? { dateFrom: filters.dateFromFilter }
            : {}),
          ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
        },
      }),
      providesTags: ["States"],
    }),
    getState: build.query<GetStateApiResponse, GetStateApiArg>({
      query: (id) => ({ url: `v1/states/${id}` }),
      providesTags: (_, __, id) => [{ type: "State", id }],
    }),
    createState: build.mutation<CreateStateApiResponse, CreateStateApiArg>({
      query: (value) => ({
        url: "v1/states",
        method: "POST",
        data: _.pick(StateModel(value), stateEditableFields),
      }),
      invalidatesTags: [
        "States",
        "ShippingCompanies",
        "ShippingCompany",
        { type: "AuthPlaces", id: "states" },
      ],
    }),
    updateState: build.mutation<UpdateStateApiResponse, UpdateStateApiArg>({
      query: (value) => ({
        url: `v1/states/${value.id}`,
        method: "PATCH",
        data: _.pick(value, stateEditableFields),
      }),
      invalidatesTags: (_, __, value) => [
        "States",
        { type: "State", id: value.id },
        { type: "AuthPlaces", id: "states" },
        "Cities",
      ],
    }),
    removeState: build.mutation<RemoveStateApiResponse, RemoveStateApiArg>({
      query: (id) => ({ url: `v1/states/${id}`, method: "DELETE" }),
      invalidatesTags: (_, __, id) => [
        "States",
        { type: "State", id },
        { type: "ShipmentStates", id },
        "ShippingCompanies",
        "ShippingCompany",
        { type: "AuthPlaces", id: "states" },
        "Cities",
        { type: "AuthPlaces", id: "cities" },
      ],
    }),
    getShipmentStates: build.query<
      GetShipmentStatesApiResponse,
      GetShipmentStatesApiArg
    >({
      query: (stateId) => ({
        url: "v1/shipment-states",
        params: { stateId, page: 0, pageSize: 1000 },
      }),
      providesTags: (_, __, id) => [{ type: "ShipmentStates", id }],
    }),
    saveShipmentState: build.mutation<
      SaveShipmentStateApiResponse,
      SaveShipmentStateApiArg
    >({
      query: (row) => ({
        url:
          row.id || row._id
            ? `v1/shipment-states/${row.id || row._id}`
            : "v1/shipment-states",
        method: row.id || row._id ? "PATCH" : "POST",
        data: _.pick(row, ["stateId", "shippingCompanyId", "name", "isActive"]),
      }),
      invalidatesTags: (_, __, row) => [
        "States",
        { type: "ShipmentStates", id: row.stateId },
        "ShippingCompanies",
      ],
    }),
    setShipmentStateActive: build.mutation<
      SaveShipmentStateApiResponse,
      SaveShipmentStateApiArg
    >({
      query: (row) => ({
        url: `v1/shipment-states/${row.id || row._id}`,
        method: "PATCH",
        data: {
          isActive: row.isActive,
          ...(row.isActive ? { name: row.name } : {}),
        },
      }),
      invalidatesTags: (_, __, row) => [
        "States",
        { type: "ShipmentStates", id: row.stateId },
      ],
    }),
    removeShipmentState: build.mutation<
      RemoveShipmentStateApiResponse,
      RemoveShipmentStateApiArg
    >({
      query: (row) => ({
        url: `v1/shipment-states/${row.id || row._id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, row) => [
        "States",
        { type: "ShipmentStates", id: row.stateId },
      ],
    }),
  }),
  overrideExisting: false,
});
export default StatesApi;

export type GetStatesApiResponse = { results: IState[]; total: number };
export type GetStatesApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  shippingCompanyIdFilter?: string;
  countryIdFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
};
export type GetStateApiResponse = IState;
export type GetStateApiArg = string;
export type CreateStateApiResponse = IState;
export type CreateStateApiArg = PartialDeep<IState>;
export type UpdateStateApiResponse = IState;
export type UpdateStateApiArg = IState;
export type RemoveStateApiResponse = unknown;
export type RemoveStateApiArg = string;
export type GetShipmentStatesApiResponse = {
  results: IShipmentState[];
  total: number;
};
export type GetShipmentStatesApiArg = string;
export type SaveShipmentStateApiResponse = IShipmentState;
export type SaveShipmentStateApiArg = IShipmentState;
export type RemoveShipmentStateApiResponse = unknown;
export type RemoveShipmentStateApiArg = IShipmentState;

export const {
  useGetStatesQuery,
  useLazyGetStatesQuery,
  useGetStateQuery,
  useCreateStateMutation,
  useUpdateStateMutation,
  useRemoveStateMutation,
  useGetShipmentStatesQuery,
  useLazyGetShipmentStatesQuery,
  useSaveShipmentStateMutation,
  useSetShipmentStateActiveMutation,
  useRemoveShipmentStateMutation,
} = StatesApi;
export type StatesApiType = {
  [StatesApi.reducerPath]: ReturnType<typeof StatesApi.reducer>;
};
