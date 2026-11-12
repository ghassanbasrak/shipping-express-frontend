import { storageSubscriptionStatus } from "../storage-subscriptions-app/Utils";
import type { User } from "src/app/auth/user";
import { type Operation } from "src/app/auth/permissions";
import type IStorageSubscription from "../storage-subscriptions-app/models/IStorageSubscription";
import type IStoragePlan from "./models/IStoragePlan";
import type IWarehouse from "./models/IWarehouse";
import type WarehouseModel from "./models/WarehouseModel";
import type StoragePlanModel from "./models/StoragePlanModel";
import type SupplyRequestModel from "./models/SupplyRequestModel";
import type {
  WarehouseSaveArg,
  StoragePlanSaveArg,
  CreateSupplyArg,
} from "./StorageApi";
export const warehouseSaveValues = (
  value: ReturnType<typeof WarehouseModel>,
): WarehouseSaveArg => ({
  name: value.name.trim(),
  mapAddress: value.mapAddress.trim(),
  information: value.information,
  storageTypes: value.storageTypes,
  pickup: {
    phone: value.pickup.phone.trim(),
    ...(value.pickup.email?.trim() ? { email: value.pickup.email.trim() } : {}),
    countryId: value.pickup.countryId,
    stateId: value.pickup.stateId,
    cityId: value.pickup.cityId,
    street: value.pickup.street.trim(),
    nationalAddress: value.pickup.nationalAddress.trim(),
    zipCode: value.pickup.zipCode?.trim() || "",
  },
});
export function warehousePickupWasSaved(
  warehouse: IWarehouse,
  values: WarehouseSaveArg,
) {
  return (
    !!warehouse.pickup &&
    Object.entries(values.pickup).every(
      ([key, value]) => (warehouse.pickup[key] || "") === (value || ""),
    )
  );
}
export const storagePlanSaveValues = (
  value: ReturnType<typeof StoragePlanModel>,
): StoragePlanSaveArg => ({
  name: value.name.trim(),
  price: value.price,
  discountPrice: value.discountPrice ?? value.price,
  durationDays: value.durationDays,
  features: value.featuresText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean),
  storageTypes: value.storageTypes,
  isActive: value.isActive,
});
export const supplySaveValues = (
  value: ReturnType<typeof SupplyRequestModel>,
): CreateSupplyArg => ({
  warehouseId: value.warehouseId,
  products: value.products.map((item) =>
    item.mode === supplyProductMode.existing
      ? {
          warehouseProductId: item.warehouseProductId,
          quantity: item.quantity,
          ...(item.unitPrice != null ? { unitPrice: item.unitPrice } : {}),
        }
      : {
          name: item.name.trim(),
          ...(item.sku?.trim() ? { sku: item.sku.trim() } : {}),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          ...(item.notes ? { notes: item.notes } : {}),
          storageType: item.storageType as StorageType,
        },
  ),
});
export const supplyProductMode = { new: "new", existing: "existing" } as const;
export const supplyStatuses = {
  pending: "pending",
  approved: "approved",
  received: "received",
  rejected: "rejected",
} as const;
export type SupplyStatus = (typeof supplyStatuses)[keyof typeof supplyStatuses];
export const fulfillmentSources = {
  external: "external",
  warehouse: "warehouse",
} as const;
export const toSupplyStatusTitle = (status: string) =>
  ({
    [supplyStatuses.pending]: "PENDING",
    [supplyStatuses.approved]: "APPROVED",
    [supplyStatuses.received]: "RECEIVED",
    [supplyStatuses.rejected]: "REJECTED",
  })[status] || status;
export const toSupplyStatusColor = (status: string) =>
  ({
    [supplyStatuses.pending]: "bg-blue-600",
    [supplyStatuses.approved]: "bg-amber-600",
    [supplyStatuses.received]: "bg-green-600",
    [supplyStatuses.rejected]: "bg-red-600",
  })[status] || "bg-gray-600";
export const storagePlanPrice = (plan: IStoragePlan) =>
  plan.discountPrice ?? plan.price;
// Backend storage administration is role-based; it defines no storage employee grant.
export const canManageStorage = (user: User, _operation: Operation = "view") =>
  user?.role === "admin";
export const canUseStorage = (user: User) =>
  user?.role === "user" || canManageStorage(user);
export function hasActiveStorageSubscription(
  subscription: IStorageSubscription,
  userId: string,
  now = Date.now(),
) {
  return (
    !!subscription &&
    subscription.userId === userId &&
    subscription.status === storageSubscriptionStatus.active &&
    !!subscription.plan &&
    Number.isFinite(Date.parse(subscription.startsAt)) &&
    Date.parse(subscription.startsAt) <= now &&
    Number.isFinite(Date.parse(subscription.endsAt)) &&
    Date.parse(subscription.endsAt) > now
  );
}
export const storageError = (error: unknown, fallback: string) => {
  const value = error as { data?: { message?: string }; message?: string };
  return typeof value?.data?.message === "string"
    ? value.data.message
    : value?.message || fallback;
};
export function merchantContactUrl(phone?: string) {
  const digits = (phone || "").replace(/[^0-9]/g, "");
  return digits.length >= 7 ? "https://wa.me/" + digits : undefined;
}
export const allowedSupplyTransitions = (
  status: string,
): (
  | typeof supplyStatuses.approved
  | typeof supplyStatuses.received
  | typeof supplyStatuses.rejected
)[] =>
  status === supplyStatuses.pending
    ? [supplyStatuses.approved, supplyStatuses.rejected]
    : status === supplyStatuses.approved
      ? [supplyStatuses.received, supplyStatuses.rejected]
      : [];

export const storageType = {
  standard: "standard",
  dry: "dry",
  chilled: "chilled",
  frozen: "frozen",
} as const;
export type StorageType = (typeof storageType)[keyof typeof storageType];
export const toStorageTypeTitle = (value: string) =>
  ({
    [storageType.standard]: "TYPE_STANDARD",
    [storageType.dry]: "TYPE_DRY",
    [storageType.chilled]: "TYPE_CHILLED",
    [storageType.frozen]: "TYPE_FROZEN",
  })[value] || "UNKNOWN_STORAGE_TYPE";
export const toStorageTypeColor = (value: string) =>
  ({
    [storageType.standard]: "bg-slate-600",
    [storageType.dry]: "bg-amber-600",
    [storageType.chilled]: "bg-blue-600",
    [storageType.frozen]: "bg-cyan-700",
  })[value] || "bg-gray-600";
export const supportedStorageTypes = (
  plan: IStoragePlan,
  warehouse: IWarehouse,
): StorageType[] =>
  Object.values(storageType).filter(
    (value) =>
      plan?.storageTypes?.includes(value) &&
      warehouse?.storageTypes?.includes(value),
  );

export const storageTypesWereSaved = (
  actual: StorageType[],
  expected: StorageType[],
) =>
  Array.isArray(actual) &&
  actual.length === expected.length &&
  expected.every((value) => actual.includes(value));
