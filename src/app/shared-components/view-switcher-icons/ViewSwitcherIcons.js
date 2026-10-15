import { IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  toViewSwitcherIconName,
  toViewSwitcherIconTitle,
  viewSwitcherIconTypes,
} from "./Utils";
import Icon from "../Icon";

function ViewSwitcherIcons({
  selectedViewType,
  onSelectViewType,
  viewTypes = viewSwitcherIconTypes,
  iconColor = "info",
  iconSize = "0.8em",
  iconButtonSize = "medium",
}) {
  const { t } = useTranslation("public");
  return (
    <div className="flex items-center space-x-8">
      {Object.values(viewTypes).map((type, index) => (
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
              borderRadius: "8px",

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
            onClick={() => onSelectViewType(type)}
            size={iconButtonSize}
          >
            <Icon
              type={toViewSwitcherIconName(type).split("-")[0]}
              name={toViewSwitcherIconName(type).split("-")[1]}
              size={iconSize}
            />
          </IconButton>
        </Tooltip>
      ))}
    </div>
  );
}

export default ViewSwitcherIcons;
