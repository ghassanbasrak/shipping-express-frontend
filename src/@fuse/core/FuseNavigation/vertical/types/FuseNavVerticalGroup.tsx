import NavLinkAdapter from "@fuse/core/NavLinkAdapter";
import { alpha, styled } from "@mui/material/styles";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { ListItem, ListItemButtonProps, ListItemText } from "@mui/material";
import FuseNavItem, { FuseNavItemComponentProps } from "../../FuseNavItem";
import {
  FuseNavItemType,
  FuseRemoteNavItemType,
} from "../../types/FuseNavItemType";
import localeString from "src/app/main/utils/localeString";
import FuseUtils from "@fuse/utils/FuseUtils";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";

type ListItemButtonComponentProps = ListItemButtonProps & {
  itempadding: number;
};

const Root = styled(ListItem)<ListItemButtonComponentProps>(
  ({ theme, ...props }) => ({
    width: "100%",
    borderRadius: 8,
    margin: 0,
    paddingRight: 10,
    paddingLeft: props.itempadding,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 8,
    color: alpha(theme.palette.text.primary, 0.7),
    fontWeight: 600,
    // small square marker before the group label (purple-300), as in the approved dashboard replica
    "&::before": {
      content: '""',
      width: 8,
      height: 8,
      borderRadius: 3,
      flex: "none",
      backgroundColor: "var(--purple-300)",
    },
  }),
);

// Top-level groups are rendered as purple-700 section blocks inside the purple-900 sidebar.
const Section = styled("li")(() => ({
  listStyle: "none",
  borderRadius: 14,
  padding: "8px 6px 6px",
  marginBottom: 10,
  backgroundColor: "var(--purple-700)",
  "& > ul": {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: 2,
  },
}));

/**
 * FuseNavVerticalGroup is a component used to render a group of navigation items in a vertical layout.
 */
function FuseNavVerticalGroup(props: FuseNavItemComponentProps) {
  const { item, nestedLevel = 0, onItemClick, checkPermission } = props;
  const user = useAppSelector(selectUser);
  const [remoteChildren, setRemoteChildren] = useState<FuseNavItemType[]>([]);

  const {
    data: remoteData,
    isLoading: isLoadingRemoteData,
    isFetching: isFetchingRemoteData,
  } = item.useRemote
    ? item.useRemote(item.remoteFilters)
    : { data: null, isLoading: null, isFetching: null };

  function getRemoteItemValue(
    keyName: string,
    item: object,
    isLocale?: boolean | null,
  ) {
    const value: any = keyName?.includes("%")
      ? keyName
          .replace(
            `%{${keyName.substring(
              keyName.indexOf("{") + 1,
              keyName.indexOf("}"),
            )}`,
            item[
              keyName.substring(keyName.indexOf("{") + 1, keyName.indexOf("}"))
            ],
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
      //  &&
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
          list.map((item) => convertRemoteItemToLocalItem(item)),
        );
      }
    }
  }, [remoteData]);

  useEffect(() => {
    if (
      item.remote &&
      (isLoadingRemoteData || isFetchingRemoteData) &&
      remoteChildren.length === 0
    ) {
      const skeletonItem: FuseNavItemType = {
        id: `${item.id}.skeleton`,
        type: "skeleton-item",
        hasPermission: true,
      };
      setRemoteChildren([
        { ...skeletonItem, id: `${item.id}.skeleton1` },
        { ...skeletonItem, id: `${item.id}.skeleton2` },
      ]);
    }
  }, [isLoadingRemoteData, isFetchingRemoteData, remoteData, remoteChildren]);

  const itempadding = nestedLevel > 0 ? 12 : 14;

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
  return useMemo(() => {
    if (
      (checkPermission && !item.hasPermission) ||
      (item.hasPermissionGetter && !item.hasPermissionGetter(user))
    ) {
      return null;
    }
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
    if (children.filter((child) => child?.hasPermission)?.length === 0) {
      return null;
    }
    const content = (
      <>
        <Root
          component={component}
          itempadding={itempadding}
          className={clsx(
            "fuse-list-subheader flex items-center  py-10",
            !item.url ? "cursor-default" : "",
          )}
          onClick={() => onItemClick && onItemClick(item)}
          sx={item.sx}
          {...itemProps}
        >
          <ListItemText
            className="fuse-list-subheader-text"
            sx={{
              margin: 0,
              "& > .MuiListItemText-primary": {
                fontSize: 12,
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? "var(--purple-100)"
                    : "text.secondary",
                fontWeight: 600,
                letterSpacing: ".02em",
                lineHeight: "20px",
              },

              "& > .MuiListItemText-secondary": {
                fontSize: 11,
                color: "text.disabled",
                letterSpacing: ".06px",
                fontWeight: 500,
                lineHeight: "1.5",
                whiteSpace: "normal",
              },
            }}
            primary={item.title}
            secondary={item.subtitle}
          />
        </Root>
        {(item.children || remoteChildren.length > 0) && (
          <>
            {children.map((_item) => (
              <FuseNavItem
                key={_item.id}
                type={`vertical-${_item.type}`}
                item={_item}
                nestedLevel={nestedLevel}
                onItemClick={onItemClick}
                checkPermission={checkPermission}
              />
            ))}
          </>
        )}
      </>
    );
    return nestedLevel === 0 ? (
      <Section>
        <ul>{content}</ul>
      </Section>
    ) : (
      content
    );
  }, [
    item,
    itempadding,
    nestedLevel,
    onItemClick,
    remoteChildren,
    checkPermission,
    user,
  ]);
}

const NavVerticalGroup = FuseNavVerticalGroup;

export default NavVerticalGroup;
