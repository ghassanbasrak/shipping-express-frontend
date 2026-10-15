const authRoles = {
  admin: ["admin"],
  staff: ["admin", "employee"],
  user: ["admin", "employee", "user"],
  onlyUser: ["user"],
  onlyGuest: [],
};
export default authRoles;
