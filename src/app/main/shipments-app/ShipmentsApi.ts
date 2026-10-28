import { apiService as api } from "app/store/apiService";
import IShipment, { IShipmentPrice } from "./models/IShipment";
import IShippingCompany from "../shipping-companies-app/models/IShippingCompany";
import ICoupon from "../coupons-app/models/ICoupon";
import ITransaction from "../transactions-app/models/ITransaction";
import type { User } from "src/app/auth/user";
export const addTagTypes = [
  "Shipments",
  "Shipment",
  "ShipmentSummary",
  "ShipmentAccount",
  "CancelShipmentRequests",
] as const;
const ShipmentsApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getShipments: build.query<GetShipmentsApiResponse, GetShipmentsApiArg>({
      query: (filters) => ({
        url: "v1/shipments",
        params: {
          page: filters.page,
          pageSize: filters.pageSize,
          ...(filters.searchText ? { search: filters.searchText } : {}),
          ...(filters.shippingTypeFilter && filters.shippingTypeFilter !== "all"
            ? filters.shippingTypeFilter === "cashOnDelivery"
              ? { isCod: true }
              : { method: filters.shippingTypeFilter, isCod: false }
            : {}),
          ...(filters.shippingCompanyIdFilter &&
          filters.shippingCompanyIdFilter !== "all"
            ? { shippingCompanyId: filters.shippingCompanyIdFilter }
            : {}),
          ...(filters.isReturnedFilter && filters.isReturnedFilter !== "all"
            ? { isReturned: filters.isReturnedFilter }
            : {}),
          ...(filters.shipmentTypeFilter && filters.shipmentTypeFilter !== "all"
            ? { type: filters.shipmentTypeFilter }
            : {}),
          ...(filters.statusFilters?.length
            ? { status: filters.statusFilters }
            : {}),
          ...(filters.paymentStatusFilter?.length
            ? { codStatus: filters.paymentStatusFilter }
            : {}),
          ...(filters.merchantIdFilter && filters.merchantIdFilter !== "all"
            ? { userId: filters.merchantIdFilter }
            : {}),
          ...(filters.updatedByIdFilter
            ? { updatedById: filters.updatedByIdFilter }
            : {}),
          ...(filters.senderIdFilter
            ? { senderId: filters.senderIdFilter }
            : {}),
          ...(filters.receiverIdFilter
            ? { receiverId: filters.receiverIdFilter }
            : {}),
          ...(filters.closedInvoiceFilter &&
          filters.closedInvoiceFilter !== "all"
            ? { closedInvoice: filters.closedInvoiceFilter }
            : {}),
          ...(filters.dateFromFilter
            ? { dateFrom: filters.dateFromFilter }
            : {}),
          ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
        },
        paramsSerializer: { indexes: null },
      }),
      providesTags: ["Shipments"],
    }),
    getShipment: build.query<IShipment, string>({
      query: (id) => ({ url: `v1/shipments/${id}` }),
      providesTags: (_, __, id) => [{ type: "Shipment", id }],
    }),
    getShipmentsSummary: build.query<
      GetShipmentsSummaryApiResponse,
      string | void
    >({
      query: (userId) => ({
        url: "v1/shipments/shipment/summary",
        params: userId && userId !== "all" ? { userId } : {},
      }),
      providesTags: ["ShipmentSummary"],
    }),
    getShipmentCarriers: build.query<
      { results: IShippingCompany[]; total: number },
      void
    >({
      query: () => ({
        url: "v1/shipping-companies",
        params: { page: 0, pageSize: 50 },
      }),
    }),
    getShipmentAccount: build.query<User, string>({
      query: (id) => ({ url: `v1/users/${id}` }),
      providesTags: (_, __, id) => [{ type: "ShipmentAccount", id }],
    }),
    reviewShipment: build.mutation<IShipmentPrice, CreateShipmentApiArg>({
      query: (data) => ({ url: "v1/shipments/review", method: "POST", data }),
    }),
    createShipment: build.mutation<
      CreateShipmentApiResponse,
      CreateShipmentApiArg
    >({
      query: (data) => ({ url: "v1/shipments", method: "POST", data }),
      invalidatesTags: (_, error) =>
        error ? [] : ["Shipments", "ShipmentSummary", "ShipmentAccount"],
    }),
    setShipmentStatus: build.mutation<
      IShipment,
      { id: string; status: string }
    >({
      query: (value) => ({
        url: `v1/shipments/${value.id}`,
        method: "PATCH",
        data: { status: value.status },
      }),
      invalidatesTags: (_, error, value) =>
        error
          ? []
          : [
              "Shipments",
              "ShipmentSummary",
              { type: "Shipment", id: value.id },
              "ShipmentAccount",
            ],
    }),
    attachShipmentInvoice: build.mutation<
      IShipment,
      { id: string; closeInvoiceNumber: string }
    >({
      query: (value) => ({
        url: `v1/shipments/${value.id}`,
        method: "PATCH",
        data: { closeInvoiceNumber: value.closeInvoiceNumber },
      }),
      invalidatesTags: (_, error, value) =>
        error ? [] : ["Shipments", { type: "Shipment", id: value.id }],
    }),
    reviewShipmentExtraWeight: build.mutation<
      { extraWeightPrice?: number },
      { id: string; weight: number }
    >({
      query: (value) => ({
        url: `v1/shipments/${value.id}/review-extra-weight-price`,
        method: "PATCH",
        data: { weight: value.weight },
      }),
    }),
    deductShipmentExtraWeight: build.mutation<
      IShipment,
      { id: string; weight: number; extraWeightPrice: number }
    >({
      query: (value) => ({
        url: `v1/shipments/${value.id}/deduct-extra-weight-price`,
        method: "PATCH",
        data: {
          weight: value.weight,
          extraWeightPrice: value.extraWeightPrice,
        },
      }),
      invalidatesTags: (_, error, value) =>
        error
          ? []
          : [
              "Shipments",
              { type: "Shipment", id: value.id },
              "ShipmentAccount",
            ],
    }),
    requestShipmentCancellation: build.mutation<
      { id: string },
      { shipmentId: string; userId: string }
    >({
      query: (value) => ({
        url: "v1/requests",
        method: "POST",
        data: {
          type: "cancelShipment",
          status: "pending",
          shipmentId: value.shipmentId,
          userId: value.userId,
        },
      }),
      invalidatesTags: (_, error, value) =>
        error
          ? []
          : [
              "CancelShipmentRequests",
              "Shipments",
              { type: "Shipment", id: value.shipmentId },
            ],
    }),
    settleShipmentCod: build.mutation<unknown, string>({
      query: (id) => ({
        url: `v1/shipment-cods/${id}`,
        method: "PATCH",
        data: { codStatus: "paid" },
      }),
      invalidatesTags: (_, error) =>
        error
          ? []
          : ["Shipments", "Shipment", "ShipmentAccount", "ShipmentSummary"],
    }),
    syncShipmentTracking: build.mutation<unknown, string>({
      query: (id) => ({ url: `v1/shipments/shipment/tracking/${id}` }),
      invalidatesTags: (_, error, id) =>
        error ? [] : ["Shipments", { type: "Shipment", id }],
    }),
    getShipmentLabel: build.query<
      { labelUrl?: string },
      { shipmentId: string; trackingNumber: string }
    >({ query: (params) => ({ url: "v1/shipments/shipment/label", params }) }),
    getShipmentCoupons: build.query<{ results: ICoupon[] }, string>({
      query: (code) => ({ url: "v1/coupons", params: { code } }),
    }),
    getShipmentTransactions: build.query<
      { results: ITransaction[]; total: number },
      { trackingNumber: string; userId: string }
    >({
      query: (value) => ({
        url: "v1/transactions",
        params: {
          page: 0,
          pageSize: 100,
          ...(value.trackingNumber ? { search: value.trackingNumber } : {}),
          ...(value.userId ? { userId: value.userId } : {}),
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export type GetShipmentsApiResponse = { results: IShipment[]; total: number };
export type GetShipmentsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  shippingCompanyIdFilter?: string;
  shippingTypeFilter?: string;
  shipmentTypeFilter?: string;
  isReturnedFilter?: string;
  statusFilters?: string[];
  paymentStatusFilter?: string[];
  merchantIdFilter?: string;
  updatedByIdFilter?: string;
  senderIdFilter?: string;
  receiverIdFilter?: string;
  closedInvoiceFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
};
export type GetShipmentsSummaryApiResponse = {
  shippingCompanyAnalyticData?: IShipmentAnalyticValue[];
  methodAnalyticData?: IShipmentAnalyticValue[];
  userAnalyticData?: IShipmentAnalyticValue[];
};
export type IShipmentAnalyticValue = {
  value: number;
  label: string;
  color?: string;
};
export type CreateShipmentApiArg = {
  shippingCompanyId: string;
  method: string;
  type: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  packagesCount: number;
  description: string;
  isCommercial: boolean;
  isCod: boolean;
  codPrice?: number;
  senderId?: string;
  receiverId?: string;
  couponCode?: string;
  couponCodeId?: string;
  imageUrl?: string;
  products?: { title: string; price: number }[];
  returnedFromShipmentId?: string;
  orderReturned?: boolean;
  userId?: string;
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
  senderPhone1?: string;
  senderCountryId?: string;
  senderCountryName?: string;
  senderCountryCode?: string;
  senderStateId?: string;
  senderStateName?: string;
  senderCityId?: string;
  senderCityName?: string;
  senderStreet?: string;
  senderZipCode?: string;
  receiverName?: string;
  receiverEmail?: string;
  receiverPhone?: string;
  receiverPhone1?: string;
  receiverCountryId?: string;
  receiverCountryName?: string;
  receiverCountryCode?: string;
  receiverStateId?: string;
  receiverStateName?: string;
  receiverCityId?: string;
  receiverCityName?: string;
  receiverStreet?: string;
  receiverZipCode?: string;
};
export type CreateShipmentApiResponse = IShipment | { message: string };
export const {
  useGetShipmentsQuery,
  useLazyGetShipmentsQuery,
  useGetShipmentQuery,
  useLazyGetShipmentQuery,
  useGetShipmentsSummaryQuery,
  useGetShipmentCarriersQuery,
  useGetShipmentAccountQuery,
  useReviewShipmentMutation,
  useCreateShipmentMutation,
  useSetShipmentStatusMutation,
  useAttachShipmentInvoiceMutation,
  useReviewShipmentExtraWeightMutation,
  useDeductShipmentExtraWeightMutation,
  useRequestShipmentCancellationMutation,
  useSettleShipmentCodMutation,
  useSyncShipmentTrackingMutation,
  useLazyGetShipmentLabelQuery,
  useLazyGetShipmentCouponsQuery,
  useGetShipmentTransactionsQuery,
} = ShipmentsApi;
export default ShipmentsApi;
