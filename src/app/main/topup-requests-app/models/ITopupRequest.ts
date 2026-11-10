import type { User } from "src/app/auth/user";
export default interface ITopupRequest {
  id: string;
  _id?: string;
  userId?: string;
  user?: User;
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
  paymentMethodType?: string;
  isPlan?: boolean;
  storagePlanId?: string;
  metadata?: ITopupPaymentMetadata;
  zohoCreditId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITopupPaymentMetadata {
  gateway?: string;
  balanceUpdateFailed?: boolean;
  [key: string]: unknown;
}
