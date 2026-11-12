import type IStoragePlan from "./IStoragePlan";
export default function StoragePlanModel(value?: IStoragePlan) {
  return {
    name: value?.name || "",
    storageTypes: value?.storageTypes || [],
    price: value?.price ?? 0,
    discountPrice: value?.discountPrice ?? null,
    durationDays: value?.durationDays ?? 30,
    featuresText: value?.features?.join("\n") || "",
    isActive: value?.isActive ?? true,
  };
}
