import { useTranslation } from "react-i18next";
import { OverviewSection } from "app/shared-components/overview/Overview";
import { overviewCount } from "app/shared-components/overview/Utils";
import { useGetDashboardActivityQuery } from "../../DashboardApi";
import { toDashboardPeriodTitle } from "../../Utils";
export default function ActivityPanel({ period }: { period: string }) {
  const { t, i18n } = useTranslation("dashboard"),
    query = useGetDashboardActivityQuery(
      { time_filter: period },
      { refetchOnMountOrArgChange: true },
    ),
    data = query.currentData,
    items = [
      ["new_orders", "ORDERS_RECEIVED"],
      ["shipments_sent", "SHIPMENTS_DISPATCHED"],
      ["deliveries_completed", "DELIVERIES_COMPLETED"],
      ["new_merchants", "NEW_MERCHANTS"],
    ];
  return (
    <OverviewSection
      title={t("RECENT_ACTIVITY")}
      subtitle={`${t(toDashboardPeriodTitle(data?.time_filter || period))} · ${t("ALL_CARRIERS")}`}
      query={query}
      testId="dashboard-activity"
    >
      <div className="ov-activity">
        {items.map(([key, title]) => (
          <div key={key} className="ov-activity-item">
            <strong>{overviewCount(data?.[key], i18n.language)}</strong>
            <span>{t(title)}</span>
          </div>
        ))}
      </div>
    </OverviewSection>
  );
}
