import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
} from "app/shared-components/feature-header/FeatureHeader";
import { useTheme } from "@mui/material/styles";
import { Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Link } from "react-router-dom";

import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useTranslation } from "react-i18next";
export default function MerchantStatisticsHeader({
  onGenerate,
  onPrint,
  loading,
  printing,
  canPrint,
}: {
  onGenerate: () => void;
  onPrint: () => void;
  loading: boolean;
  printing: boolean;
  canPrint: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation("merchantStatisticsApp");
  return (
    <FeatureHeader>
      <div className="flex items-center justify-between gap-8 min-w-0">
        <Typography
          className="flex items-center self-start gap-4 text-12 font-medium hover:underline"
          component={Link}
          role="button"
          to="/merchants"
          color="inherit"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "ltr"
              ? "heroicons-outline:arrow-sm-left"
              : "heroicons-outline:arrow-sm-right"}
          </FuseSvgIcon>
          <span className="flex mx-4 font-medium">{t("GO_HOME")}</span>
        </Typography>
      </div>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="merchant-statistics-app">
            {t("MERCHANT_STATISTICS")}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          <LoadingButton
            className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
            data-testid="print-statistics"
            variant="contained"
            color="success"
            loading={printing}
            disabled={!canPrint || loading}
            onClick={onPrint}
            startIcon={
              <FuseSvgIcon size={20}>heroicons-outline:printer</FuseSvgIcon>
            }
          >
            {t("PRINT_STATISTICS")}
          </LoadingButton>
          <LoadingButton
            className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
            data-testid="generate-statistics"
            variant="contained"
            color="primary"
            loading={loading}
            disabled={printing}
            onClick={onGenerate}
          >
            {t("GET_MERCHANT_STATISTICS")}
          </LoadingButton>
        </FeatureHeaderActions>
      </FeatureHeaderRow>
    </FeatureHeader>
  );
}
