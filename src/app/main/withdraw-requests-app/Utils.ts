import type { User } from "src/app/auth/user";
import { hasOperationPermission } from "src/app/auth/permissions";
import IShipment from "../shipments-app/models/IShipment";
export const withdrawRequestStatus = {
  pending: "pending",
  confirmed: "approved",
  refused: "rejected",
} as const;
export const withdrawRequestTypes = {
  withdraw: "withdrew",
  walletCharge: "walletCharge",
} as const;
export const toWithdrawRequestStatusTitle = (status: string) =>
  ({ pending: "PENDING", approved: "CONFIRMED", rejected: "REFUSED" })[
    status
  ] || status;
export const toWithdrawRequestStatusColor = (status: string) =>
  ({
    pending: "bg-blue-600",
    approved: "bg-green-600",
    rejected: "bg-red-600",
  })[status] || "bg-gray-600";
export const toWithdrawRequestTypeTitle = (type: string) =>
  ({ withdrew: "WITHDRAW", walletCharge: "WALLET_CHARGE" })[type] || "OTHER";
export const toWithdrawRequestTypeColor = (type: string) =>
  ({ withdrew: "bg-purple-600", walletCharge: "bg-green-600" })[type] ||
  "bg-gray-600";
export const canViewWithdrawRequests = (user: User) =>
  hasOperationPermission("withdraw-requests", "view", user);
export const canReviewWithdrawRequest = (user: User, status: string) =>
  user.role !== "user" &&
  canViewWithdrawRequests(user) &&
  hasOperationPermission("withdraw-requests", "update", user) &&
  status === withdrawRequestStatus.pending;
export function selectedWithdrawalAmount(
  ids: string[],
  shipments: IShipment[],
) {
  if (!ids.length || new Set(ids).size !== ids.length) return null;
  const selected = ids.map((id) => shipments.find((item) => item.id === id));
  if (
    selected.some(
      (item) =>
        !item ||
        !item.isCod ||
        item.codStatus !== "paid" ||
        !Number.isFinite(Number(item.codPrice)) ||
        Number(item.codPrice) < 0,
    )
  )
    return null;
  return (
    Math.round(
      selected.reduce((sum, item) => sum + Number(item.codPrice), 0) * 100,
    ) / 100
  );
}
export const withdrawalWalletNet = (amount: number) =>
  Math.round((amount / 1.15) * 100) / 100;
export const invalidWithdrawalDates = (filters: {
  dateFromFilter?: string;
  dateToFilter?: string;
  dateFromInvalid?: boolean;
  dateToInvalid?: boolean;
}) =>
  !!(
    filters.dateFromInvalid ||
    filters.dateToInvalid ||
    (filters.dateFromFilter &&
      !Number.isFinite(Date.parse(filters.dateFromFilter))) ||
    (filters.dateToFilter &&
      !Number.isFinite(Date.parse(filters.dateToFilter))) ||
    (filters.dateFromFilter &&
      filters.dateToFilter &&
      filters.dateFromFilter > filters.dateToFilter)
  );
