import type { ReactNode } from "react";
import { Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
  FeatureHeaderToolbar,
} from "app/shared-components/feature-header/FeatureHeader";
import { useTranslation } from "react-i18next";
export default function StorageHeader({
  title,
  description,
  actions,
  toolbar,
  back = "/storage",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  back?: string | false;
}) {
  const { t } = useTranslation("storageApp"),
    theme = useTheme();
  return (
    <FeatureHeader>
      {back && (
        <Typography
          component={Link}
          to={back}
          color="inherit"
          className="flex items-center self-start gap-4 text-12 font-medium hover:underline"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "rtl"
              ? "heroicons-outline:arrow-sm-right"
              : "heroicons-outline:arrow-sm-left"}
          </FuseSvgIcon>
          {t("STORAGE")}
        </Typography>
      )}
      <FeatureHeaderRow>
        <FeatureHeaderHeading
          feature="storage-app"
          icon="heroicons-outline:cube"
          description={description}
        >
          {title}
        </FeatureHeaderHeading>
        <FeatureHeaderActions>{actions}</FeatureHeaderActions>
      </FeatureHeaderRow>
      {toolbar && <FeatureHeaderToolbar>{toolbar}</FeatureHeaderToolbar>}
    </FeatureHeader>
  );
}
