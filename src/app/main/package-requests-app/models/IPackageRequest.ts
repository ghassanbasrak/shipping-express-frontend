import type { User } from "src/app/auth/user";
import IAdmin from "../../admins-app/models/IAdmin";
import ICountry from "../../countries-app/models/ICountry";
import IState from "../../states-app/models/IState";
import ICity from "../../cities-app/models/ICity";
import IPackagingSupply from "./IPackagingSupply";
export default interface IPackageRequest {
  id: string;
  _id?: string;
  type: string;
  status: string;
  amount: number;
  description?: string;
  productIds: string[];
  products?: IPackagingSupply[];
  userId?: string;
  user?: User;
  updatedById?: string;
  updatedBy?: IAdmin;
  fullName: string;
  phone: string;
  shippingAddress: IPackageRequestAddress;
  reference?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
export interface IPackageRequestAddress {
  countryId?: string;
  country?: ICountry;
  stateId?: string;
  state?: IState;
  cityId?: string;
  city?: ICity;
  street?: string;
  zipCode?: string;
}
