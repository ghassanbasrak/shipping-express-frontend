import IShippingCompany from "../../shipping-companies-app/models/IShippingCompany";

export default interface IPlan {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  price: number;
  features: string[];
  status: string;
  prices?: IPlanPrice[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IPlanPrice {
  id?: string;
  _id?: string;
  shippingCompanyId?: string;
  shippingCompany?: IShippingCompany;
  localPrice?: number | null;
  codPrice?: number | null;
  internationalDiscountRate?: number | null;
  returnFees?: number | null;
}
