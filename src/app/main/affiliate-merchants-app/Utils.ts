import type { User } from "src/app/auth/user";
import { hasOperationPermission } from "src/app/auth/permissions";

export const affiliateMerchantTabs = {
  info: "info",
  customers: "customers",
  transactions: "transactions",
  withdrawRequests: "withdraw-requests",
} as const;
export const toAffiliateMerchantTabTitle = (tab: string) =>
  ({
    info: "AFFILIATE_INFO",
    customers: "CUSTOMERS",
    transactions: "TRANSACTIONS",
    "withdraw-requests": "WITHDRAW_REQUESTS",
  })[tab] || tab;
export const affiliateTransactionStatus = {
  pending: "pending",
  success: "success",
  rejected: "rejected",
} as const;
export const toAffiliateTransactionStatusTitle = (status: string) =>
  ({ pending: "PENDING", success: "SUCCESS", rejected: "REJECTED" })[status] ||
  status;
export const toAffiliateTransactionStatusColor = (status: string) =>
  ({ pending: "bg-blue-500", success: "bg-green-500", rejected: "bg-red-500" })[
    status
  ] || "bg-gray-500";
export const canViewAffiliates = (user: User) =>
  user.role === "user"
    ? !!user.isAffiliate
    : hasOperationPermission("affiliate-merchants", "view", user);
// Preserve the source wallet-ledger grant for the affiliate profit tab.
export const canViewAffiliateTransactions = (user: User) =>
  canViewAffiliates(user) &&
  hasOperationPermission("transactions", "view", user);
export const canViewAffiliateWithdrawals = (user: User) =>
  canViewAffiliates(user) &&
  hasOperationPermission("withdraw-requests", "view", user);
export const canViewAffiliateCustomers = (user: User) =>
  canViewAffiliates(user) && hasOperationPermission("customers", "view", user);
export const canEditCustomerPrices = (user: User) =>
  canViewAffiliateCustomers(user) &&
  (user.role === "user"
    ? !!user.isAffiliate
    : hasOperationPermission("customers", "update", user));
export const referralLink = (code: string, origin: string) =>
  `${origin}/affiliate/${encodeURIComponent(code)}`;
