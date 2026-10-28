import type { User } from "src/app/auth/user";
import IAdmin from "../../admins-app/models/IAdmin";
import IShipment from "../../shipments-app/models/IShipment";
export default interface IMerchantDue {
  id: string;
  shipmentId?: string;
  shipment?: IShipment;
  userId?: string;
  user?: User;
  updatedById?: string;
  updatedBy?: IAdmin;
  codPrice?: number;
  codStatus?: string;
  relatedRequestId?: string;
  reference?: string;
  createdAt?: string;
  updatedAt?: string;
}
