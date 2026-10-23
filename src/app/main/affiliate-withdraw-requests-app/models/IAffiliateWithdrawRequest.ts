import type { User } from "src/app/auth/user";
import IAdmin from "../../admins-app/models/IAdmin";
export default interface IAffiliateWithdrawRequest {
  id: string;
  _id?: string;
  type: string;
  status: string;
  amount: number;
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
