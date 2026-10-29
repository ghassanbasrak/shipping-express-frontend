import { useState } from "react";
import { Autocomplete, Button, TextField } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import {
  OverviewShell,
  OverviewHeader,
  OverviewRefresh,
  OverviewFooter,
  MetricCard,
  OverviewSelect,
  QuickAction,
} from "app/shared-components/overview/Overview";
import {
  overviewCount,
  overviewMoney,
  overviewPercent,
} from "app/shared-components/overview/Utils";
import { useGetShippingCompaniesQuery } from "../../shipping-companies-app/ShippingCompaniesApi";
import IShippingCompany from "../../shipping-companies-app/models/IShippingCompany";
import DashboardApi, {
  useGetDashboardActiveMerchantsQuery,
  useGetDashboardShipmentsTotalQuery,
  useGetDashboardRevenueQuery,
  useGetDashboardGrowthQuery,
} from "../DashboardApi";
import {
  dashboardPeriods,
  revenuePeriods,
  dashboardShipmentStatuses,
  toDashboardPeriodTitle,
  toDashboardStageTitle,
} from "../Utils";
import ShipmentStages from "./widgets/ShipmentStages";
import MerchantPerformance from "./widgets/MerchantPerformance";
import AttentionPanel from "./widgets/AttentionPanel";
import ActivityPanel from "./widgets/ActivityPanel";
export default function DashboardContent() {
  const { t, i18n } = useTranslation("dashboard"),
    user = useAppSelector(selectUser),
    dispatch = useAppDispatch(),
    [period, setPeriod] = useState("last_week"),
    [revenuePeriod, setRevenuePeriod] = useState("month"),
    [carrier, setCarrier] = useState<IShippingCompany | null>(null),
    [status, setStatus] = useState("all"),
    carriers = useGetShippingCompaniesQuery(
      { page: 0, pageSize: 100 },
      { refetchOnMountOrArgChange: true },
    ),
    common = { period, companyId: carrier?.id },
    options = { refetchOnMountOrArgChange: true },
    merchants = useGetDashboardActiveMerchantsQuery(common, options),
    shipments = useGetDashboardShipmentsTotalQuery(
      { ...common, status },
      options,
    ),
    growth = useGetDashboardGrowthQuery(common, options),
    revenue = useGetDashboardRevenueQuery(
      { period: revenuePeriod, companyId: carrier?.id },
      options,
    ),
    scope = `${t(toDashboardPeriodTitle(period))} · ${carrier?.name || t("ALL_CARRIERS")}`,
    carrierOptions = carriers.currentData?.results || [],
    allOptions =
      carrier && !carrierOptions.some((c) => c.id === carrier.id)
        ? [carrier, ...carrierOptions]
        : carrierOptions;
  const refresh = () => {
    dispatch(DashboardApi.util.invalidateTags(["DashboardOverview"]));
    carriers.refetch();
  };
  return (
    <OverviewShell>
      <div data-testid="administrator-dashboard">
        <OverviewHeader
          eyebrow="ASHAMCO EXPRESS / OPERATIONS"
          title={t("OPERATIONS_OVERVIEW")}
          description={t("ADMIN_INTRO", { name: user.firstName || "" })}
        >
          <OverviewRefresh onClick={refresh} />
          {hasOperationPermission("shipments", "view", user) && (
            <Button
              color="primary"
              variant="outlined"
              component={Link}
              to="/shipments/all/all"
              className="ov-primary"
            >
              {t("OPEN_SHIPMENTS")}
            </Button>
          )}
        </OverviewHeader>
      </div>
      <div className="ov-toolbar" data-testid="dashboard-filters">
        <div className="ov-filter-group">
          <OverviewSelect
            label={t("OPERATIONS_PERIOD")}
            value={period}
            onChange={setPeriod}
            testId="dashboard-period"
            options={Object.values(dashboardPeriods).map((value) => ({
              value,
              label: t(toDashboardPeriodTitle(value)),
            }))}
          />
          <span className="ov-toolbar-note">{t("OPERATIONS_SCOPE")}</span>
        </div>
        <div className="ov-filter-group ov-carrier-filter">
          <Autocomplete
            size="small"
            value={carrier}
            options={allOptions}
            getOptionLabel={(option) => option.name || option.id}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            loading={carriers.isFetching}
            onChange={(_, value) => setCarrier(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("CARRIER")}
                placeholder={t("ALL_CARRIERS")}
                inputProps={{
                  ...params.inputProps,
                  "data-testid": "dashboard-carrier",
                }}
              />
            )}
          />
          <span className="ov-toolbar-note">{t("CARRIER_SCOPE")}</span>
        </div>
        <div className="ov-filter-group">
          <OverviewSelect
            label={t("REVENUE_PERIOD")}
            value={revenuePeriod}
            onChange={setRevenuePeriod}
            testId="dashboard-revenue-period"
            options={Object.values(revenuePeriods).map((value) => ({
              value,
              label: t(toDashboardPeriodTitle(value)),
            }))}
          />
          <span className="ov-toolbar-note">{t("REVENUE_SCOPE")}</span>
        </div>
        {carriers.isError && (
          <Button
            color="primary"
            variant="outlined"
            onClick={() => carriers.refetch()}
          >
            {t("RETRY_CARRIERS")}
          </Button>
        )}
      </div>
      <div className="ov-metrics">
        <MetricCard
          title={t("ACTIVE_MERCHANTS")}
          value={overviewCount(
            merchants.currentData?.activeMerchants,
            i18n.language,
          )}
          change={merchants.currentData?.activeMerchantsChange}
          icon="groups"
          scope={scope}
          query={merchants}
          testId="metric-active-merchants"
        />
        <MetricCard
          title={t("TOTAL_SHIPMENTS")}
          value={overviewCount(shipments.currentData?.total, i18n.language)}
          change={shipments.currentData?.change}
          icon="local_shipping"
          accent="#5475d2"
          scope={scope}
          query={shipments}
          testId="metric-total-shipments"
          note={t(toDashboardStageTitle(status))}
        />
        <MetricCard
          title={t("REPORTED_REVENUE")}
          value={overviewMoney(
            revenue.currentData?.revenue,
            i18n.language,
            revenue.currentData?.currency,
          )}
          change={revenue.currentData?.change}
          icon="payments"
          accent="#a7793b"
          scope={`${t(toDashboardPeriodTitle(revenuePeriod))} · ${carrier?.name || t("ALL_CARRIERS")}`}
          query={revenue}
          note={
            revenue.currentData && !revenue.currentData.currency
              ? t("CURRENCY_NOT_PROVIDED")
              : undefined
          }
          testId="metric-revenue"
        />
        <MetricCard
          title={t("REVENUE_GROWTH")}
          value={overviewPercent(growth.currentData?.growth, i18n.language)}
          icon="trending_up"
          accent="#8170b6"
          scope={`${t(toDashboardPeriodTitle(growth.currentData?.period || period))} · ${carrier?.name || t("ALL_CARRIERS")}`}
          query={growth}
          note={t("REPORTED_PERCENTAGE")}
          testId="metric-growth"
        />
      </div>
      <div className="ov-inline-controls">
        <OverviewSelect
          label={t("SHIPMENT_METRIC_STATUS")}
          value={status}
          onChange={setStatus}
          testId="dashboard-shipment-status"
          options={Object.values(dashboardShipmentStatuses).map((value) => ({
            value,
            label: t(toDashboardStageTitle(value)),
          }))}
        />
        <span className="ov-toolbar-note">{t("STATUS_ONLY_TOTAL")}</span>
      </div>
      <div className="ov-grid-main">
        <ShipmentStages
          period={period}
          companyId={carrier?.id}
          companyName={carrier?.name}
        />
        <AttentionPanel period={period} />
      </div>
      <MerchantPerformance period={period} />
      <div className="ov-grid-equal">
        <ActivityPanel period={period} />
        <section className="ov-section">
          <div className="ov-section-header">
            <div>
              <h2>{t("QUICK_ACTIONS")}</h2>
              <p>{t("QUICK_ACTIONS_HINT")}</p>
            </div>
          </div>
          <div
            className="ov-quick-grid"
            style={{ gridTemplateColumns: "minmax(0,1fr)" }}
          >
            {hasOperationPermission("merchants", "view", user) && (
              <QuickAction
                to="/merchants"
                title={t("MERCHANTS")}
                description={t("REVIEW_MERCHANTS")}
                icon="groups"
              />
            )}
            {hasOperationPermission("verification-requests", "view", user) && (
              <QuickAction
                to="/verification-requests/all"
                title={t("VERIFICATION_REQUESTS")}
                description={t("REVIEW_VERIFICATION")}
                icon="verified_user"
              />
            )}
            {hasOperationPermission("withdraw-requests", "view", user) && (
              <QuickAction
                to="/withdraw-requests/all"
                title={t("WITHDRAWALS")}
                description={t("REVIEW_WITHDRAWALS")}
                icon="request_quote"
              />
            )}
          </div>
        </section>
      </div>
      <OverviewFooter />
    </OverviewShell>
  );
}
