import type { User } from "src/app/auth/user";
import { LocaleString } from "src/app/main/utils/commonTypes";
export default interface IApplication {
  id: string;
  _id?: string;
  name: LocaleString;
  clientName: string;
  userId?: string;
  user?: User;
  scopes: IApplicationScope[];
  apiKey?: string;
  lastUsedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface IApplicationScope {
  id?: string;
  _id?: string;
  feature: string;
  read?: boolean;
  write?: boolean;
  maxHourlyUsage?: number | null;
}
