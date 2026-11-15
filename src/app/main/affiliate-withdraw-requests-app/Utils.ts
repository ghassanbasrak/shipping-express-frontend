import type { User } from "src/app/auth/user";
import { hasOperationPermission } from "src/app/auth/permissions";
export const affiliateWithdrawRequestStatus = {
  pending: "pending",
  confirmed: "approved",
  refused: "rejected",
} as const;
export const affiliateWithdrawRequestTypes = {
  affiliateWithdraw: "affiliateWithdraw",
} as const;
export const toAffiliateWithdrawRequestStatusTitle = (status: string) =>
  ({ pending: "PENDING", approved: "CONFIRMED", rejected: "REFUSED" })[
    status
  ] || status;
export const toAffiliateWithdrawRequestStatusColor = (status: string) =>
  ({
    pending: "bg-status-info-bg text-status-info-fg",
    approved: "bg-status-success-bg text-status-success-fg",
    rejected: "bg-status-error-bg text-status-error-fg",
  })[status] || "bg-status-muted-bg text-status-muted-fg";
export const toAffiliateWithdrawRequestTypeTitle = (type: string) =>
  type === affiliateWithdrawRequestTypes.affiliateWithdraw
    ? "WITHDRAW"
    : "OTHER";
export const toAffiliateWithdrawRequestTypeColor = (type: string) =>
  type === affiliateWithdrawRequestTypes.affiliateWithdraw
    ? "bg-status-neutral-bg text-status-neutral-fg"
    : "bg-status-muted-bg text-status-muted-fg";
export type AffiliateWithdrawViewFeature =
  | "affiliate-withdraw-requests"
  | "withdraw-requests";
export const canViewAffiliateWithdrawRequests = (
  user: User,
  viewFeature: AffiliateWithdrawViewFeature = "affiliate-withdraw-requests",
) =>
  user.role === "user"
    ? Boolean(user.isAffiliate)
    : hasOperationPermission(viewFeature, "view", user);
// Preserve the legacy review operation grant; no new staff defaults or aliases.
export const canReviewAffiliateWithdrawRequest = (
  user: User,
  status: string,
  viewFeature: AffiliateWithdrawViewFeature = "affiliate-withdraw-requests",
) =>
  user.role !== "user" &&
  canViewAffiliateWithdrawRequests(user, viewFeature) &&
  hasOperationPermission("withdraw-requests", "update", user) &&
  status === affiliateWithdrawRequestStatus.pending;
