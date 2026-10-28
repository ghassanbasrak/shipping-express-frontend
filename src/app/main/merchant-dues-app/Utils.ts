import type { User } from "src/app/auth/user";
import { hasOperationPermission } from "src/app/auth/permissions";
import IShipment from "../shipments-app/models/IShipment";
import {
  decompressShipment,
  canUpdateShipment,
  canSettleShipment,
  canReturnShipmentStatus,
  shipmentPaymentStatus,
} from "../shipments-app/Utils";
import IMerchantDue from "./models/IMerchantDue";
export {
  shipmentStatus,
  shipmentPaymentStatus,
  toShipmentStatusTitle,
  toShipmentStatusColor,
  toShipmentPaymentStatusTitle,
  toShipmentPaymentStatusColor,
} from "../shipments-app/Utils";
export const canViewMerchantDues = (user: User) =>
  hasOperationPermission("merchant-dues", "view", user);
export const canUpdateMerchantDues = (user: User) =>
  canUpdateShipment(user, "merchant-dues");
export const canSettleMerchantDue = (user: User, row: IMerchantDue) =>
  canViewMerchantDues(user) &&
  !!row.shipment &&
  canSettleShipment(user, toMerchantDueShipment(row), "merchant-dues");
export const canReturnMerchantDue = (user: User, row: IMerchantDue) =>
  canViewMerchantDues(user) &&
  !!row.shipment &&
  canReturnShipmentStatus(user, toMerchantDueShipment(row), "merchant-dues");
export function toMerchantDue(value: IShipment): IMerchantDue {
  if (!value.isCod || !value.shipmentCod?.id) return null;
  const shipment = decompressShipment(value),
    cod = value.shipmentCod;
  return {
    ...cod,
    id: cod.id,
    shipmentId: value.id || value._id,
    shipment,
    userId: shipment.userId,
    user: shipment.user,
  };
}
export const toMerchantDueShipment = (value: IMerchantDue): IShipment => ({
  ...value.shipment,
  id: value.shipmentId || value.shipment.id,
  userId: value.userId,
  user: value.user,
  isCod: true,
  shipmentCod: {
    ...value.shipment.shipmentCod,
    id: value.id,
    codStatus: value.codStatus,
    codPrice: value.codPrice,
  },
});
export const hasPendingMerchantDue = (row: IMerchantDue) =>
  row.shipment?.status !== "returned" &&
  row.codStatus === shipmentPaymentStatus.pending;

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
