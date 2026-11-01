import { useState } from "react";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  OverviewSection,
  OverviewEmpty,
} from "app/shared-components/overview/Overview";
import {
  overviewCount,
  overviewBarWidth,
} from "app/shared-components/overview/Utils";
import { useGetDashboardFlowQuery } from "../../DashboardApi";
import {
  dashboardFlowTypes,
  toDashboardFlowTitle,
  toDashboardFlowColor,
  toDashboardStageTitle,
  toDashboardPeriodTitle,
} from "../../Utils";
export default function ShipmentStages({
  period,
  companyId,
  companyName,
}: {
  period: string;
  companyId?: string;
  companyName?: string;
}) {
  const { t, i18n } = useTranslation("dashboard"),
    [type, setType] = useState("local"),
    query = useGetDashboardFlowQuery(
      {
        period,
        companyId: type === "cod" ? undefined : companyId,
        types: [type],
      },
      { refetchOnMountOrArgChange: true },
    ),
    data = query.currentData?.[type],
    keys = [
      "order",
      "processing",
      "delivered",
      "canceled",
      "returned",
      ...(type === "cod" ? ["refundedToCustomer"] : []),
    ],
    scope =
      type === "cod" ? t("ALL_CARRIERS") : companyName || t("ALL_CARRIERS");
  return (
    <OverviewSection
      title={t("SHIPMENT_STAGES")}
      subtitle={`${t(toDashboardPeriodTitle(period))} · ${scope}`}
      controls={
        <div
          className="ov-tabs"
          role="tablist"
          aria-label={t("SHIPMENT_STAGES")}
        >
          {Object.values(dashboardFlowTypes).map((value) => (
            <Button
              variant="outlined"
              color="primary"
              key={value}
              role="tab"
              aria-selected={type === value}
              onClick={() => setType(value)}
              data-testid={`flow-${value}`}
            >
              {t(toDashboardFlowTitle(value))}
            </Button>
          ))}
        </div>
      }
      query={query}
      testId="shipment-stages"
    >
      {data ? (
        keys.map((key) => (
          <div key={key} className="ov-stage" data-testid={`stage-${key}`}>
            <span className="ov-stage-label">
              {t(toDashboardStageTitle(key))}
            </span>
            <div className="ov-bar" aria-hidden="true">
              <span
                style={{
                  width: `${overviewBarWidth(
                    data[key],
                    keys.map((k) => data[k]),
                  )}%`,
                  background: toDashboardFlowColor(type),
                }}
              />
            </div>
            <strong>{overviewCount(data[key], i18n.language)}</strong>
          </div>
        ))
      ) : (
        <OverviewEmpty>{t("STAGE_DATA_UNAVAILABLE")}</OverviewEmpty>
      )}
      <p className="ov-subtle-note">
        {t(type === "cod" ? "COD_STAGE_SCOPE" : "STAGE_COUNTS_HINT")}
      </p>
    </OverviewSection>
  );
}
