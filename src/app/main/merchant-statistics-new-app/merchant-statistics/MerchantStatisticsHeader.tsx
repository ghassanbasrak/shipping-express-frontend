import { useTheme } from "@mui/material/styles";
import { Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
  const { t } = useTranslation("merchantStatisticsNewApp");
  return (
    <div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between gap-16 py-24 px-16 sm:px-24">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-w-0 w-full sm:w-auto flex-1 space-y-8"
      >
        <Typography
          className="flex items-center sm:mb-12"
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
        <Typography className="text-20 sm:text-24 font-semibold">
          {t("MERCHANT_STATISTICS")}
        </Typography>
      </motion.div>
      <div className="flex flex-wrap items-center gap-8 w-full sm:w-auto sm:flex-nowrap shrink-0">
        <LoadingButton
          className="whitespace-nowrap shrink-0"
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
          className="whitespace-nowrap shrink-0"
          data-testid="generate-statistics"
          variant="contained"
          color="primary"
          loading={loading}
          disabled={printing}
          onClick={onGenerate}
        >
          {t("GET_MERCHANT_STATISTICS")}
        </LoadingButton>
      </div>
    </div>
  );
}
