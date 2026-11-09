import { apiService as api } from "app/store/apiService";
import type IWarehouse from "./models/IWarehouse";
import type { IWarehousePickup } from "./models/IWarehouse";
import type IStoragePlan from "./models/IStoragePlan";
import type IStorageSubscription from "./models/IStorageSubscription";
import type ISupplyRequest from "./models/ISupplyRequest";
import type IStorageProduct from "./models/IStorageProduct";
export const addTagTypes = [
  "StorageWarehouses",
  "StoragePlans",
  "StorageSubscription",
  "StorageSupplies",
  "StorageProducts",
] as const;
const StorageApi = api.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: (build) => ({
    getWarehouses: build.query<IWarehouse[], { admin?: boolean }>({
      query: ({ admin }) => ({
        url: admin ? "v1/warehouses/admin" : "v1/warehouses",
      }),
      providesTags: ["StorageWarehouses"],
    }),
    createWarehouse: build.mutation<IWarehouse, WarehouseSaveArg>({
      query: (data) => ({ url: "v1/warehouses", method: "POST", data }),
      invalidatesTags: ["StorageWarehouses"],
    }),
    updateWarehouse: build.mutation<
      IWarehouse,
      { id: string; data: WarehouseSaveArg }
    >({
      query: ({ id, data }) => ({
        url: `v1/warehouses/${id}`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: ["StorageWarehouses"],
    }),
    getStoragePlans: build.query<IStoragePlan[], { admin?: boolean }>({
      query: ({ admin }) => ({
        url: admin ? "v1/storage/plans/admin" : "v1/storage/plans",
      }),
      providesTags: ["StoragePlans"],
    }),
    getStoragePlan: build.query<IStoragePlan, string>({
      query: (id) => ({ url: `v1/storage/plans/${id}` }),
      providesTags: ["StoragePlans"],
    }),
    createStoragePlan: build.mutation<IStoragePlan, StoragePlanSaveArg>({
      query: (data) => ({ url: "v1/storage/plans", method: "POST", data }),
      invalidatesTags: ["StoragePlans"],
    }),
    updateStoragePlan: build.mutation<
      IStoragePlan,
      { id: string; data: StoragePlanSaveArg }
    >({
      query: ({ id, data }) => ({
        url: `v1/storage/plans/${id}`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: ["StoragePlans"],
    }),
    getStorageSubscription: build.query<IStorageSubscription | null, string>({
      query: () => ({ url: "v1/storage/subscriptions/current" }),
      providesTags: (_, __, id) => [{ type: "StorageSubscription", id }],
    }),
    subscribeStorage: build.mutation<
      StorageCheckoutResponse,
      { planId: string }
    >({
      query: (data) => ({
        url: "v1/storage/subscriptions/checkout",
        method: "POST",
        data,
      }),
      invalidatesTags: ["StorageSubscription"],
    }),
    verifyStoragePayment: build.mutation<
      StoragePaymentResponse,
      { paymentId: string; moyasarPaymentId: string }
    >({
      query: ({ paymentId, moyasarPaymentId }) => ({
        url: `v1/payments/${paymentId}/check-status`,
        method: "POST",
        data: { moyasarPaymentId },
      }),
      invalidatesTags: ["StorageSubscription"],
    }),
    getSupplyRequests: build.query<
      ISupplyRequest[],
      { admin?: boolean; userId?: string }
    >({
      query: ({ admin }) => ({
        url: admin
          ? "v1/storage/supply-requests/admin"
          : "v1/storage/supply-requests",
      }),
      providesTags: ["StorageSupplies"],
    }),
    createSupplyRequest: build.mutation<ISupplyRequest, CreateSupplyArg>({
      query: (data) => ({
        url: "v1/storage/supply-requests",
        method: "POST",
        data,
      }),
      invalidatesTags: ["StorageSupplies"],
    }),
    reviewSupplyRequest: build.mutation<ISupplyRequest, ReviewSupplyArg>({
      query: ({ id, status }) => ({
        url: `v1/storage/supply-requests/admin/${id}/status`,
        method: "PATCH",
        data: { status },
      }),
      invalidatesTags: ["StorageSupplies", "StorageProducts"],
    }),
    getStorageProducts: build.query<
      IStorageProduct[],
      { warehouseId?: string; userId: string }
    >({
      query: ({ warehouseId }) => ({
        url: "v1/storage/products",
        params: warehouseId ? { warehouseId } : undefined,
      }),
      providesTags: ["StorageProducts"],
    }),
  }),
});
export type WarehouseSaveArg = {
  name: string;
  address: string;
  mapAddress?: string;
  information?: string;
  pickup: IWarehousePickup;
};
export type StoragePlanSaveArg = {
  name: string;
  price: number;
  discountPrice?: number;
  durationDays: number;
  features: string[];
  isActive: boolean;
};
export type CreateSupplyArg = {
  warehouseId: string;
  products: {
    name: string;
    sku?: string;
    quantity: number;
    notes?: string;
    unitPrice: number;
    storageType: string;
  }[];
};
export type ReviewSupplyArg = {
  id: string;
  status: "approved" | "received" | "rejected";
};
export type StoragePaymentResponse = {
  id: string;
  userId: string;
  storagePlanId?: string;
  amount: number;
  taxTotal: number;
  total: number;
  status: "pending" | "success" | "failed";
};
export type StorageCheckoutResponse = {
  payment: StoragePaymentResponse;
  checkout: {
    publishable_api_key: string;
    amount: number;
    currency: "SAR";
    description: string;
    callback_url: string;
    methods: ["creditcard"];
  } | null;
  subscription?: IStorageSubscription;
};
export const {
  useGetWarehousesQuery,
  useLazyGetWarehousesQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useGetStoragePlansQuery,
  useGetStoragePlanQuery,
  useLazyGetStoragePlanQuery,
  useCreateStoragePlanMutation,
  useUpdateStoragePlanMutation,
  useGetStorageSubscriptionQuery,
  useLazyGetStorageSubscriptionQuery,
  useSubscribeStorageMutation,
  useVerifyStoragePaymentMutation,
  useGetSupplyRequestsQuery,
  useCreateSupplyRequestMutation,
  useReviewSupplyRequestMutation,
  useGetStorageProductsQuery,
  useLazyGetStorageProductsQuery,
} = StorageApi;
export default StorageApi;
