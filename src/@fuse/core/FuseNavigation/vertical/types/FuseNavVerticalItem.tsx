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
    minHeight: 40,
    width: "100%",
    borderRadius: 10,
    margin: 0,
    paddingRight: 10,
    paddingLeft: props.itempadding,
    paddingTop: 9,
    paddingBottom: 9,
    color: theme.palette.common.white,
    cursor: "pointer",
    textDecoration: "none!important",
    transition: "background-color .2s ease, color .2s ease",
    "&:hover": {
      color: theme.palette.common.white,
      backgroundColor: alpha(theme.palette.common.white, 0.08),
    },
    // active item: white pill with purple-800 bold text (approved dashboard replica)
    "&.active": {
      color: "var(--purple-800)",
      backgroundColor: theme.palette.common.white,
      fontWeight: 700,
      pointerEvents: "none",
      "& > .fuse-list-item-text-primary": {
        color: "inherit",
        fontWeight: 700,
      },
      "& > .fuse-list-item-icon": {
        color: "var(--purple-700)",
      },
    },
    "& >.fuse-list-item-icon": {
      marginRight: 10,
      color: "var(--purple-300)",
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
            primary:
              "text-13 font-medium fuse-list-item-text-primary whitespace-normal break-words leading-snug",
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
