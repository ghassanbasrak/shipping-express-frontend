import { useTranslation } from "react-i18next";
import { OverviewSection } from "app/shared-components/overview/Overview";
import {
  overviewCount,
  overviewNumber,
} from "app/shared-components/overview/Utils";
import { useGetDashboardAlertsQuery } from "../../DashboardApi";
import { dashboardAlerts, toDashboardPeriodTitle } from "../../Utils";
export default function AttentionPanel({ period }: { period: string }) {
  const { t, i18n } = useTranslation("dashboard"),
    query = useGetDashboardAlertsQuery(
      { period },
      { refetchOnMountOrArgChange: true },
    ),
    data = dashboardAlerts(query.currentData),
    items = [
      ["urgent_support_tickets", "URGENT_SUPPORT"],
      ["shipments_delayed", "DELAYED_SHIPMENTS"],
      ["pending_payments", "PENDING_PAYMENTS"],
      ["merchants_need_approval", "MERCHANTS_AWAITING_APPROVAL"],
    ];
  return (
    <OverviewSection
      title={t("NEEDS_ATTENTION")}
      subtitle={`${t(toDashboardPeriodTitle(period))} · ${t("ALL_CARRIERS")}`}
      query={query}
      testId="dashboard-attention"
    >
      {items.map(([key, title]) => (
        <div className="ov-attention-row" key={key}>
          <span className="ov-attention-label">
            <span
              className="ov-dot"
              style={{
                background:
                  overviewNumber(data[key]) === 0 ? "#91a3b4" : "#d3973a",
              }}
            />
            <span>{t(title)}</span>
          </span>
          <strong data-testid={`attention-${key}`}>
            {overviewCount(data[key], i18n.language)}
          </strong>
        </div>
      ))}
      <p className="ov-subtle-note">{t("ATTENTION_HINT")}</p>
    </OverviewSection>
  );
}
