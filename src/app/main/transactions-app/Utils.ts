import type { User } from "src/app/auth/user";
import type { Operation } from "src/app/auth/permissions";
import { hasOperationPermission } from "src/app/auth/permissions";
import { TFunction } from "i18next";
import ITransaction from "./models/ITransaction";
import { displayName } from "../countries-app/Utils";

export const transactionTypes = {
  deposit: "deposit",
  withdraw: "withdraw",
} as const;

export const relatedBalanceTypes = { wallet: "wallet", cod: "cod" } as const;

export const addTransactionTypes = {
  deposit: "deposit",
  withdraw: "withdraw",
  reset: "reset",
} as const;

export const affiliateTransactionStatus = {
  pending: "pending",
  success: "success",
  rejected: "rejected",
} as const;

export const depositTransactionTypes = {
  custom: "custom",
  bankTransferRajhi: "bankTransferRajhi",
  bankTransferAhli: "bankTransferAhli",
  bankTransferStc: "bankTransferStc",
  box: "box",
} as const;

export const withdrawTransactionTypes = {
  custom: "custom",
  visaFees: "visaFees",
  transactionError: "transactionError",
} as const;

export const transactionTitleTypes = {
  extraWeightFees: "shipment extra weight fees",
  returnedShipment: "returned shipment fees",
  codPayment: "cod shipment payment",
  balanceTopUp: "top-up balance",
  withdrawRequest: "withdrew request",
  withdrawRequestRejected: "rejected withdrew request",
  bankTransfer: "bank transfer",
  settlementOfDues: "settlement of financial dues",
  newShipment: "new shipment",
  reactivateCanceled: "re activate canceled",
  canceledShipmentBalance: "canceled shipment balance",
  balanceUpdate: "balance update",
  bagsRequest: "bags request",
} as const;
const transactionTypeTitles: Record<string, string> = {
  deposit: "DEPOSIT",
  withdraw: "WITHDRAW",
};
export const toTransactionTypeTitle = (value: string) =>
  transactionTypeTitles[value] || "UNKNOWN";
export const toTransactionTypeColor = (value: string) =>
  (
    ({
      deposit: "bg-green-400",
      withdraw: "bg-red-400",
      reset: "bg-amber-600",
      pending: "bg-blue-500",
      success: "bg-green-500",
      rejected: "bg-red-500",
      wallet: "bg-blue-500",
      cod: "bg-green-500",
    }) as Record<string, string>
  )[value] || "bg-blue-500";
const relatedBalanceTypeTitles: Record<string, string> = {
  wallet: "WALLET_BALANCE",
  cod: "COD_BALANCE",
};
export const toRelatedBalanceTypeTitle = (value: string) =>
  relatedBalanceTypeTitles[value] || "UNKNOWN";
export const toRelatedBalanceTypeColor = (value: string) =>
  (
    ({
      deposit: "bg-green-400",
      withdraw: "bg-red-400",
      reset: "bg-amber-600",
      pending: "bg-blue-500",
      success: "bg-green-500",
      rejected: "bg-red-500",
      wallet: "bg-blue-500",
      cod: "bg-green-500",
    }) as Record<string, string>
  )[value] || "bg-blue-500";
const addTransactionTypeTitles: Record<string, string> = {
  deposit: "DEPOSIT",
  withdraw: "WITHDRAW",
  reset: "RESET",
};
export const toAddTransactionTypeTitle = (value: string) =>
  addTransactionTypeTitles[value] || "UNKNOWN";
export const toAddTransactionTypeColor = (value: string) =>
  (
    ({
      deposit: "bg-green-400",
      withdraw: "bg-red-400",
      reset: "bg-amber-600",
      pending: "bg-blue-500",
      success: "bg-green-500",
      rejected: "bg-red-500",
      wallet: "bg-blue-500",
      cod: "bg-green-500",
    }) as Record<string, string>
  )[value] || "bg-blue-500";
const affiliateTransactionStatusTitles: Record<string, string> = {
  pending: "PENDING",
  success: "SUCCESS",
  rejected: "REJECTED",
};
export const toAffiliateTransactionStatusTitle = (value: string) =>
  affiliateTransactionStatusTitles[value] || "UNKNOWN";
