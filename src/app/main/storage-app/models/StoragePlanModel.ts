import type IStoragePlan from "./IStoragePlan";
export default function StoragePlanModel(value?: IStoragePlan) {
  return {
    name: value?.name || "",
    price: value?.price ?? 0,
    discountPrice: value?.discountPrice ?? null,
    durationDays: value?.durationDays ?? 30,
    featuresText: value?.features?.join("\n") || "",
    isActive: value?.isActive ?? true,
  };
}
