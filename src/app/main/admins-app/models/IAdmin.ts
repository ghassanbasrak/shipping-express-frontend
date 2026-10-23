export default interface IAdmin {
  id: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role: string;
  isBlocked?: boolean;
  features: IAdminFeature[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IAdminFeature {
  id?: string;
  _id?: string;
  feature: string;
  accessCreate: boolean;
  accessUpdate: boolean;
  accessDelete: boolean;
  accessView: boolean;
}
