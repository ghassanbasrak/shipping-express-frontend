import type { User } from "src/app/auth/user";
import IAdmin from "../../admins-app/models/IAdmin";
import IShipment from "../../shipments-app/models/IShipment";
export default interface IWithdrawRequest {
  id: string;
  _id?: string;
  type: string;
  status: string;
  amount: number;
  shipmentIds?: string[];
  shipments?: IShipment[];
  description?: string;
  userId?: string;
  user?: User;
  updatedById?: string;
  updatedBy?: IAdmin;
  bank?: string;
  transactionReference?: string;
  transactionDescription?: string;
  transactionImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
