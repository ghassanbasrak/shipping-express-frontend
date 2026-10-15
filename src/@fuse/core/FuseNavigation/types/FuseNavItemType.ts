import { SxProps } from "@mui/system";
import { FuseNavBadgeType } from "./FuseNavBadgeType";
import { UseQuery } from "@reduxjs/toolkit/dist/query/react/buildHooks";
import { QueryDefinition } from "@reduxjs/toolkit/query";
import { User } from "src/app/auth/user";

/**
 * FuseNavItemType
 * A type for Fuse navigation item and its properties.
 */
export type FuseNavItemType = {
  id: string;
  title?: string;
  translate?: string;
  subTranslate?: string;
  auth?: string[] | string;
  subtitle?: string;
  icon?: string;
  customIcon?: boolean;
  iconClass?: string;
  url?: string;
  target?: string;
  type?: string;
  sx?: SxProps;
  disabled?: boolean;
  active?: boolean;
  exact?: boolean;
  end?: boolean;
  badge?: FuseNavBadgeType;
  children?: FuseNavItemType[];
  hasPermission?: boolean;
  hasPermissionGetter?: (user: User) => boolean;
  remote?: boolean;
  useRemote?: UseQuery<QueryDefinition<any, any, any, any, any>>;
  remoteFilters?: object;
  remoteChildrenGetter?: (data: any) => object[];
  filterRemote?: (parentItem: FuseNavItemType, item: any) => boolean;
  remoteChild?: FuseRemoteNavItemType;
  childrenPosition?: "before" | "after";
  metadata?: any;
};

export type FuseRemoteNavItemType = {
  id: string;
  title?: string;
  titleLocaleString?: boolean;
  preTranslate?: string;
  translate?: string;
  subTranslate?: string;
  auth?: string[] | string;
  subtitle?: string;
  customIcon?: boolean;
  icon?: string;
  remoteIcon?: string;
  iconClass?: string;
  url?: string;
  target?: string;
  type?: string;
  sx?: SxProps;
  disabled?: boolean;
  active?: boolean;
  exact?: boolean;
  end?: boolean;
  badge?: FuseNavBadgeType;
  children?: FuseNavItemType[];
  hasPermission?: boolean;
  remote?: boolean;
  useRemote?: UseQuery<QueryDefinition<any, any, any, any, any>>;
  filterRemote?: (parentItem: FuseNavItemType, item: any) => boolean;
  remoteChild?: FuseRemoteNavItemType;
  childrenPosition?: "before" | "after";
  metadata?: any;
};

export type FuseFlatNavItemType = Omit<FuseNavItemType, "children" | "sx"> & {
  children?: string[];
  order: string;
};
