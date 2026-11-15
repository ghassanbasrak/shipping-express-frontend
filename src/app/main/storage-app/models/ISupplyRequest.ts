import type { StorageType, SupplyStatus } from "../Utils";
import type { User } from "src/app/auth/user";
import type IWarehouse from "./IWarehouse";
export default interface ISupplyRequest {
  id: string;
  userId: string;
  user?: User;
  warehouseId: string;
  warehouse?: IWarehouse;
  status: SupplyStatus;
  products: ISupplyRequestProduct[];
  createdAt?: string;
  updatedAt?: string;
}
export interface ISupplyRequestProduct {
  warehouseProductId?: string;
  name: string;
  sku?: string;
  quantity: number;
  notes?: string;
  unitPrice: number;
  storageType: StorageType;
}
