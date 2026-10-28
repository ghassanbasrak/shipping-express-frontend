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
    pending: "bg-blue-600",
    approved: "bg-green-600",
    rejected: "bg-red-600",
  })[status] || "bg-gray-600";
export const toAffiliateWithdrawRequestTypeTitle = (type: string) =>
  type === affiliateWithdrawRequestTypes.affiliateWithdraw
    ? "WITHDRAW"
    : "OTHER";
export const toAffiliateWithdrawRequestTypeColor = (type: string) =>
  type === affiliateWithdrawRequestTypes.affiliateWithdraw
    ? "bg-purple-600"
    : "bg-gray-600";
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
