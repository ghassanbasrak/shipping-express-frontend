import { storageSubscriptionOperation } from "../Utils";
export default function StorageSubscriptionModel() {
  return {
    userId: "",
    planId: "",
    operation: storageSubscriptionOperation.subscribe as string,
  };
}
