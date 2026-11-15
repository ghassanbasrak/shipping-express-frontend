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
  bank === banks.box ? "bg-status-neutral-bg text-status-neutral-fg" : "bg-status-info-bg text-status-info-fg";
export const toBankTransferStatusTitle = (status: string) =>
  ({ pending: "PENDING", approved: "CONFIRMED", rejected: "REFUSED" })[
    status
  ] || status;
export const toBankTransferStatusColor = (status: string) =>
  ({
    pending: "bg-status-info-bg text-status-info-fg",
    approved: "bg-status-success-bg text-status-success-fg",
    rejected: "bg-status-error-bg text-status-error-fg",
  })[status] || "bg-status-muted-bg text-status-muted-fg";
export const canReviewBankTransfer = (user: User, status: string) =>
  user.role !== "user" &&
  hasOperationPermission("bank-transfers", "view", user) &&
  hasOperationPermission("bank-transfers", "update", user) &&
  status === bankTransferStatus.pending;
