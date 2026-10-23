import _ from "@lodash";
import { PartialDeep } from "type-fest";
import IAffiliateWithdrawRequest from "./IAffiliateWithdrawRequest";
import {
  affiliateWithdrawRequestStatus,
  affiliateWithdrawRequestTypes,
} from "../Utils";
const AffiliateWithdrawRequestModel = (
  data: PartialDeep<IAffiliateWithdrawRequest> = {},
): IAffiliateWithdrawRequest =>
  _.defaultsDeep({}, data, {
    id: "",
    amount: 0,
    description: "",
    type: affiliateWithdrawRequestTypes.affiliateWithdraw,
    status: affiliateWithdrawRequestStatus.pending,
  });
export const affiliateWithdrawRequestDefaultValues =
  AffiliateWithdrawRequestModel();
export const affiliateWithdrawRequestEditableFields = ["amount", "description"];
export default AffiliateWithdrawRequestModel;
