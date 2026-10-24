import type { User } from "src/app/auth/user";
import IAdmin from "../../admins-app/models/IAdmin";
import { LocaleString } from "src/app/main/utils/commonTypes";
export default interface ITransaction {
  id: string;
  reference?: string;
  userId?: string;
  user?: User;
  createdById?: string;
  createdBy?: IAdmin;
  updatedById?: string;
  updatedBy?: IAdmin;
  type?: string;
  relatedBalance?: string;
  operationType?: string;
  title?: LocaleString | string;
  description?: LocaleString | string;
  notes?: string;
  amount?: number;
  previousBalance?: number;
  currentBalance?: number;
  applyTax?: boolean;
  taxable?: boolean;
  invoiceId?: string;
  invoice?: ITransactionInvoice;
  invoiceUrl?: string;
  zohoCreditId?: string;
  zohoJournalId?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface ITransactionInvoice {
  id?: string;
  url?: string;
  zohoInvoiceId?: string;
}
