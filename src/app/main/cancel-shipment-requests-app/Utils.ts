import type { User } from "src/app/auth/user";
import { hasOperationPermission } from "src/app/auth/permissions";
import ICancelShipmentRequest from "./models/ICancelShipmentRequest";
export const cancelShipmentRequestStatus = {
  pending: "pending",
  confirmed: "approved",
  refused: "rejected",
};
export const toCancelShipmentRequestStatusTitle = (value: string) =>
  value === "approved"
    ? "CONFIRMED"
    : value === "rejected"
      ? "REFUSED"
      : "PENDING";
export const toCancelShipmentRequestStatusColor = (value: string) =>
  value === "approved"
    ? "bg-green-600"
    : value === "rejected"
      ? "bg-red-600"
      : "bg-blue-600";
export const canViewCancellationRequests = (user: User) =>
  hasOperationPermission("cancel-shipment-requests", "view", user);
export const canReviewCancellationRequest = (
  user: User,
  row: ICancelShipmentRequest,
) =>
  user?.role !== "user" &&
  canViewCancellationRequests(user) &&
  hasOperationPermission("cancel-shipment-requests", "update", user) &&
  row.status === cancelShipmentRequestStatus.pending;
export const canViewCancellationTransactions = (
  user: User,
  row: ICancelShipmentRequest,
) =>
  canViewCancellationRequests(user) &&
  hasOperationPermission("transactions", "view", user) &&
  !!row.shipment?.trackingNumber &&
  (user.role !== "user" || row.userId === user.id);

export const datesValid = (filters: {
  dateFromFilter?: string;
  dateToFilter?: string;
  dateFromInvalid?: boolean;
  dateToInvalid?: boolean;
}) =>
  !filters.dateFromInvalid &&
  !filters.dateToInvalid &&
  (!filters.dateFromFilter ||
    Number.isFinite(new Date(filters.dateFromFilter).getTime())) &&
  (!filters.dateToFilter ||
    Number.isFinite(new Date(filters.dateToFilter).getTime())) &&
  (!filters.dateFromFilter ||
    !filters.dateToFilter ||
    new Date(filters.dateFromFilter) <= new Date(filters.dateToFilter));
