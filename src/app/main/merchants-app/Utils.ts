import type { User } from "src/app/auth/user";
import { hasOperationPermission } from "src/app/auth/permissions";
import { availableTransactionBalances } from "../transactions-app/Utils";
import IMerchant from "./models/IMerchant";
export const merchantBalanceTypeFilters = {
  positive: "positive",
  zero: "zero",
  negative: "negative",
};
export const merchantLoyaltyTypes = {
  normal: "normal",
  custom: "custom",
};
export const merchantVerificationStatus = {
  notSubmitted: "notSubmitted",
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
};
export const getUserVerificationDaysCountRemaining = (user) => {
  if (!user?.verificationExpiresAt) return 0;
  const expireDate = new Date(user.verificationExpiresAt);
  const date = new Date();
  return Math.floor(
    (expireDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
};
export const toMerchantVerificationStatusTitle = (status) => {
  switch (status) {
    case merchantVerificationStatus.notSubmitted:
      return "NOT_SUBMITTED";
    case merchantVerificationStatus.pending:
      return "IN_REVIEW";
    case merchantVerificationStatus.approved:
      return "APPROVED";
    case merchantVerificationStatus.rejected:
      return "REJECTED";
  }
  return "NOT_SUBMITTED";
};
export const toMerchantVerificationStatusColor = (status) => {
  switch (status) {
    case merchantVerificationStatus.notSubmitted:
      return "bg-status-warning-bg text-status-warning-fg";
    case merchantVerificationStatus.pending:
      return "bg-status-info-bg text-status-info-fg";
    case merchantVerificationStatus.approved:
      return "bg-status-success-bg text-status-success-fg";
    case merchantVerificationStatus.rejected:
      return "bg-status-error-bg text-status-error-fg";
  }
  return "bg-status-warning-bg text-status-warning-fg";
};
export const toMerchantLoyaltyTypeShortTitle = (type) => {
  switch (type) {
    case merchantLoyaltyTypes.normal:
      return "NORMAL";
    case merchantLoyaltyTypes.custom:
      return "CUSTOM";
  }
  return "NORMAL";
};
export const toMerchantLoyaltyTypeTitle = (type) => {
  switch (type) {
    case merchantLoyaltyTypes.normal:
      return "NORMAL_PRICES_MERCHANT";
    case merchantLoyaltyTypes.custom:
      return "CUSTOM_PRICES_MERCHANT";
  }
  return "NORMAL_PRICES_MERCHANT";
};
export const toMerchantBalanceTypeFilterTitle = (type) => {
  switch (type) {
    case merchantBalanceTypeFilters.positive:
      return "POSITIVE_BALANCE";
    case merchantBalanceTypeFilters.zero:
      return "ZERO_BALANCE";
    case merchantBalanceTypeFilters.negative:
      return "NEGATIVE_BALANCE";
  }
  return "POSITIVE_BALANCE";
};

export const merchantActiveStatus = {
  active: "true",
  inactive: "false",
} as const;
export const toMerchantActiveStatusTitle = (status: string) =>
  status === "true" ? "ACTIVE" : "INACTIVE";
export const toMerchantActiveStatusColor = (status: string) =>
  status === "true" ? "bg-status-success-bg text-status-success-fg" : "bg-status-error-bg text-status-error-fg";
export const merchantSortDirections = { asc: "asc", desc: "desc" } as const;
export const toMerchantSortDirectionTitle = (direction: string) =>
  direction === "asc" ? "ASCENDING" : "DESCENDING";
export const toMerchantSortDirectionColor = () => "bg-status-info-bg text-status-info-fg";
export const toMerchantLoyaltyTypeColor = (type: string) =>
  type === "custom" ? "bg-status-neutral-bg text-status-neutral-fg" : "bg-status-info-bg text-status-info-fg";
export const toMerchantBalanceTypeFilterColor = (type: string) =>
  ({ positive: "bg-status-success-bg text-status-success-fg", zero: "bg-status-muted-bg text-status-muted-fg", negative: "bg-status-error-bg text-status-error-fg" })[
    type
  ] || "bg-status-muted-bg text-status-muted-fg";
export const canViewMerchants = (user: User) =>
  user.role !== "user" && hasOperationPermission("merchants", "view", user);
export const canUpdateMerchant = (user: User) =>
  canViewMerchants(user) && hasOperationPermission("merchants", "update", user);
export const canCreateMerchant = (user: User) =>
  canUpdateMerchant(user) &&
  hasOperationPermission("merchants", "create", user);
export const canBlockMerchant = (user: User) =>
  canUpdateMerchant(user) &&
  hasOperationPermission("merchants", "delete", user);
export const canConvertMerchant = (user: User) =>
  user.role === "admin" && canUpdateMerchant(user);
export const canAdjustMerchantBalance = (user: User) =>
  canUpdateMerchant(user) &&
  availableTransactionBalances(user, "create").length > 0;
export const canLockMerchantBalance = (user: User) =>
  canUpdateMerchant(user) &&
  ["transactions", "cod-transactions"].every(
    (feature) =>
      hasOperationPermission(feature, "view", user) &&
      hasOperationPermission(feature, "update", user),
  );
export const merchantDatesInvalid = (value: {
  dateFromFilter?: string;
  dateToFilter?: string;
  dateFromInvalid?: boolean;
  dateToInvalid?: boolean;
}) =>
  !!(
    value.dateFromInvalid ||
    value.dateToInvalid ||
    (value.dateFromFilter &&
      !Number.isFinite(Date.parse(value.dateFromFilter))) ||
    (value.dateToFilter && !Number.isFinite(Date.parse(value.dateToFilter))) ||
    (value.dateFromFilter &&
      value.dateToFilter &&
      value.dateFromFilter > value.dateToFilter)
  );
export const merchantName = (merchant: IMerchant) =>
  `${merchant.firstName || ""} ${merchant.lastName || ""}`.trim();
export const normalizedTaxNumber = (value: string) =>
  String(value || "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
