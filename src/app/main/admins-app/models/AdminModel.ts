import _ from "@lodash";
import { PartialDeep } from "type-fest";
import IAdmin from "./IAdmin";
import { adminRoles } from "../Utils";
const AdminModel = (data: PartialDeep<IAdmin> = {}) =>
  _.defaultsDeep({}, data, { features: [], role: adminRoles.employee });
export const adminDefaultValues = AdminModel({});
export const adminEditableFields = ["role", "features"];
export default AdminModel;
