import type { StorageSubscriptionStatus } from "../Utils";
import type { User } from "src/app/auth/user";
import type IStoragePlan from "../../storage-app/models/IStoragePlan";
import type IPayment from "../../payments-app/models/IPayment";
export default interface IStorageSubscription {
  id: string;
  userId: string;
  user?: User;
  planId: string;
  plan?: IStoragePlan;
  paymentId: string;
  payment?: IPayment;
  status: StorageSubscriptionStatus;
  price: number;
  startsAt: string;
  endsAt: string;
  createdAt?: string;
  updatedAt?: string;
}
