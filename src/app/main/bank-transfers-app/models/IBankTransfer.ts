import type { User } from "src/app/auth/user";
import IAdmin from "../../admins-app/models/IAdmin";
export default interface IBankTransfer {
  id: string;
  _id?: string;
  type: string;
  status: string;
  amount: number;
  userId?: string;
  user?: User;
  updatedById?: string;
  updatedBy?: IAdmin;
  bank?: string;
  description?: string;
  notes?: string;
  transactionReference?: string;
  transactionDescription?: string;
  transactionImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
