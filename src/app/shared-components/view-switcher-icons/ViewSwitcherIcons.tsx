import { Box, IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  toViewSwitcherIconName,
  toViewSwitcherIconTitle,
  ViewSwitcherIconsProps,
  viewSwitcherIconTypes,
} from "./Utils";
import Icon from "../Icon";
import clsx from "clsx";

function ViewSwitcherIcons({
  selectedViewType,
  onSelectViewType,
  viewTypes = [viewSwitcherIconTypes.table, viewSwitcherIconTypes.grid],
  iconColor = "info",
  iconSize = "0.8em",
  iconButtonSize = "medium",
}: ViewSwitcherIconsProps) {
  const { t } = useTranslation("public");
  return (
    <Box
      className="flex items-center space-x-8 rounded-lg border"
      sx={{
        borderColor: (theme) => theme.palette[iconColor].main,
        bgcolor: (theme) => theme.palette.background.paper,
      }}
    >
      {viewTypes.map((type, index) => (
        <Tooltip
          key={index}
          title={t(toViewSwitcherIconTitle(type))}
          placement="bottom"
        >
          <IconButton
            sx={{
              color: (theme) =>
                selectedViewType === type
                  ? "white"
                  : theme.palette[iconColor].main,
              bgcolor: (theme) =>
                selectedViewType === type
                  ? theme.palette[iconColor].main
                  : "transparent",
              // borderWidth: "1px",

              // borderTopColor: (theme) =>
              //   selectedViewType === type
              //     ? "transparent"
              //     : theme.palette.info.main,
              // borderBottomColor: (theme) =>
              //   selectedViewType === type
              //     ? "transparent"
              //     : theme.palette.info.main,
              // borderRightColor: (theme) =>
              //   selectedViewType === type
              //     ? "transparent"
              //     : theme.palette.info.main,
              // borderLeftColor: (theme) =>
              //   selectedViewType === type
              //     ? "transparent"
              //     : theme.palette.info.main,
            }}
            disableRipple
            onClick={() => onSelectViewType(type as any)}
            size={iconButtonSize}
            className={clsx(
              index === 0 ? "rounded-s-lg" : "rounded-s-0",
              index === viewTypes.length - 1 ? "rounded-e-lg" : "rounded-e-0"
            )}
          >
            <Icon
              type={toViewSwitcherIconName(type).split("-")[0]}
              name={toViewSwitcherIconName(type).split("-")[1]}
              size={iconSize}
            />
          </IconButton>
        </Tooltip>
      ))}
    </Box>
  );
}

export default ViewSwitcherIcons;
