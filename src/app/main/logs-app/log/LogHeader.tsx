import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useTheme } from "@mui/material/styles";
import { Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ILog from "../models/ILog";
export default function LogHeader({ log }: { log?: ILog }) {
  const theme = useTheme();
  const { t } = useTranslation("logsApp");
  return (
    <div className="flex flex-wrap justify-between items-center gap-16 w-full p-24 sm:p-32">
      <div>
        <Typography
          className="flex items-center sm:mb-12"
          component={Link}
          role="button"
          to="/logs"
          color="inherit"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "ltr"
              ? "heroicons-outline:arrow-sm-left"
              : "heroicons-outline:arrow-sm-right"}
          </FuseSvgIcon>
          <span className="flex mx-4 font-medium">{t("GO_TO_LOGS")}</span>
        </Typography>
        <Typography className="text-24 font-bold break-words">
          {t("LOG")} {log?.message}
        </Typography>
      </div>
    </div>
  );
}
