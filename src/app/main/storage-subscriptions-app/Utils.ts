export const storageSubscriptionStatus = {
  active: "active",
  expired: "expired",
  cancelled: "cancelled",
} as const;
export type StorageSubscriptionStatus =
  (typeof storageSubscriptionStatus)[keyof typeof storageSubscriptionStatus];
export const toStorageSubscriptionStatusTitle = (value: string) =>
  ({
    [storageSubscriptionStatus.active]: "ACTIVE",
    [storageSubscriptionStatus.expired]: "EXPIRED",
    [storageSubscriptionStatus.cancelled]: "CANCELLED",
  })[value] || value;
export const toStorageSubscriptionStatusColor = (value: string) =>
  ({
    [storageSubscriptionStatus.active]: "bg-green-600",
    [storageSubscriptionStatus.expired]: "bg-amber-600",
    [storageSubscriptionStatus.cancelled]: "bg-gray-600",
  })[value] || "bg-gray-600";
export const storageSubscriptionOperation = {
  subscribe: "subscribe",
  renew: "renew",
  upgrade: "upgrade",
} as const;
export type StorageSubscriptionOperation =
  (typeof storageSubscriptionOperation)[keyof typeof storageSubscriptionOperation];
export const toStorageSubscriptionOperationTitle = (value: string) =>
  ({
    [storageSubscriptionOperation.subscribe]: "SUBSCRIBE",
    [storageSubscriptionOperation.renew]: "RENEW",
    [storageSubscriptionOperation.upgrade]: "UPGRADE",
  })[value] || value;
export const toStorageSubscriptionOperationColor = (value: string) =>
  ({
    [storageSubscriptionOperation.subscribe]: "bg-blue-600",
    [storageSubscriptionOperation.renew]: "bg-green-600",
    [storageSubscriptionOperation.upgrade]: "bg-violet-600",
  })[value] || "bg-gray-600";
