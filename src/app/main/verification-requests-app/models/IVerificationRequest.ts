import IAdmin from "../../admins-app/models/IAdmin";

import type { User } from "src/app/auth/user";
export default interface IVerificationRequest {
  id: string;
  _id?: string;
  type: string;
  status: string;
  userId?: string;
  user?: User;
  name?: string;
  userType?: string;
  taxNumber?: string;
  crNumber?: string;
  identityUrl?: string;
  freelanceDocumentUrl?: string;
  taxCertificateUrl?: string;
  crUrl?: string;
  updatedById?: string;
  updatedBy?: IAdmin;
  createdAt?: string;
  updatedAt?: string;
}
