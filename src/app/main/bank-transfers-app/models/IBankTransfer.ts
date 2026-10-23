import type { User } from "src/app/auth/user";
import IAdmin from "../../admins-app/models/IAdmin";
import IPlan from "../../plans-app/models/IPlan";
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
  paymentPlanId?: string;
  paymentPlan?: IPlan;
  bank?: string;
  description?: string;
  notes?: string;
  transactionReference?: string;
  transactionDescription?: string;
  transactionImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