export const toAffiliateTransactionStatusColor = (value: string) =>
  (
    ({
      deposit: "bg-green-400",
      withdraw: "bg-red-400",
      reset: "bg-amber-600",
      pending: "bg-blue-500",
      success: "bg-green-500",
      rejected: "bg-red-500",
      wallet: "bg-blue-500",
      cod: "bg-green-500",
    }) as Record<string, string>
  )[value] || "bg-blue-500";
const depositTransactionTypeTitles: Record<string, string> = {
  custom: "CUSTOM",
  bankTransferRajhi: "BANK_TRANSFER_RAJHI",
  bankTransferAhli: "BANK_TRANSFER_AHLE",
  bankTransferStc: "BANK_TRANSFER_STC",
  box: "DEPOSIT_TO_BOX",
};
export const toDepositTransactionTypeTitle = (value: string) =>
  depositTransactionTypeTitles[value] || "UNKNOWN";
export const toDepositTransactionTypeColor = (value: string) =>
  (
    ({
      deposit: "bg-green-400",
      withdraw: "bg-red-400",
      reset: "bg-amber-600",
      pending: "bg-blue-500",
      success: "bg-green-500",
      rejected: "bg-red-500",
      wallet: "bg-blue-500",
      cod: "bg-green-500",
    }) as Record<string, string>
  )[value] || "bg-blue-500";
const withdrawTransactionTypeTitles: Record<string, string> = {
  custom: "CUSTOM",
  visaFees: "VISA_FEES",
  transactionError: "TRANSACTION_ERROR",
};
export const toWithdrawTransactionTypeTitle = (value: string) =>
  withdrawTransactionTypeTitles[value] || "UNKNOWN";
export const toWithdrawTransactionTypeColor = (value: string) =>
  (
    ({
      deposit: "bg-green-400",
      withdraw: "bg-red-400",
      reset: "bg-amber-600",
      pending: "bg-blue-500",
      success: "bg-green-500",
      rejected: "bg-red-500",
      wallet: "bg-blue-500",
      cod: "bg-green-500",
    }) as Record<string, string>
  )[value] || "bg-blue-500";
const transactionTitleTypeTitles: Record<string, string> = {
  "shipment extra weight fees": "SHIPMENT_EXTRA_WEIGHT_FEES",
  "returned shipment fees": "RETURNED_SHIPMENT_FEES",
  "cod shipment payment": "COD_SHIPMENT_PAYMENT",
  "top-up balance": "TOPUP_BALANCE",
  "withdrew request": "WITHDRAW_REQUEST",
  "rejected withdrew request": "WITHDRAW_REQUEST_REJECTED",
  "bank transfer": "BANK_TRANSFER",
  "settlement of financial dues": "SETTLEMENT_OF_FINANCIAL_DUES",
  "new shipment": "NEW_SHIPMENT",
  "re activate canceled": "REACTIVATE_CANCELED",
  "canceled shipment balance": "CANCELED_SHIPMENT_BALANCE",
  "balance update": "BALANCE_UPDATE",
  "bags request": "PACKAGE_REQUEST",
};
export const toTransactionTitleTypeTitle = (value: string) =>
  transactionTitleTypeTitles[value] || "UNKNOWN";
export const toTransactionTitleTypeColor = (value: string) =>
  (
    ({
      deposit: "bg-green-400",
      withdraw: "bg-red-400",
      reset: "bg-amber-600",
      pending: "bg-blue-500",
      success: "bg-green-500",
      rejected: "bg-red-500",
      wallet: "bg-blue-500",
      cod: "bg-green-500",
    }) as Record<string, string>
  )[value] || "bg-blue-500";

export const transactionFeature = (balance: string) =>
  balance === relatedBalanceTypes.cod ? "cod-transactions" : "transactions";
export const canUseTransactionBalance = (
  user: User,
  balance: string,
  operation: Operation = "view",
) =>
  ["wallet", "cod"].includes(balance) &&
  hasOperationPermission(transactionFeature(balance), operation, user);
export const availableTransactionBalances = (
  user: User,
  operation: Operation = "view",
) =>
  Object.values(relatedBalanceTypes).filter(
    (balance) =>
      canUseTransactionBalance(user, balance, "view") &&
      canUseTransactionBalance(user, balance, operation),
  );
