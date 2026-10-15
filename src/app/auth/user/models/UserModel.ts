import _ from "@lodash";
import { PartialDeep } from "type-fest";
import { User, userRoles } from "src/app/auth/user";

/**
 * Creates a new user object with the specified data.
 */
function UserModel(data: PartialDeep<User>): User {
  data = data || {};

  return _.defaults({}, data, {
    id: "",
    role: null,
    firstName: "",
    lastName: "",
    email: "",
    address: {},
  });
}

export const userDefaultValues = UserModel({});

export const userEditableFields = ["firstName", "lastName", "address"];

export default UserModel;
