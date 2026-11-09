import type { User } from "src/app/auth/user";
import type IStoragePlan from "./IStoragePlan";
import type ITopupRequest from "../../topup-requests-app/models/ITopupRequest";
export default interface IStorageSubscription {
  id: string;
  userId: string;
  user?: User;
  planId: string;
  plan?: IStoragePlan;
  paymentId: string;
  payment?: ITopupRequest;
  status: "active" | "expired" | "cancelled";
  price: number;
  startsAt: string;
  endsAt: string;
  createdAt?: string;
  updatedAt?: string;
}