export const canManageTransaction = (
  user: User,
  balance: string,
  existing = false,
) =>
  ["admin", "employee"].includes(user?.role) &&
  canUseTransactionBalance(user, balance, "view") &&
  canUseTransactionBalance(user, balance, existing ? "update" : "create");
export const transactionTitleOptions = (balance: string) =>
  Object.values(transactionTitleTypes).filter((value) => {
    const codTitles: string[] = [
      transactionTitleTypes.codPayment,
      transactionTitleTypes.withdrawRequest,
      transactionTitleTypes.withdrawRequestRejected,
      transactionTitleTypes.settlementOfDues,
    ];
    return (
      balance === "all" ||
      (balance === relatedBalanceTypes.cod
        ? codTitles.includes(value)
        : !codTitles.includes(value))
    );
  });
export const transactionUserLabel = (user?: User) =>
  user
    ? [[user.firstName, user.lastName].filter(Boolean).join(" "), user.email]
        .filter(Boolean)
        .join(" / ") || user.id
    : "";
export const transactionStatement = (row: ITransaction) =>
  [displayName(row.title), displayName(row.description), row.notes]
    .filter(Boolean)
    .join(" / ");
export const removeTransactionTax = (
  grossAmount: number,
  taxRatePct = 15,
  decimals = 2,
) => {
  const factor = 10 ** decimals,
    netAmount =
      Math.round((grossAmount / (1 + taxRatePct / 100)) * factor) / factor;
  return {
    netAmount,
    taxAmount: Math.round((grossAmount - netAmount) * factor) / factor,
  };
};
export const transactionBalancePreview = (
  value: ITransaction,
  account?: User,
) => {
  const previousBalance =
    account?.[
      value.relatedBalance === relatedBalanceTypes.cod
        ? "codBalance"
        : "balance"
    ] ?? 0;
  const taxed =
    value.type === transactionTypes.deposit &&
    value.relatedBalance === relatedBalanceTypes.wallet &&
    value.applyTax;
  const amounts = taxed
    ? removeTransactionTax(value.amount || 0)
    : { netAmount: value.amount || 0, taxAmount: 0 };
  return {
    previousBalance,
    ...amounts,
    currentBalance:
      previousBalance +
      (value.type === transactionTypes.withdraw
        ? -amounts.netAmount
        : amounts.netAmount),
  };
};
export const transactionAmountWithTax = (row: ITransaction) =>
  row.type === transactionTypes.deposit &&
  row.relatedBalance === relatedBalanceTypes.wallet &&
  (row.invoiceId || row.taxable) &&
  new Date(row.createdAt) > new Date("2025-06-01T00:00:00.000Z")
    ? (row.amount || 0) * 1.15
    : undefined;
export const transactionSaveValues = (value: ITransaction, t: TFunction) => {
  const payload = {
    userId: value.userId,
    type: value.type,
    relatedBalance: value.relatedBalance,
    amount: value.amount,
  } as {
    userId: string;
    type: string;
    relatedBalance: string;
    amount: number;
    notes?: string;
    operationType?: string;
    applyTax?: boolean;
  };
  if (value.relatedBalance === relatedBalanceTypes.wallet) {
    payload.operationType = value.operationType || "custom";
    const prefix =
      payload.operationType === "custom"
        ? ""
        : t(
            value.type === transactionTypes.deposit
              ? toDepositTransactionTypeTitle(payload.operationType)
              : toWithdrawTransactionTypeTitle(payload.operationType),
          );
    const notes =
      prefix &&
      (value.notes === prefix || value.notes?.startsWith(`${prefix} - `))
        ? value.notes
        : [prefix, value.notes].filter(Boolean).join(" - ");
    if (notes) payload.notes = notes;
    if (value.type === transactionTypes.deposit)
      payload.applyTax = Boolean(value.applyTax);
  } else if (value.notes) payload.notes = value.notes;
  return payload;
};
export const transactionDatesValid = (filters: {
  dateFromFilter?: string;
  dateToFilter?: string;
  dateFromInvalid?: boolean;
  dateToInvalid?: boolean;
}) =>
  !filters.dateFromInvalid &&
  !filters.dateToInvalid &&
  (!filters.dateFromFilter ||
    !filters.dateToFilter ||
    new Date(filters.dateFromFilter) <= new Date(filters.dateToFilter));
export const safeTransactionUrl = (value?: string) => {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? value : undefined;
  } catch {
    return undefined;
  }
};
