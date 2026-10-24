import { hasOperationPermission } from "src/app/auth/permissions";
import type { User } from "src/app/auth/user";
export const bankTransferStatus = {
  pending: "pending",
  confirmed: "approved",
  refused: "rejected",
} as const;
export const bankTransferTypes = { bankTransfer: "bankTransfer" } as const;
export const banks = {
  alrajhiBank: "alrajhiBank",
  ahliBank: "ahliBank",
  stcBank: "stcBank",
  box: "box",
} as const;
export const toBankTitle = (bank: string) =>
  ({
    alrajhiBank: "ALRAJHI_BANK",
    ahliBank: "AHLI_BANK",
    stcBank: "STC_BANK",
    box: "BOX",
  })[bank] || "OTHER";
export const toBankColor = (bank: string) =>
  bank === banks.box ? "bg-purple-600" : "bg-blue-600";
export const toBankTransferStatusTitle = (status: string) =>
  ({ pending: "PENDING", approved: "CONFIRMED", rejected: "REFUSED" })[
    status
  ] || status;
export const toBankTransferStatusColor = (status: string) =>
  ({
    pending: "bg-blue-600",
    approved: "bg-green-600",
    rejected: "bg-red-600",
  })[status] || "bg-gray-600";
export const canReviewBankTransfer = (user: User, status: string) =>
  user.role !== "user" &&
  hasOperationPermission("bank-transfers", "view", user) &&
  hasOperationPermission("bank-transfers", "update", user) &&
  status === bankTransferStatus.pending;
