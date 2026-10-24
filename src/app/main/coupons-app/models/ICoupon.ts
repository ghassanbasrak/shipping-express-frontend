import IShippingCompany from "../../shipping-companies-app/models/IShippingCompany";

export default interface ICoupon {
  id: string;
  _id?: string;
  shippingCompanyId?: string;
  shippingCompany?: IShippingCompany;
  code: string;
  type: string;
  value: number;
  maxUsageCount: number;
  usageCount?: number;
  isActive?: boolean;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
