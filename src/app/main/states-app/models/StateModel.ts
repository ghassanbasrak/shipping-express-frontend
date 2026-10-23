import _ from "@lodash";
import { PartialDeep } from "type-fest";
import IState from "./IState";

const StateModel = (data: PartialDeep<IState> = {}) =>
  _.defaultsDeep({}, data, {
    name: { en: "", ar: "" },
    countryId: "",
    shipmentStates: [],
  });
export const stateDefaultValues = StateModel({});
export const stateEditableFields = ["name", "countryId"];
export default StateModel;
