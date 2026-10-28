import type { User } from "src/app/auth/user";
import IShipment from "../../shipments-app/models/IShipment";
export default interface ILog {
  id: string;
  _id?: string;
  message?: string;
  level?: string;
  modelName?: string;
  context?: string;
  type?: string;
  meta?: ILogMetadata;
  data?: ILogData;
  shipmentId?: string;
  shipment?: IShipment;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}
export interface ILogMetadata {
  userId?: string;
  user?: User;
  data?: ILogData | ILogData[];
  [key: string]: unknown;
}
// Logs hold historical snapshots, not editable copies of the live shipment.
export interface ILogData extends Partial<IShipment> {
  shipment?: IShipment;
  shipmentId?: string;
  senderPhoneCountry?: string;
  senderPhoneCountry1?: string;
  receiverPhoneCountry?: string;
  receiverPhoneCountry1?: string;
  [key: string]: unknown;
}
