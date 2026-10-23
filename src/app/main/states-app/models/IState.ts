import { LocaleString } from "src/app/main/utils/commonTypes";
import IShippingCompany from "../../shipping-companies-app/models/IShippingCompany";
import ICountry from "../../countries-app/models/ICountry";

export default interface IState {
  id: string;
  _id?: string;
  name?: LocaleString;
  countryId?: string;
  country?: ICountry;
  shipmentStates?: IShipmentState[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IShipmentState {
  id?: string;
  _id?: string;
  stateId?: string;
  state?: IState;
  shippingCompanyId?: string;
  shippingCompany?: IShippingCompany;
  name?: string;
  isActive?: boolean;
}
