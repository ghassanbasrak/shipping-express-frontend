import type { User } from "src/app/auth/user";
export default interface IMerchantStatistics {
  userId?: string;
  user?: User;
  localShipments?: IStatisticsShipments;
  internationalShipments?: IStatisticsShipments;
  codShipments?: IStatisticsShipments;
  codBalance?: IStatisticsCodBalance;
  userBalance?: IStatisticsUserBalance;
  messages?: IStatisticsMessage[];
}
export interface IStatisticsShipments {
  deliveredShipments?: IShipmentStatisticsAmount;
  processingShipments?: IShipmentStatisticsAmount;
  canceledShipments?: IShipmentStatisticsAmount;
  returnedShipments?: IShipmentStatisticsAmount;
  failedShipments?: IShipmentStatisticsAmount;
}
export interface IShipmentStatisticsAmount {
  count?: number;
  fees?: number;
}
export interface ICodStatisticsAmount {
  count?: number;
  total?: number;
}
export interface IStatisticsCodBalance {
  pending?: ICodStatisticsAmount;
  settled?: ICodStatisticsAmount;
  canceled?: ICodStatisticsAmount;
  block?: ICodStatisticsAmount;
  paid?: ICodStatisticsAmount;
}
export interface IStatisticsUserBalance {
  walletBalance?: number;
  codBalance?: number;
  eChargeAmount?: number;
  eChargeTaxAmount?: number;
  codChargeAmount?: number;
  codChargeTaxAmount?: number;
  BankTransferChargeAmount?: number;
  otherChargeAmount?: number;
}
export interface IStatisticsMessage {
  message?: string;
  note?: string;
}
