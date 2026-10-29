import type { User } from "src/app/auth/user";
import ICountry from "../../countries-app/models/ICountry";
import IState from "../../states-app/models/IState";
import ICity from "../../cities-app/models/ICity";
import IShippingCompany from "../../shipping-companies-app/models/IShippingCompany";
import IPlan from "../../plans-app/models/IPlan";
export default interface IMerchant extends User {
  _id?: string;
  phone1?: string;
  image?: string;
  loyaltyType?: string;
  prices?: IMerchantPrice[];
  address?: IMerchantAddress;
  country?: ICountry;
  state?: IState;
  city?: ICity;
  paymentPlanId?: string;
  paymentPlan?: IPlan;
  subscriptionBalance?: number;
  shipmentsCount?: number;
  shipmentCodsCount?: number;
  referredById?: string;
  referredBy?: User;
  affiliateCode?: string;
  zohoContactId?: string;
  zohoId?: string;
  walletBalanceStatus?: boolean;
  codBalanceStatus?: boolean;
}
export interface IMerchantAddress {
  countryId?: string;
  country?: ICountry;
  stateId?: string;
  state?: IState;
  cityId?: string;
  city?: ICity;
  street?: string;
  zipCode?: string;
}
export interface IMerchantPrice {
  affiliateId?: string;
  affiliate?: User;
  id?: string;
  _id?: string;
  shippingCompanyId?: string;
  shippingCompany?: IShippingCompany;
  localPrice?: number | null;
  codPrice?: number | null;
  internationalDiscountRate?: number | null;
}
