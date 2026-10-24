import _ from "@lodash";
import { PartialDeep } from "type-fest";
import IAuthRequest from "./IAuthRequest";
import { authRequestStatus, authRequestTypes } from "../Utils";
export const authRequestDefaultValues = {
  type: authRequestTypes.auth,
  status: authRequestStatus.pending,
  description: "",
  fileUrl: "",
};
const AuthRequestModel = (data: PartialDeep<IAuthRequest> = {}): IAuthRequest =>
  _.defaultsDeep({}, data, authRequestDefaultValues);
export default AuthRequestModel;
