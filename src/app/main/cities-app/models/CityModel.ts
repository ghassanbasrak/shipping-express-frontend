import _ from "@lodash";
import { PartialDeep } from "type-fest";
import ICity from "./ICity";

const CityModel = (data: PartialDeep<ICity> = {}) =>
  _.defaultsDeep({}, data, {
    name: { en: "", ar: "" },
    countryId: "",
    stateId: "",
    postalCode: "",
    shipmentCities: [],
  });
export const cityDefaultValues = CityModel({});
export const cityEditableFields = [
  "name",
  "countryId",
  "stateId",
  "postalCode",
];
export default CityModel;
