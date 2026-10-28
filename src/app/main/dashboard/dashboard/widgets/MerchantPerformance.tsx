import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import {
  OverviewSection,
  OverviewSelect,
  OverviewLink,
  OverviewEmpty,
} from "app/shared-components/overview/Overview";
import {
  overviewCount,
  overviewMoney,
  overviewPercent,
} from "app/shared-components/overview/Utils";
import { useGetDashboardTopMerchantsQuery } from "../../DashboardApi";
import {
  dashboardMerchantSort,
  toDashboardSortTitle,
  toDashboardPeriodTitle,
  dashboardMerchantRows,
} from "../../Utils";
export default function MerchantPerformance({ period }: { period: string }) {
  const { t, i18n } = useTranslation("dashboard"),
    user = useAppSelector(selectUser),
    [sortBy, setSortBy] = useState("orders"),
    [limit, setLimit] = useState(5),
    query = useGetDashboardTopMerchantsQuery(
      { period, sortBy, limit },
      { refetchOnMountOrArgChange: true },
    ),
    rows = dashboardMerchantRows(query.currentData);
  return (
    <OverviewSection
      title={t("MERCHANT_PERFORMANCE")}
      subtitle={`${t(toDashboardPeriodTitle(period))} · ${t("ALL_CARRIERS")}`}
      query={query}
      testId="merchant-performance"
      action={
        <div className="ov-inline-controls">
          <OverviewSelect
            label={t("RANK_BY")}
            value={sortBy}
            onChange={setSortBy}
            testId="dashboard-rank-sort"
            options={Object.values(dashboardMerchantSort).map((value) => ({
              value,
              label: t(toDashboardSortTitle(value)),
            }))}
          />
          <OverviewSelect
            label={t("SHOW")}
            value={String(limit)}
            onChange={(v) => setLimit(Number(v))}
            testId="dashboard-rank-limit"
            options={[5, 10, 15, 20].map((value) => ({
              value: String(value),
              label: String(value),
            }))}
          />
        </div>
      }
    >
      {!rows.length ? (
        <OverviewEmpty>{t("NO_MERCHANT_ACTIVITY")}</OverviewEmpty>
      ) : (
        <>
          <div className="ov-rank-row ov-rank-head">
            <span>#</span>
            <span>{t("MERCHANT")}</span>
            <span>{t("ORDERS_COUNT")}</span>
            <span>{t("REPORTED_SALES")}</span>
            <span>{t("GROWTH")}</span>
          </div>
          {rows.map((row, index) => (
            <div
              className="ov-rank-row"
              key={index}
              data-testid={`merchant-rank-${index}`}
            >
              <span className="ov-rank-num">{index + 1}</span>
              <span className="ov-rank-name">
                {row.merchant_name || t("UNNAMED_MERCHANT")}
              </span>
              <span className="ov-rank-value">
                <small>{t("ORDERS_COUNT")}</small>
                <strong>
                  {overviewCount(row.orders_count, i18n.language)}
                </strong>
              </span>
              <span className="ov-rank-value">
                <small>{t("REPORTED_SALES")}</small>
                <strong>
                  {overviewMoney(row.total_sales, i18n.language, row.currency)}
                </strong>
              </span>
              <span className="ov-rank-value">
                <small>{t("GROWTH")}</small>
                <strong>
                  {overviewPercent(row.growth_percentage, i18n.language)}
                </strong>
              </span>
            </div>
          ))}
        </>
      )}
      <div
        className="ov-section-header"
        style={{ marginTop: 18, marginBottom: 0 }}
      >
        <p className="ov-subtle-note">{t("MERCHANT_SALES_HINT")}</p>
        {hasOperationPermission("merchants", "view", user) && (
          <OverviewLink to="/merchants">{t("ALL_MERCHANTS")}</OverviewLink>
        )}
      </div>
    </OverviewSection>
  );
}
