import { LocaleString } from "src/app/main/utils/commonTypes";
import IShippingCompany from "../../shipping-companies-app/models/IShippingCompany";
import ICountry from "../../countries-app/models/ICountry";
import IState from "../../states-app/models/IState";

export default interface ICity {
  id: string;
  _id?: string;
  name?: LocaleString;
  countryId?: string;
  country?: ICountry;
  stateId?: string;
  state?: IState;
  postalCode?: string;
  shipmentCities?: IShipmentCity[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IShipmentCity {
  id?: string;
  _id?: string;
  cityId?: string;
  city?: ICity;
  shippingCompanyId?: string;
  shippingCompany?: IShippingCompany;
  name?: string;
  isActive?: boolean;
}
