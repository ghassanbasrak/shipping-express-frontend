import type { User } from "src/app/auth/user";
import type IWarehouse from "./IWarehouse";
export default interface ISupplyRequest {
  id: string;
  userId: string;
  user?: User;
  warehouseId: string;
  warehouse?: IWarehouse;
  status: "pending" | "approved" | "received" | "rejected";
  products: ISupplyRequestProduct[];
  createdAt?: string;
  updatedAt?: string;
}
export interface ISupplyRequestProduct {
  name: string;
  sku?: string;
  quantity: number;
  notes?: string;
  unitPrice: number;
  storageType: string;
}
