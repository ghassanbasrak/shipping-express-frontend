import type { User } from "src/app/auth/user";
import { hasOperationPermission } from "src/app/auth/permissions";
import { availableTransactionBalances } from "../transactions-app/Utils";
import IPayment from "./models/IPayment";
export const paymentFundingMethod = {
  online: "online",
  bankTransfer: "bankTransfer",
} as const;
export const paymentType = {
  topup: "topup",
  storageSubscription: "storageSubscription",
} as const;
export type PaymentType = (typeof paymentType)[keyof typeof paymentType];
export const paymentMethodType = {
  visa: "visa",
  master: "master",
  mada: "mada",
  amex: "amex",
  unionpay: "unionpay",
  applepay: "applepay",
  free: "free",
} as const;
export type PaymentMethodType =
  (typeof paymentMethodType)[keyof typeof paymentMethodType];
export const toPaymentTypeTitle = (value?: string) => {
  switch (value) {
    case paymentType.topup:
      return "PAYMENT_TYPE_TOPUP";
    case paymentType.storageSubscription:
      return "PAYMENT_TYPE_STORAGE_SUBSCRIPTION";
    default:
      return "PAYMENT_TYPE_UNKNOWN";
  }
};
export const toPaymentTypeColor = (value?: string) => {
  switch (value) {
    case paymentType.topup:
      return "bg-purple-600";
    case paymentType.storageSubscription:
      return "bg-blue-600";
    default:
      return "bg-gray-600";
  }
};
export const toPaymentMethodTypeTitle = (value?: string) => {
  switch (value) {
    case paymentMethodType.visa:
      return "VISA";
    case paymentMethodType.master:
      return "MASTER";
    case paymentMethodType.mada:
      return "MADA";
    case paymentMethodType.amex:
      return "AMEX";
    case paymentMethodType.unionpay:
      return "UNIONPAY";
    case paymentMethodType.applepay:
      return "APPLE_PAY";
    case paymentMethodType.free:
      return "FREE_PAYMENT";
    default:
      return "PAYMENT_METHOD_UNKNOWN";
  }
};
export const toPaymentMethodTypeColor = (value?: string) => {
  switch (value) {
    case paymentMethodType.visa:
      return "bg-blue-700";
    case paymentMethodType.master:
      return "bg-orange-600";
    case paymentMethodType.mada:
      return "bg-green-700";
    case paymentMethodType.amex:
      return "bg-indigo-600";
    case paymentMethodType.unionpay:
      return "bg-red-600";
    case paymentMethodType.applepay:
      return "bg-gray-900";
    case paymentMethodType.free:
      return "bg-teal-700";
    default:
      return "bg-gray-600";
  }
};
export const isPaymentType = (value: unknown): value is PaymentType =>
  Object.values(paymentType).some((type) => type === value);
/** Accept only an absolute hosted link; local links are exclusive to the demo gateway. */
export function getHostedCheckoutUrl(
  value: unknown,
  demoOrigin?: string,
): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  try {
    const url = new URL(value);
    if (url.username || url.password) return undefined;
    if (
      demoOrigin &&
      url.origin === demoOrigin &&
      url.pathname.startsWith("/demo/payment/")
    )
      return url.href;
    if (url.protocol !== "https:") return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}
export const paymentStatus = {
  pending: "pending",
  confirmed: "success",
  refused: "failed",
} as const;

export const toPaymentStatusTitle = (status) => {
  switch (status) {
    case paymentStatus.pending:
      return "PENDING";
    case paymentStatus.confirmed:
      return "CONFIRMED";
    case paymentStatus.refused:
      return "REFUSED";
  }
  return "PENDING";
};

export const toPaymentStatusColor = (status) => {
  switch (status) {
    case paymentStatus.pending:
      return "bg-blue-600";
    case paymentStatus.confirmed:
      return "bg-green-600";
    case paymentStatus.refused:
      return "bg-red-600";
  }
  return "bg-blue-600";
};

export const canViewPayments = (user: User) =>
  hasOperationPermission("payments", "view", user);
export const canAdjustWalletBalance = (user: User, userId: string) =>
  user.role !== "user" &&
  canViewPayments(user) &&
  !!userId &&
  userId !== "all" &&
  hasOperationPermission("merchants", "update", user) &&
  availableTransactionBalances(user, "create").length > 0;
export const ownsPayment = (user: User, payment: IPayment) =>
  user.role === "user" &&
  !!payment &&
  (payment.userId ? payment.userId === user.id : payment.user?.id === user.id);
export const paymentMinimumExceptions = [
  "68287bf8e987158064265020",
  "6831c900ef73e32297c0a851",
];
export function paymentTotals(gross: number) {
  const total = Number.isFinite(gross) ? gross : 0,
    net = Math.round((total / 1.15) * 100) / 100;
  return {
    amount:
      Math.round((total - Math.round((total - net) * 100) / 100) * 100) / 100,
    total,
    feeTotal: 0,
    taxTotal: Math.round((total - net) * 100) / 100,
  };
}
export const invalidPaymentDates = (filters: {
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
