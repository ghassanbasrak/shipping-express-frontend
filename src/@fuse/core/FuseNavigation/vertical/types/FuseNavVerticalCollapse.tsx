import NavLinkAdapter from "@fuse/core/NavLinkAdapter";
import { alpha, styled } from "@mui/material/styles";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import List, { ListProps } from "@mui/material/List";
import isUrlInChildren from "@fuse/core/FuseNavigation/isUrlInChildren";
import type { Location } from "history";
import { ListItemButton, useTheme } from "@mui/material";
import FuseNavBadge from "../../FuseNavBadge";
import FuseNavItem, { FuseNavItemComponentProps } from "../../FuseNavItem";
import FuseSvgIcon from "../../../FuseSvgIcon";
import {
  FuseNavItemType,
  FuseRemoteNavItemType,
} from "../../types/FuseNavItemType";
import Icon from "app/shared-components/Icon";
import localeString from "src/app/main/utils/localeString";
import FuseUtils from "@fuse/utils/FuseUtils";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";

type ListComponentProps = ListProps & {
  itempadding: number;
};

const Root = styled(List)<ListComponentProps>(({ theme, ...props }) => ({
  padding: 0,
  "&.open": {},
  "& > .fuse-list-item": {
    minHeight: 44,
    width: "100%",
    borderRadius: "6px",
    margin: "0 0 4px 0",
    paddingRight: 16,
    paddingLeft: props.itempadding > 80 ? 80 : props.itempadding,
    paddingTop: 10,
    paddingBottom: 10,
    color: alpha(theme.palette.text.primary, 0.7),
    "&:hover": {
      color: theme.palette.text.primary,
    },
    "& > .fuse-list-item-icon": {
      marginRight: 16,
      color: "inherit",
    },
  },
}));

function needsToBeOpened(location: Location, item: FuseNavItemType) {
  return location && isUrlInChildren(item, location.pathname);
}

/**
 * FuseNavVerticalCollapse component used for vertical navigation items with collapsible children.
 */
