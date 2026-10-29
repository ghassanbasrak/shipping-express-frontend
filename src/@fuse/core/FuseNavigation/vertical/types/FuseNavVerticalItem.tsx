import NavLinkAdapter from "@fuse/core/NavLinkAdapter";
import { alpha, styled } from "@mui/material/styles";
import ListItemText from "@mui/material/ListItemText";
import clsx from "clsx";
import { useMemo } from "react";
import { ListItemButton, ListItemButtonProps } from "@mui/material";
import FuseNavBadge from "../../FuseNavBadge";
import FuseSvgIcon from "../../../FuseSvgIcon";
import { FuseNavItemComponentProps } from "../../FuseNavItem";
import Icon from "app/shared-components/Icon";

type ListItemButtonStyleProps = ListItemButtonProps & {
  itempadding: number;
};

const Root = styled(ListItemButton)<ListItemButtonStyleProps>(
  ({ theme, ...props }) => ({
    position: "relative",
    minHeight: 44,
    width: "100%",
    borderRadius: 12,
    margin: "0 0 4px 0",
    paddingRight: 14,
    paddingLeft: props.itempadding,
    paddingTop: 9,
    paddingBottom: 9,
    color: alpha(theme.palette.text.primary, 0.68),
    cursor: "pointer",
    textDecoration: "none!important",
    transition: "background-color .2s ease, color .2s ease, transform .2s ease",
    "&:hover": {
      color: theme.palette.text.primary,
      backgroundColor: alpha(theme.palette.common.white, 0.08),
    },
    "&.active": {
      color: "#fff",
      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      boxShadow: `0 10px 22px -10px ${alpha(theme.palette.primary.main, 0.9)}`,
      pointerEvents: "none",
      "& > .fuse-list-item-text-primary": {
        color: "inherit",
      },
      "& > .fuse-list-item-icon": {
        color: "inherit",
      },
    },
    "& >.fuse-list-item-icon": {
      marginRight: 14,
      color: "inherit",
    },
    "& > .fuse-list-item-text": {},
  }),
);

/**
 * FuseNavVerticalItem is a React component used to render FuseNavItem as part of the Fuse navigational component.
 */
function FuseNavVerticalItem(props: FuseNavItemComponentProps) {
  const { item, nestedLevel = 0, onItemClick, checkPermission } = props;

  const itempadding = nestedLevel > 0 ? 12 : 14;

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
        onClick={() => onItemClick && onItemClick(item)}
        itempadding={itempadding}
        sx={item.sx}
        {...itemProps}
      >
        {item.icon ? (
          item.icon.includes("/") ? (
            <img
              src={item.icon}
              className={clsx("fuse-list-item-icon shrink-0", item.iconClass)}
            />
          ) : item.customIcon ? (
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
            primary: "text-13 font-medium fuse-list-item-text-primary truncate",
            secondary:
              "text-11 font-medium fuse-list-item-text-secondary leading-normal truncate",
          }}
        />
        {item.badge && <FuseNavBadge badge={item.badge} />}
      </Root>
    ),
    [item, itempadding, onItemClick],
  );
}

const NavVerticalItem = FuseNavVerticalItem;

export default NavVerticalItem;
