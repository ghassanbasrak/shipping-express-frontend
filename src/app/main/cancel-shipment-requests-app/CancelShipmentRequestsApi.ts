import { apiService as api } from "app/store/apiService";
import type { User } from "src/app/auth/user";
import type IAdmin from "../admins-app/models/IAdmin";

export const addTagTypes = [
  "CancelShipmentRequests",
  "Shipments",
  "Shipment",
  "ShipmentSummary",
  "ShipmentAccount",
  "Transactions",
  "MerchantDues",
  "MerchantDuesSummary",
] as const;

const CancelShipmentRequestsApi = api
  .enhanceEndpoints({ addTagTypes })
  .injectEndpoints({
    endpoints: (build) => ({
      getCancelShipmentRequests: build.query<
        GetCancelShipmentRequestsApiResponse,
        GetCancelShipmentRequestsApiArg
      >({
        query: (filters) => ({
          url: "v1/requests",
          params: {
            page: filters.page,
            pageSize: filters.pageSize,
            type: "cancelShipment",
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
            ...(filters.dateFromFilter ? { dateFrom: filters.dateFromFilter } : {}),
            ...(filters.dateToFilter ? { dateTo: filters.dateToFilter } : {}),
          },
        }),
        providesTags: ["CancelShipmentRequests"],
      }),
      getCancelShipmentRequestsUser: build.query<User, string>({
        query: (id) => ({ url: `v1/users/${id}` }),
      }),
      setCancelShipmentRequestStatus: build.mutation<
        CancelShipmentRequestPreview,
        SetCancelShipmentRequestStatusApiArg
      >({
        query: (value) => ({
          url: `v1/requests/${value.id}`,
          method: "PATCH",
          data: { status: value.status },
        }),
        invalidatesTags: (_, error, value) =>
          error
            ? []
            : [
                "CancelShipmentRequests",
                "Shipments",
                "ShipmentSummary",
                "ShipmentAccount",
                "Transactions",
                "MerchantDues",
                "MerchantDuesSummary",
                ...(value.shipmentId
                  ? [{ type: "Shipment" as const, id: value.shipmentId }]
                  : []),
              ],
      }),
    }),
    overrideExisting: false,
  });

// Read-only API projections until shipments-app owns the full shipment entity.
export type CancellationShipmentPreview = {
  id: string;
  trackingNumber?: string;
  trackingUrl?: string;
};
export type CancelShipmentRequestPreview = {
  id: string;
  type?: string;
  status?: string;
  userId?: string;
  user?: User;
  updatedById?: string;
  updatedBy?: IAdmin;
  shipmentId?: string;
  shipment?: CancellationShipmentPreview;
  createdAt?: string;
  updatedAt?: string;
};
export type GetCancelShipmentRequestsApiResponse = {
  results: CancelShipmentRequestPreview[];
  total: number;
};
export type GetCancelShipmentRequestsApiArg = {
  page: number;
  pageSize: number;
  searchText?: string;
  statusFilter?: string;
  userIdFilter?: string;
  updatedByIdFilter?: string;
  dateFromFilter?: string;
  dateToFilter?: string;
};
export type SetCancelShipmentRequestStatusApiArg = {
  id: string;
  status: "approved" | "rejected";
  shipmentId?: string;
};
export const {
  useGetCancelShipmentRequestsQuery,
  useLazyGetCancelShipmentRequestsQuery,
  useGetCancelShipmentRequestsUserQuery,
  useSetCancelShipmentRequestStatusMutation,
} = CancelShipmentRequestsApi;
export default CancelShipmentRequestsApi;
