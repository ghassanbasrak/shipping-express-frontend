import { statisticsRequest } from "../merchant-statistics-app/Utils";
import type { MerchantStatisticsForm } from "./models/MerchantStatisticsSchema";
export const statisticsNewRequest = (values: MerchantStatisticsForm) => ({
  ...statisticsRequest(values),
  bankTransferTotals: values.bankTransferTotals,
  otherFees: values.otherFees,
});
export const shipmentStatisticRows = [
  ["deliveredShipments", "DELIVERED_SHIPMENTS"],
  ["processingShipments", "PROCESSING_SHIPMENTS"],
  ["canceledShipments", "CANCELED_SHIPMENTS"],
  ["returnedShipments", "RETURNED_SHIPMENTS"],
  ["failedShipments", "FAILED_SHIPMENTS"],
] as const;
export const codBalanceRows = [
  ["pending", "PENDING"],
  ["settled", "SETTLED"],
  ["canceled", "CANCELED"],
  ["block", "BLOCK"],
  ["paid", "PAID"],
] as const;
export const userBalanceRows = [
  ["walletBalance", "WALLET_BALANCE"],
  ["codBalance", "CASH_ON_DELIVERY_BALANCE"],
  ["eChargeAmount", "E_CHARGE_AMOUNT"],
  ["eChargeTaxAmount", "E_CHARGE_TAX_AMOUNT"],
  ["codChargeAmount", "COD_CHARGE_AMOUNT"],
  ["codChargeTaxAmount", "COD_CHARGE_TAX_AMOUNT"],
  ["BankTransferChargeAmount", "BANK_TRANSFER_CHARGE_AMOUNT"],
  ["otherChargeAmount", "OTHER_CHARGE_AMOUNT"],
] as const;
