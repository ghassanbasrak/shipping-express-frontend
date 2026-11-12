import type { StorageType } from "../Utils";
import type { User } from "src/app/auth/user";
import type IWarehouse from "./IWarehouse";
export default interface IStorageProduct {
  id: string;
  userId: string;
  user?: User;
  warehouseId: string;
  warehouse?: IWarehouse;
  name: string;
  sku?: string;
  quantity: number;
  storageType: StorageType;
  unitPrice: number;
  createdAt?: string;
  updatedAt?: string;
}
