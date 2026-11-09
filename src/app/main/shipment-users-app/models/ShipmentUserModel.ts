import _ from "@lodash";
import { PartialDeep } from "type-fest";
import IShipmentUser from "./IShipmentUser";
import { shipmentUserTypes } from "../Utils";
const ShipmentUserModel = (data: PartialDeep<IShipmentUser> = {}) =>
  _.defaultsDeep({}, _.omit(data, ["phone1", "phoneCountry1"]), {
    fullName: "",
    phone: "",
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
  "email",
  "type",
  "address",
];
export default ShipmentUserModel;
