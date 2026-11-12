import type { StorageType } from "../Utils";
import type ICountry from "../../countries-app/models/ICountry";
import type IState from "../../states-app/models/IState";
import type ICity from "../../cities-app/models/ICity";

export default interface IWarehouse {
  id: string;
  storageTypes: StorageType[];
  name: string;
  productsCount?: number;
  mapAddress?: string;
  information?: string;
  pickup?: IWarehousePickup;
  createdAt?: string;
  updatedAt?: string;
}

export interface IWarehousePickup {
  phone: string;
  email?: string;
  countryId: string;
  country?: ICountry;
  stateId: string;
  state?: IState;
  cityId: string;
  city?: ICity;
  street: string;
  nationalAddress: string;
  zipCode?: string;
}
