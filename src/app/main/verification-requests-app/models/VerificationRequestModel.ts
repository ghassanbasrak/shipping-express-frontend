import _ from "@lodash";
import { PartialDeep } from "type-fest";
import IVerificationRequest from "./IVerificationRequest";
import { verificationRequestStatus, verificationRequestTypes } from "../Utils";
export const verificationRequestDefaultValues = {
  type: verificationRequestTypes.auth,
  status: verificationRequestStatus.pending,
};
const VerificationRequestModel = (
  data: PartialDeep<IVerificationRequest> = {},
): IVerificationRequest =>
  _.defaultsDeep({}, data, verificationRequestDefaultValues);
export default VerificationRequestModel;
