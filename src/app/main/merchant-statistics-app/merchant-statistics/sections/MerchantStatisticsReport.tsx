import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { User } from "src/app/auth/user";
import IMerchantStatistics from "../../models/IMerchantStatistics";
import { GetMerchantStatisticsApiArg } from "../../MerchantStatisticsApi";
import StatisticsAmounts from "../components/StatisticsAmounts";
import StatisticsReportHeader from "../components/StatisticsReportHeader";
import {
  financialAssetRows,
  currentObligationRows,
  bankTransferRows,
  codObligationRows,
} from "../../Utils";
export type MerchantStatisticsReportData = {
  statistics: IMerchantStatistics;
  request: GetMerchantStatisticsApiArg;
  user?: User;
};
export const hasMerchantStatistics = (value?: IMerchantStatistics) =>
  Boolean(
    value &&
      (value.financialAssets ||
        value.currentObligations ||
        value.bankTransfer ||
        value.codObligations),
  );
export default function MerchantStatisticsReport({
  report,
}: {
  report: MerchantStatisticsReportData;
}) {
  const { t } = useTranslation("merchantStatisticsApp");
  if (!report || !hasMerchantStatistics(report.statistics))
    return <Typography>{t("NO_SUCH_MERCHANT_STATISTIC")}</Typography>;
  const { statistics: value } = report;
  const common = { namespace: "merchantStatisticsApp" };
  return (
    <>
      <StatisticsReportHeader
        {...common}
        request={report.request}
        user={report.user}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
        {value.financialAssets && (
          <StatisticsAmounts
            {...common}
            title="FINANCIAL_ASSETS"
            total={value.financialAssets.total}
            rows={financialAssetRows.map(([key, title]) => ({
              key,
              title,
              amount: value.financialAssets[key],
            }))}
          />
        )}
        {value.currentObligations && (
          <StatisticsAmounts
            {...common}
            title="CURRENT_OBLIGATIONS"
            rows={currentObligationRows.map(([key, title]) => ({
              key,
              title,
              amount: value.currentObligations[key],
            }))}
          />
        )}
        {value.bankTransfer && (
          <StatisticsAmounts
            {...common}
            title="BANK_TRANSFERS"
            total={value.bankTransfer.total}
            rows={bankTransferRows.map(([key, title]) => ({
              key,
              title,
              amount: value.bankTransfer[key],
            }))}
          />
        )}
        {value.codObligations && (
          <StatisticsAmounts
            {...common}
            title="COD_OBLIGATIONS"
            total={value.codObligations.total}
            rows={codObligationRows.map(([key, title]) => ({
              key,
              title,
              amount: value.codObligations[key],
            }))}
          />
        )}
      </div>
    </>
  );
}
