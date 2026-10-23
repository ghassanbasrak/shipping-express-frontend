import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import StatisticsMerchantField from "../components/StatisticsMerchantField";
import StatisticsDates from "../components/StatisticsDates";
export default function BasicInfoTab() {
  const { t } = useTranslation("merchantStatisticsApp");
  return (
    <div className="space-y-16">
      <Typography className="text-18 font-semibold">
        {t("TYPE_MERCHANT_DETAILS")}
      </Typography>
      <StatisticsMerchantField namespace="merchantStatisticsApp" />
      <StatisticsDates namespace="merchantStatisticsApp" />
    </div>
  );
}
