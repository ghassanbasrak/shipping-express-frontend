import _ from "@lodash";
import { PartialDeep } from "type-fest";
import ICountry from "./ICountry";

const CountryModel = (data: PartialDeep<ICountry> = {}) =>
  _.defaultsDeep({}, data, {
    name: { en: "", ar: "" },
    code: "",
    dialCode: "",
    subzoneName: { en: "Region", ar: "المنطقة" },
    shipmentCountries: [],
  });

export const countryDefaultValues = CountryModel({});
export const countryEditableFields = [
  "name",
  "code",
  "dialCode",
  "subzoneName",
];
export default CountryModel;
