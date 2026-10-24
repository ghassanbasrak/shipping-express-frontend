import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { User } from "src/app/auth/user";
import IMerchantStatistics from "../../models/IMerchantStatistics";
import { GetMerchantStatisticsApiArg } from "../../MerchantStatisticsApi";
import StatisticsAmounts from "../../../merchant-statistics-app/merchant-statistics/components/StatisticsAmounts";
import StatisticsReportHeader from "../../../merchant-statistics-app/merchant-statistics/components/StatisticsReportHeader";
import {
  shipmentStatisticRows,
  codBalanceRows,
  userBalanceRows,
} from "../../Utils";
export type MerchantStatisticsReportData = {
  statistics: IMerchantStatistics;
  request: GetMerchantStatisticsApiArg;
  user?: User;
};
export const hasMerchantStatistics = (value?: IMerchantStatistics) =>
  Boolean(
    value &&
      (value.localShipments ||
        value.internationalShipments ||
        value.codShipments ||
        value.codBalance ||
        value.userBalance ||
        value.messages?.length),
  );
export default function MerchantStatisticsReport({
  report,
}: {
  report: MerchantStatisticsReportData;
}) {
  const { t } = useTranslation("merchantStatisticsNewApp");
  if (!report || !hasMerchantStatistics(report.statistics))
    return <Typography>{t("NO_SUCH_MERCHANT_STATISTIC")}</Typography>;
  const { statistics: value } = report;
  const common = { namespace: "merchantStatisticsNewApp" };
  return (
    <>
      <StatisticsReportHeader
        {...common}
        request={report.request}
        user={report.user}
      />
      <StatisticsAmounts
        {...common}
        title="SUBMITTED_ADJUSTMENTS"
        rows={[
          {
            key: "submittedBankTransfers",
            title: "BANK_TRANSFER_CHARGE_AMOUNT",
            amount: report.request.bankTransferTotals,
          },
          {
            key: "submittedOtherFees",
            title: "OTHER_CHARGE_AMOUNT",
            amount: report.request.otherFees,
          },
        ]}
      />
      <Typography variant="h6" className="my-16">
        {t("SHIPMENTS_SUMMARY")}
      </Typography>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
        {(
          [
            ["localShipments", "LOCAL_SHIPMENTS"],
            ["internationalShipments", "INTERNATIONAL_SHIPMENTS"],
            ["codShipments", "COD_SHIPMENTS"],
          ] as const
        ).map(
          ([key, title]) =>
            value[key] && (
              <StatisticsAmounts
                key={key}
                {...common}
                title={title}
                rows={shipmentStatisticRows.map(([field, title]) => ({
                  key: `${key}-${field}`,
                  title,
                  amount: value[key][field]?.fees,
                  count: value[key][field]?.count ?? 0,
                }))}
              />
            ),
        )}
        {value.codBalance && (
          <StatisticsAmounts
            {...common}
            title="COD_AMOUNTS"
            rows={codBalanceRows.map(([key, title]) => ({
              key,
              title,
              amount: value.codBalance[key]?.total,
              count: value.codBalance[key]?.count ?? 0,
            }))}
          />
        )}
      </div>
      {value.userBalance && (
        <div className="mt-24">
          <StatisticsAmounts
            {...common}
            title="MERCHANT_STATISTIC"
            rows={userBalanceRows.map(([key, title]) => ({
              key,
              title,
              amount: value.userBalance[key],
            }))}
          />
        </div>
      )}
      {!!value.messages?.length && (
        <section className="mt-24 space-y-16">
          <Typography variant="h6">{t("DETAILS_AND_NOTES")}</Typography>
          {value.messages.map((message, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b break-words"
              data-testid="statistics-message"
            >
              <Typography
                sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
              >
                {message.message}
              </Typography>
              <Typography
                className="font-semibold"
                sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
              >
                {message.note}
              </Typography>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
