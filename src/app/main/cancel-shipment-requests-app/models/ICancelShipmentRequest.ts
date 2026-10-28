import type { User } from "src/app/auth/user";
import IAdmin from "../../admins-app/models/IAdmin";
import IShipment from "../../shipments-app/models/IShipment";
export default interface ICancelShipmentRequest {
  id: string;
  _id?: string;
  type?: string;
  status?: string;
  userId?: string;
  user?: User;
  updatedById?: string;
  updatedBy?: IAdmin;
  shipmentId?: string;
  shipment?: IShipment;
  createdAt?: string;
  updatedAt?: string;
}
