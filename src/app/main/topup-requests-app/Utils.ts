import type { User } from "src/app/auth/user";
import { hasOperationPermission } from "src/app/auth/permissions";
import { availableTransactionBalances } from "../transactions-app/Utils";
import ITopupRequest from "./models/ITopupRequest";
export const topupRequestStatus = {
  pending: "pending",
  confirmed: "success",
  refused: "failed",
};

export const topupRequestEntityTypes = {
  mada: "MADA",
  visa: "VISA",
  master: "MASTER",
  stcPay: "STC_PAY",
  applePay: "APPLEPAY",
};

export const toTopupRequestEntityTypeTitle = (status) => {
  switch (status) {
    case topupRequestEntityTypes.mada:
      return "MADA";
    case topupRequestEntityTypes.visa:
      return "VISA";
    case topupRequestEntityTypes.master:
      return "MASTER";
    case topupRequestEntityTypes.stcPay:
      return "STC_PAY";
    case topupRequestEntityTypes.applePay:
      return "APPLEPAY";
  }
  return "MADA";
};
export const toTopupRequestEntityTypeImage = (status) => {
  switch (status) {
    case topupRequestEntityTypes.mada:
      return "mada.png";
    case topupRequestEntityTypes.visa:
      return "visa.png";
    case topupRequestEntityTypes.master:
      return "master.png";
    case topupRequestEntityTypes.stcPay:
      return "stcpay.png";
    case topupRequestEntityTypes.applePay:
      return "applepay.png";
  }
  return "mada.png";
};

export const toTopupRequestStatusTitle = (status) => {
  switch (status) {
    case topupRequestStatus.pending:
      return "PENDING";
    case topupRequestStatus.confirmed:
      return "CONFIRMED";
    case topupRequestStatus.refused:
      return "REFUSED";
  }
  return "PENDING";
};

export const toTopupRequestStatusColor = (status) => {
  switch (status) {
    case topupRequestStatus.pending:
      return "bg-blue-600";
    case topupRequestStatus.confirmed:
      return "bg-green-600";
    case topupRequestStatus.refused:
      return "bg-red-600";
  }
  return "bg-blue-600";
};

export const canViewTopupRequests = (user: User) =>
  hasOperationPermission("payments", "view", user);
export const canAdjustTopupBalance = (user: User, userId: string) =>
  user.role !== "user" &&
  canViewTopupRequests(user) &&
  !!userId &&
  userId !== "all" &&
  hasOperationPermission("merchants", "update", user) &&
  availableTransactionBalances(user, "create").length > 0;
export const ownsTopupRequest = (user: User, payment: ITopupRequest) =>
  user.role === "user" &&
  !!payment &&
  (payment.userId ? payment.userId === user.id : payment.user?.id === user.id);
export const topupMinimumExceptions = [
  "68287bf8e987158064265020",
  "6831c900ef73e32297c0a851",
];
export function topupTotals(gross: number) {
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
export const invalidTopupDates = (filters: {
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
