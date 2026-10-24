import type { User } from "src/app/auth/user";
import ICountry from "../../countries-app/models/ICountry";
import IState from "../../states-app/models/IState";
import ICity from "../../cities-app/models/ICity";

export default interface IShipmentUser {
  id: string;
  _id?: string;
  userId?: string;
  user?: User;
  fullName: string;
  phone: string;
  phone1?: string;
  email?: string;
  type: string;
  address: IShipmentUserAddress;
  // The legacy API returns geographic populations beside the nested address IDs.
  country?: ICountry;
  state?: IState;
  city?: ICity;
  senderShipmentsCount?: number;
  receiverShipmentsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IShipmentUserAddress {
  countryId?: string;
  country?: ICountry;
  stateId?: string;
  state?: IState;
  cityId?: string;
  city?: ICity;
  street?: string;
  zipCode?: string;
}
