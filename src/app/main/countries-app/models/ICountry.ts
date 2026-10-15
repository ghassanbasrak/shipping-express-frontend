import { LocaleString } from "src/app/main/utils/commonTypes";
import IShippingCompany from "../../shipping-companies-app/models/IShippingCompany";

export default interface ICountry {
  id: string;
  _id?: string;
  name?: LocaleString;
  code?: string;
  dialCode?: string;
  subzoneName?: LocaleString;
  shipmentCountries?: IShipmentCountry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IShipmentCountry {
  id?: string;
  _id?: string;
  countryId?: string;
  country?: ICountry;
  shippingCompanyId?: string;
  shippingCompany?: IShippingCompany;
  name?: string;
  isActive?: boolean;
}
