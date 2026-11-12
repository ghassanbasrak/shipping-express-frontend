import type { User } from "src/app/auth/user";
import type { PaymentType, PaymentMethodType } from "../Utils";
export default interface IPayment {
  id: string;
  _id?: string;
  userId?: string;
  user?: User;
  type: PaymentType;
  status: string;
  hookStatus?: string;
  amount: number;
  total?: number;
  feeTotal?: number;
  taxTotal?: number;
  notes?: string;
  transactionId?: string;
  reference?: string;
  responseStatus?: string;
  responseMessage?: string;
  code?: string;
  platform?: string;
  paymentMethodId?: string;
  paymentMethodType?: PaymentMethodType | null;
  isPlan?: boolean;
  storagePlanId?: string;
  metadata?: IPaymentMetadata;
  zohoCreditId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPaymentMetadata {
  gateway?: string;
  balanceUpdateFailed?: boolean;
  [key: string]: unknown;
}
