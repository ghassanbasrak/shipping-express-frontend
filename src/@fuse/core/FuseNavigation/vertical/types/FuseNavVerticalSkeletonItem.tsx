import NavLinkAdapter from "@fuse/core/NavLinkAdapter";
import { alpha, styled } from "@mui/material/styles";
import ListItemText from "@mui/material/ListItemText";
import clsx from "clsx";
import { useMemo } from "react";
import { ListItemButton, ListItemButtonProps, Skeleton } from "@mui/material";
import FuseNavBadge from "../../FuseNavBadge";
import FuseSvgIcon from "../../../FuseSvgIcon";
import { FuseNavItemComponentProps } from "../../FuseNavItem";
import Icon from "app/shared-components/Icon";

type ListItemButtonStyleProps = ListItemButtonProps & {
  itempadding: number;
};

const Root = styled(ListItemButton)<ListItemButtonStyleProps>(
  ({ theme, ...props }) => ({
    minHeight: 44,
    width: "100%",
    borderRadius: "6px",
    margin: "0 0 4px 0",
    paddingRight: 16,
    paddingLeft: props.itempadding > 80 ? 80 : props.itempadding,
    paddingTop: 10,
    paddingBottom: 10,
    color: alpha(theme.palette.text.primary, 0.7),
    cursor: "pointer",
    textDecoration: "none!important",
    "&:hover": {
      color: theme.palette.text.primary,
    },
    "&.active": {
      color: theme.palette.text.primary,
      backgroundColor:
        theme.palette.mode === "light"
          ? "rgba(0, 0, 0, .05)!important"
          : "rgba(255, 255, 255, .1)!important",
      pointerEvents: "none",
      transition: "border-radius .15s cubic-bezier(0.4,0.0,0.2,1)",
      "& > .fuse-list-item-text-primary": {
        color: "inherit",
      },
      "& > .fuse-list-item-icon": {
        color: "inherit",
      },
    },
    "& >.fuse-list-item-icon": {
      marginRight: 16,
      color: "inherit",
    },
    "& > .fuse-list-item-text": {},
  })
);

/**
 * FuseNavVerticalSkeletonItem is a React component used to render FuseNavItem as part of the Fuse navigational component.
 */
function FuseNavVerticalSkeletonItem(props: FuseNavItemComponentProps) {
  const { item, nestedLevel = 0, onItemClick, checkPermission } = props;

  const itempadding = nestedLevel > 0 ? 38 + nestedLevel * 16 : 16;

  const component = item.url ? NavLinkAdapter : "li";

  let itemProps = {};

  if (typeof component !== "string") {
    itemProps = {
      disabled: item.disabled,
      to: item.url || "",
      end: item.end,
      role: "button",
    };
  }
  if (checkPermission && !item?.hasPermission) {
    return null;
  }
  return useMemo(
    () => (
      <Root
        component={component}
        className={clsx("fuse-list-item", item.active && "active")}
        itempadding={itempadding}
        sx={item.sx}
        {...itemProps}
      >
        <Skeleton
          animation="wave"
          variant="circular"
          className={clsx("fuse-list-item-icon shrink-0", item.iconClass)}
          height="1.4em"
          width="1.4em"
        />

        <Skeleton className="fuse-list-item-text w-full" animation="wave" />
      </Root>
    ),
    [item, itempadding, onItemClick]
  );
}

const NavVerticalItem = FuseNavVerticalSkeletonItem;

export default NavVerticalItem;
