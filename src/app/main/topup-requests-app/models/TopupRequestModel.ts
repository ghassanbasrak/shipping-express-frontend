import _ from "@lodash";
import { PartialDeep } from "type-fest";
import ITopupRequest from "./ITopupRequest";
const TopupRequestModel = (
  data: PartialDeep<ITopupRequest> = {},
): ITopupRequest =>
  _.defaultsDeep({}, data, {
    id: "",
    amount: 0,
    total: 0,
    feeTotal: 0,
    taxTotal: 0,
    isPlan: false,
    status: "pending",
  });
export const topupRequestDefaultValues = TopupRequestModel();
export const topupRequestEditableFields = ["amount"];
export default TopupRequestModel;
