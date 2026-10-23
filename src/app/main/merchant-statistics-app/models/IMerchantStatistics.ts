import type { User } from "src/app/auth/user";
export default interface IMerchantStatistics {
  userId?: string;
  user?: User;
  financialAssets?: IFinancialAssets;
  currentObligations?: ICurrentObligations;
  bankTransfer?: IStatisticsBankTransfer;
  codObligations?: ICodObligations;
}
export interface IFinancialAssets {
  total?: number;
  shipments?: number;
  codShipments?: number;
  extraWeight?: number;
  updateByAdministrator?: number;
  bankTransferFees?: number;
  others?: number;
}
export interface ICurrentObligations {
  planBalance?: number;
  balanceCharge?: number;
  canceledShipments?: number;
  codBalance?: number;
  others?: number;
}
export interface IStatisticsBankTransfer {
  total?: number;
  cod?: number;
  others?: number;
}
export interface ICodObligations {
  total?: number;
  block?: number;
  pending?: number;
  paid?: number;
}
