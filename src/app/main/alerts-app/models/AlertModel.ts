import _ from "@lodash";
import { PartialDeep } from "type-fest";
import IAlert from "./IAlert";
import { alertTypes, alertViewTypes } from "../Utils";
const AlertModel = (data: PartialDeep<IAlert> = {}) =>
  _.defaultsDeep({}, data, {
    type: alertTypes.normal,
    viewType: alertViewTypes.popup,
    title: "",
    content: "",
    imageUrl: "",
  });
export const alertDefaultValues = AlertModel({});
export const alertEditableFields = [
  "type",
  "viewType",
  "title",
  "content",
  "imageUrl",
];
export default AlertModel;
