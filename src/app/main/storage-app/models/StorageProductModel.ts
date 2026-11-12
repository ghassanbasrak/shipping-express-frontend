import type IStorageProduct from "./IStorageProduct";
export default function StorageProductModel(value?: IStorageProduct) {
  return {
    userId: value?.userId || "",
    warehouseId: value?.warehouseId || "",
    name: value?.name || "",
    sku: value?.sku || "",
    quantity: value?.quantity ?? 0,
    unitPrice: value?.unitPrice ?? 0,
    storageType: value?.storageType || "",
  };
}
