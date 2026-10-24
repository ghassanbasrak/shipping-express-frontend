import _ from "@lodash";
import { PartialDeep } from "type-fest";
import ITransaction from "./ITransaction";
const TransactionModel = (data: PartialDeep<ITransaction> = {}): ITransaction =>
  _.defaultsDeep({}, data, {
    userId: "",
    user: null,
    type: "deposit",
    relatedBalance: "wallet",
    operationType: "custom",
    amount: 0,
    notes: "",
    applyTax: !data.id,
  });
export const transactionEditableFields = [
  "type",
  "relatedBalance",
  "operationType",
  "amount",
  "notes",
  "userId",
  "applyTax",
];
export default TransactionModel;
