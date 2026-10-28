import type { User } from "src/app/auth/user";
import ILog, { ILogData } from "./models/ILog";
export const logsType = {
  transaction: "transaction",
  payment: "payment",
  shipment: "shipment",
  user: "user",
  request: "request",
} as const;
export const toLogsTypeTitle = (type: string) =>
  ({
    transaction: "TRANSACTION",
    payment: "PAYMENT",
    shipment: "SHIPMENT",
    user: "USER",
    request: "REQUEST",
  })[type] || "SHIPMENT";
export const toLogsTypeColor = (type: string) =>
  ({
    transaction: "bg-blue-600",
    payment: "bg-green-600",
    shipment: "bg-red-600",
    user: "bg-blue-600",
    request: "bg-red-600",
  })[type] || "bg-blue-600";
export const canViewLogs = (user: User) => user?.role === "admin";
export const logSnapshots = (log: ILog): ILogData[] => {
  const data = log.meta?.data ?? log.data;
  return Array.isArray(data) ? data : data ? [data] : [];
};
export function logShipmentPath(log: ILog) {
  const data = logSnapshots(log)[0],
    shipment = log.shipment || data?.shipment;
  // A snapshot id can name a transaction/request. Only explicit shipment references identify the live route.
  const id =
    shipment?.id || shipment?._id || log.shipmentId || data?.shipmentId;
  if (!id) return null;
  return `/shipments/${encodeURIComponent(shipment?.shippingCompanyId || data?.shippingCompanyId || "all")}/${encodeURIComponent(shipment?.method || data?.method || "all")}/${encodeURIComponent(id)}`;
}
export const invalidLogDates = (filters: {
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
