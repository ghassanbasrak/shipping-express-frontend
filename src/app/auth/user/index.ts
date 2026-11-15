export { default as userRoles } from "../userRoles";
export type FeaturePermission = {
  feature: string;
  accessCreate?: boolean;
  accessUpdate?: boolean;
  accessDelete?: boolean;
  accessView?: boolean;
};
export type User = {
  id: string;
  role?: string;
  firebaseId?: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  taxNumber?: string;
  isRegistered?: boolean;
  isAuthorized?: boolean;
  isBlocked?: boolean;
  isAffiliate?: boolean;
  /** Historical API fields only; account access never depends on verification. */
  emailVerified?: boolean;
  phoneVerified?: boolean;
  verificationStatus?: string;
  verificationExpiresAt?: string;
  fcmToken?: string;
  features?: FeaturePermission[];
  address?: {
    countryId?: string;
    stateId?: string;
    cityId?: string;
    street?: string;
    zipCode?: string;
  };
  settings?: import("type-fest").PartialDeep<
    import("@fuse/core/FuseSettings/FuseSettings").FuseSettingsConfigType
  >;
  balance?: number;
  walletBalance?: number;
  codBalance?: number;
  createdAt?: string;
  updatedAt?: string;
};
