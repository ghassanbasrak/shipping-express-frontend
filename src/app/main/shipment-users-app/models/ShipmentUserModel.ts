import _ from "@lodash";
import { PartialDeep } from "type-fest";
import IShipmentUser from "./IShipmentUser";
import { shipmentUserTypes } from "../Utils";
const ShipmentUserModel = (data: PartialDeep<IShipmentUser> = {}) =>
  _.defaultsDeep({}, data, {
    fullName: "",
    phone: "",
    phone1: "",
    email: "",
    type: shipmentUserTypes.receiver,
    address: {
      countryId: "",
      stateId: "",
      cityId: "",
      street: "",
      zipCode: "",
    },
  });
export const shipmentUserDefaultValues = ShipmentUserModel({});
export const shipmentUserEditableFields = [
  "fullName",
  "phone",
  "phone1",
  "email",
  "type",
  "address",
];
export default ShipmentUserModel;
