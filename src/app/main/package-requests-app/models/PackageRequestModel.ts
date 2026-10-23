import _ from "@lodash";
import { PartialDeep } from "type-fest";
import IPackageRequest from "./IPackageRequest";
const PackageRequestModel = (
  data: PartialDeep<IPackageRequest> = {},
): IPackageRequest =>
  _.defaultsDeep({}, data, {
    id: "",
    type: "bags",
    status: "pending",
    amount: 0,
    description: "",
    productIds: [],
    fullName: "",
    phone: "",
    shippingAddress: {
      countryId: "",
      stateId: "",
      cityId: "",
      street: "",
      zipCode: "",
    },
  });
export const packageRequestDefaultValues = PackageRequestModel();
export const packageRequestEditableFields = [
  "productIds",
  "amount",
  "description",
  "fullName",
  "phone",
  "shippingAddress",
];
export default PackageRequestModel;
