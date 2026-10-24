import _ from "@lodash";
import { PartialDeep } from "type-fest";
import IApplication from "./IApplication";
const ApplicationModel = (data: PartialDeep<IApplication> = {}): IApplication =>
  _.defaultsDeep({}, data, {
    name: { en: "", ar: "" },
    clientName: "",
    userId: "",
    scopes: [],
  });
export const applicationDefaultValues = ApplicationModel({});
export const applicationEditableFields = [
  "name",
  "clientName",
  "userId",
  "scopes",
];
export default ApplicationModel;
