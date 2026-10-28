import ITransaction from "../../transactions-app/models/ITransaction";
export default interface IBalanceError extends Partial<ITransaction> {
  _id?: string;
  transactionNumber?: string;
  hasRepeatedBalance?: boolean;
}
