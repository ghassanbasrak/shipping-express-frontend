import type { User } from "src/app/auth/user";
import IShipment from "../../shipments-app/models/IShipment";
import IAdmin from "../../admins-app/models/IAdmin";
export default interface IAffiliateTransaction {
  id?: string;
  _id?: string;
  userId?: string;
  user?: User;
  affiliateId?: string;
  affiliate?: User;
  shipmentId?: string;
  shipment?: IShipment;
  createdById?: string;
  createdBy?: IAdmin;
  type?: string;
  status?: string;
  amount?: number;
  notes?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
