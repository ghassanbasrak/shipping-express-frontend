import _ from "@lodash";
import { PartialDeep } from "type-fest";
import IWithdrawRequest from "./IWithdrawRequest";
import { withdrawRequestStatus, withdrawRequestTypes } from "../Utils";
const WithdrawRequestModel = (
  data: PartialDeep<IWithdrawRequest> = {},
): IWithdrawRequest =>
  _.defaultsDeep({}, data, {
    id: "",
    amount: 0,
    description: "",
    shipmentIds: [],
    type: withdrawRequestTypes.withdraw,
    status: withdrawRequestStatus.pending,
  });
export const withdrawRequestDefaultValues = WithdrawRequestModel();
export const withdrawRequestEditableFields = ["shipmentIds", "description"];
export default WithdrawRequestModel;