function FuseNavVerticalCollapse(props: FuseNavItemComponentProps) {
  const location = useLocation();
  const user = useAppSelector(selectUser);
  const theme = useTheme();
  const { item, nestedLevel = 0, onItemClick, checkPermission } = props;

  const [open, setOpen] = useState(() => needsToBeOpened(location, item));

  const itempadding = nestedLevel > 0 ? 38 + nestedLevel * 16 : 16;
  const [remoteChildren, setRemoteChildren] = useState<FuseNavItemType[]>([]);

  const { data: remoteData } = item.useRemote
    ? item.useRemote(item.remoteFilters)
    : { data: null };

  function getRemoteItemValue(
    keyName: string,
    item: object,
    isLocale?: boolean | null
  ) {
    const value: any = keyName.includes("%")
      ? keyName
          .replace(
            `%{${keyName.substring(
              keyName.indexOf("{") + 1,
              keyName.indexOf("}")
            )}`,
            item[
              keyName.substring(keyName.indexOf("{") + 1, keyName.indexOf("}"))
            ]
          )
          .replace("}", "")
      : item[keyName];
    return isLocale ? localeString(value) : value;
  }

  function convertRemoteItemToLocalItem(item: FuseRemoteNavItemType) {
    return {
      ...item,
      icon: item.remoteIcon ?? item.icon,
      hasPermission: Boolean(FuseUtils.hasPermission(item?.auth, user?.role)),
      // &&
      // FuseUtils.hasProductAppPagePermission(
      //   currentProductApp,
      //   item.url,
      //   user
      // ),
    };
  }

  useEffect(() => {
    if (item.remote && remoteData) {
      const children: object[] = item.remoteChildrenGetter
        ? item.remoteChildrenGetter(remoteData)
        : remoteData?.results;
      if (children) {
        const list: FuseRemoteNavItemType[] = (
          item.filterRemote
            ? children.filter((child) => item.filterRemote(item, child))
            : children
        ).map((remoteItem: object) => ({
          ...item.remoteChild,
          id: getRemoteItemValue(item.remoteChild.id, remoteItem),
          customIcon: item.remoteChild.customIcon,
          icon: item.remoteChild.icon,
          remoteIcon:
            item.remoteChild.remoteIcon &&
            getRemoteItemValue(item.remoteChild.remoteIcon, remoteItem),
          title: `${getRemoteItemValue(item.remoteChild.title, remoteItem, item.remoteChild.titleLocaleString)}`,
          url: getRemoteItemValue(item.remoteChild.url, remoteItem),
          type: item.remoteChild.type,
          metadata: remoteItem,
        }));
        setRemoteChildren(
          list.map((item) => convertRemoteItemToLocalItem(item))
        );
      }
    }
  }, [remoteData]);
  useEffect(() => {
    if (needsToBeOpened(location, item)) {
      if (!open) {
        setOpen(true);
      }
    }
  }, [location, item]);

  const component = item.url ? NavLinkAdapter : "li";

  let itemProps = {};

  if (typeof component !== "string") {
    itemProps = {
      disabled: item.disabled,
      to: item.url,
      end: item.end,
      role: "button",
    };
  }
  if (
    (checkPermission && !item?.hasPermission) ||
    (item.hasPermissionGetter && !item.hasPermissionGetter(user))
  ) {
    return null;
  }
  return useMemo(() => {
    const children =
      item.children || remoteChildren.length > 0
        ? [
            ...(!item.childrenPosition || item.childrenPosition === "before"
              ? item.children ?? []
              : []),
            ...remoteChildren,
            ...(item.childrenPosition === "after" ? item.children : []),
          ]
        : [];
    return children.filter((child) => child?.hasPermission)?.length ===
      0 ? null : (
      <Root
        className={clsx(open && "open")}
        itempadding={itempadding}
        sx={item.sx}
      >
        <ListItemButton
          component={component}
          className="fuse-list-item"
          onClick={() => {
            setOpen(!open);
          }}
          {...itemProps}
        >
          {item.icon ? (
            item.customIcon ? (
              <Icon
                type={item.icon.split("-")[0]}
                name={item.icon.split("-")[1]}
                size="1.4em"
                className={clsx("fuse-list-item-icon shrink-0", item.iconClass)}
              />
            ) : (
              <FuseSvgIcon
                className={clsx("fuse-list-item-icon shrink-0", item.iconClass)}
                color="action"
              >
                {item.icon}
              </FuseSvgIcon>
            )
          ) : (
            <></>
          )}

          <ListItemText
            className="fuse-list-item-text"
            primary={item.title}
            secondary={item.subtitle}
            classes={{
              primary:
                "text-13 font-medium fuse-list-item-text-primary truncate",
              secondary:
                "text-11 font-medium fuse-list-item-text-secondary leading-normal truncate",
            }}
          />

          {item.badge && <FuseNavBadge className="mx-4" badge={item.badge} />}

          <IconButton
            disableRipple
            className="-mx-12 h-20 w-20 p-0 hover:bg-transparent focus:bg-transparent"
            onClick={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              setOpen(!open);
            }}
            size="large"
          >
            <FuseSvgIcon size={16} className="arrow-icon" color="inherit">
              {open
                ? "heroicons-solid:chevron-down"
                : theme.direction === "rtl"
                  ? "heroicons-solid:chevron-left"
                  : "heroicons-solid:chevron-right"}
            </FuseSvgIcon>
          </IconButton>
        </ListItemButton>

        {(item.children || remoteChildren.length > 0) && (
          <Collapse in={open} className="collapse-children">
            {children.map((_item) => (
              <FuseNavItem
                key={_item.id}
                type={`vertical-${_item.type}`}
                item={_item}
                nestedLevel={nestedLevel + 1}
                onItemClick={onItemClick}
                checkPermission={checkPermission}
              />
            ))}
          </Collapse>
        )}
      </Root>
    );
  }, [
    item.badge,
    item.children,
    item.icon,
    item.iconClass,
    item.title,
    item.url,
    itempadding,
    nestedLevel,
    onItemClick,
    open,
    remoteChildren,
  ]);
}

const NavVerticalCollapse = FuseNavVerticalCollapse;

export default NavVerticalCollapse;
