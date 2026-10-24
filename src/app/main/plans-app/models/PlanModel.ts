import _ from "@lodash";
import { PartialDeep } from "type-fest";
import IPlan from "./IPlan";
import { planStatus } from "../Utils";

const PlanModel = (data: PartialDeep<IPlan> = {}) =>
  _.defaultsDeep({}, data, {
    name: "",
    description: "",
    price: 0,
    features: [],
    status: planStatus.active,
    prices: [],
  });
export const planDefaultValues = PlanModel({});
export const planEditableFields = [
  "name",
  "description",
  "price",
  "features",
  "status",
  "prices",
];
export default PlanModel;
