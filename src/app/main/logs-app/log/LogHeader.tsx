import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
} from "app/shared-components/feature-header/FeatureHeader";
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
    <FeatureHeader>
      <div className="flex items-center justify-between gap-8 min-w-0">
        <Typography
          className="flex items-center self-start gap-4 text-12 font-medium hover:underline"
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
      </div>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="logs-app">
            {t("LOG")}

            {log?.message}
          </FeatureHeaderHeading>
        </div>
      </FeatureHeaderRow>
    </FeatureHeader>
  );
}
