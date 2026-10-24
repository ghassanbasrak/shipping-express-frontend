import type { User } from "src/app/auth/user";
export default interface IAuthRequest {
  id: string;
  _id?: string;
  type: string;
  status: string;
  userId?: string;
  user?: User;
  description: string;
  fileUrl: string;
  createdAt?: string;
  updatedAt?: string;
}
