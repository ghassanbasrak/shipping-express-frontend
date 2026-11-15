import { supplyStatuses, type StorageType, type SupplyStatus } from "./Utils";
import { apiService as api } from "app/store/apiService";
import type IWarehouse from "./models/IWarehouse";
import type { IWarehousePickup } from "./models/IWarehouse";
import type IStoragePlan from "./models/IStoragePlan";
import type ISupplyRequest from "./models/ISupplyRequest";
import type IStorageProduct from "./models/IStorageProduct";
export const addTagTypes = [
  "StorageWarehouses",
  "StoragePlans",
  "StorageSubscription",
  "StorageSupplies",
  "StorageProducts",
  "Payments",
  "Payment",
  "PaymentsUser",
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
    updateStorageProduct: build.mutation<
      IStorageProduct,
      { id: string; data: UpdateStorageProductArg }
    >({
      query: ({ id, data }) => ({
        url: `v1/storage/products/admin/${id}`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: [
        "StorageProducts",
        "StorageWarehouses",
        "StorageSupplies",
      ],
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
      {
        warehouseId?: string;
        userId: string;
        admin?: boolean;
        includeEmpty?: boolean;
      }
    >({
      query: ({ warehouseId, admin, includeEmpty }) => ({
        url: admin ? "v1/storage/products/admin" : "v1/storage/products",
        params: {
          ...(warehouseId ? { warehouseId } : {}),
          ...(includeEmpty ? { includeEmpty: true } : {}),
        },
      }),
      providesTags: ["StorageProducts"],
    }),
  }),
});
export type WarehouseSaveArg = {
  name: string;
  storageTypes: StorageType[];
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
  storageTypes: StorageType[];
  isActive: boolean;
};
export type CreateSupplyArg = {
  warehouseId: string;
  products: (
    | { warehouseProductId: string; quantity: number; unitPrice?: number }
    | {
        name: string;
        sku?: string;
        quantity: number;
        notes?: string;
        unitPrice: number;
        storageType: StorageType;
      }
  )[];
};
export type UpdateStorageProductArg = {
  userId: string;
  warehouseId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  storageType: StorageType;
};
export type ReviewSupplyArg = {
  id: string;
  status: Exclude<SupplyStatus, typeof supplyStatuses.pending>;
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
  useGetSupplyRequestsQuery,
  useCreateSupplyRequestMutation,
  useReviewSupplyRequestMutation,
  useUpdateStorageProductMutation,
  useGetStorageProductsQuery,
  useLazyGetStorageProductsQuery,
} = StorageApi;
export default StorageApi;
