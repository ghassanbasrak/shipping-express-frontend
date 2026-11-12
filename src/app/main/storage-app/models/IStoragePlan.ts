import type { StorageType } from "../Utils";
export default interface IStoragePlan {
  id: string;
  storageTypes: StorageType[];
  name: string;
  price: number;
  discountPrice?: number;
  durationDays: number;
  features: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
