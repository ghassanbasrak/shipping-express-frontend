import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { User } from "src/app/auth/user";
import type { GetMerchantStatisticsApiArg } from "../../MerchantStatisticsApi";
import { statisticsUserLabel } from "../../Utils";
export default function StatisticsReportHeader({
  namespace,
  request,
  user,
}: {
  namespace: string;
  request: GetMerchantStatisticsApiArg;
  user?: User;
}) {
  const { t, i18n } = useTranslation(namespace);
  const date = (value?: string) =>
    value
      ? new Date(value).toLocaleDateString(i18n.language, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : t("ALL_DATES");
  return (
    <div className="space-y-8 border-b pb-16 mb-16 break-words">
      <Typography variant="h5">Ashamco Express</Typography>
      <Typography variant="h6">{t("MERCHANT_STATISTICS")}</Typography>
      <Typography data-testid="report-merchant">
        {t("MERCHANT")}: {statisticsUserLabel(user) || request.userId}
      </Typography>
      <Typography data-testid="report-dates">
        {t("START_DATE")}: {date(request.dateFrom)} — {t("END_DATE")}:{" "}
        {date(request.dateTo)}
      </Typography>
    </div>
  );
}
