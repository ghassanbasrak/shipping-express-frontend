export default interface IStoragePlan {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  durationDays: number;
  features: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
