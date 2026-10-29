import { Button, Alert } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  OverviewShell,
  OverviewHeader,
  OverviewRefresh,
  OverviewFooter,
  OverviewSection,
  OverviewLink,
  MetricCard,
  QueryFeedback,
  QuickAction,
} from "app/shared-components/overview/Overview";
import {
  overviewCount,
  overviewMoney,
} from "app/shared-components/overview/Utils";
import { getCurrentCurrency } from "../../utils/currencyFormatter";
import HomeApi, {
  useGetHomeSummaryQuery,
  useGetHomeAccountQuery,
} from "../HomeApi";
import RecentShipments from "./widgets/RecentShipments";
import CarrierOptions from "./widgets/CarrierOptions";
export default function MerchantHome() {
  const { t, i18n } = useTranslation("homeApp"),
    user = useAppSelector(selectUser),
    dispatch = useAppDispatch(),
    options = { refetchOnMountOrArgChange: true },
    summary = useGetHomeSummaryQuery(user.id, options),
    account = useGetHomeAccountQuery(user.id, options),
    own =
      account.currentData &&
      (account.currentData.id || account.currentData._id) === user.id
        ? account.currentData
        : undefined,
    currency = getCurrentCurrency(),
    metrics = [
      [
        "ACTIVE_SHIPMENTS",
        summary.currentData?.activeShipments,
        "local_shipping",
        "#0f9d8c",
      ],
      [
        "CANCELED_SHIPMENTS",
        summary.currentData?.canceledShipments,
        "close",
        "#b58146",
      ],
      [
        "LOCAL_SHIPMENTS",
        summary.currentData?.localShipments,
        "inventory_2",
        "#5475d2",
      ],
      [
        "INTERNATIONAL_SHIPMENTS",
        summary.currentData?.internationalShipments,
        "public",
        "#8170b6",
      ],
    ] as const;
  return (
    <OverviewShell>
      <div data-testid="merchant-home">
        <OverviewHeader
          eyebrow={t("MERCHANT_WORKSPACE")}
          title={t("HELLO", { name: user.firstName || t("THERE") })}
          description={t("HOME_INTRO")}
        >
          <OverviewRefresh
            onClick={() =>
              dispatch(
                HomeApi.util.invalidateTags([
                  "HomeOverview",
                  "ShippingCompanies",
                ]),
              )
            }
          />
        </OverviewHeader>
      </div>
      <section className="ov-hero">
        <div>
          <span className="ov-eyebrow">ASHAMCO EXPRESS</span>
          <h2>{t("NEXT_SHIPMENT")}</h2>
          <p>{t("SHIPMENT_INTRO")}</p>
          <div className="ov-hero-actions">
            <Button
              color="primary"
              variant="contained"
              className="ov-primary"
              component={Link}
              to="/shipments/all/all/new"
              data-testid="home-new-shipment"
            >
              {t("CREATE_SHIPMENT")}
            </Button>
            <Button
              color="primary"
              className="ov-secondary"
              variant="outlined"
              component={Link}
              to="/shipping-price-calculator"
            >
              {t("CALCULATE_PRICE")}
            </Button>
          </div>
        </div>
        <div className="ov-hero-wallet" data-testid="home-wallet">
          <span className="ov-hero-wallet-label">{t("WALLET_BALANCE")}</span>
          <strong className="ov-hero-wallet-value">
            {account.isFetching && !account.currentData
              ? "…"
              : overviewMoney(own?.balance, i18n.language, currency)}
          </strong>
          <p className="ov-note">{t("DISPLAY_CURRENCY", { currency })}</p>
          <OverviewLink to="/topup-requests/all/new">
            {t("TOP_UP_WALLET")}
          </OverviewLink>
          <QueryFeedback query={account} />
          {account.currentData && !own && (
            <Alert severity="warning">{t("ACCOUNT_UNAVAILABLE")}</Alert>
          )}
        </div>
      </section>
      <OverviewSection
        title={t("SHIPPING_OVERVIEW")}
        subtitle={t("ACCOUNT_ALL_TIME")}
        query={summary}
        action={
          <OverviewLink to="/shipments/all/all">
            {t("ALL_SHIPMENTS")}
          </OverviewLink>
        }
        testId="home-shipping-summary"
      >
        <div className="ov-metrics ov-compact-metrics">
          {metrics.map(([title, value, icon, accent]) => (
            <MetricCard
              key={title}
              title={t(title)}
              value={overviewCount(value, i18n.language)}
              icon={icon}
              accent={accent}
              scope={t("ALL_TIME")}
              testId={`home-metric-${title}`}
            />
          ))}
        </div>
      </OverviewSection>
      <div className="ov-grid-main">
        <RecentShipments />
        <div className="ov-stack">
          <OverviewSection
            title={t("COD_ACCOUNT")}
            subtitle={t("ACCOUNT_BALANCES")}
            query={account}
            testId="home-cod-balance"
          >
            <div className="ov-metric-value">
              {overviewMoney(own?.codBalance, i18n.language, currency)}
            </div>
            <p className="ov-wallet-note">{t("COD_BALANCE_HINT")}</p>
            <OverviewLink to="/withdraw-requests/all/new">
              {t("REQUEST_WITHDRAWAL")}
            </OverviewLink>
            <OverviewLink to="/transactions/all/cod">
              {t("COD_LEDGER")}
            </OverviewLink>
          </OverviewSection>
          <OverviewSection title={t("ACCOUNT_TOOLS")}>
            <div
              className="ov-quick-grid"
              style={{ gridTemplateColumns: "minmax(0,1fr)" }}
            >
              <QuickAction
                to="/transactions/all/wallet"
                title={t("WALLET_LEDGER")}
                description={t("WALLET_LEDGER_HINT")}
                icon="account_balance_wallet"
              />
              <QuickAction
                to="/shipment-users/all"
                title={t("CONTACTS")}
                description={t("CONTACTS_HINT")}
                icon="contact_phone"
              />
              {user.isAffiliate && (
                <QuickAction
                  to="/affiliate-profile"
                  title={t("AFFILIATE_ACCOUNT")}
                  description={t("AFFILIATE_HINT")}
                  icon="groups"
                />
              )}
            </div>
          </OverviewSection>
        </div>
      </div>
      <div className="ov-grid-equal">
        <CarrierOptions
          account={own}
          accountReady={!!own}
          accountQuery={account}
        />
        <OverviewSection
          title={t("NEXT_STEPS")}
          subtitle={t("NEXT_STEPS_HINT")}
        >
          <div
            className="ov-quick-grid"
            style={{ gridTemplateColumns: "minmax(0,1fr)" }}
          >
            <QuickAction
              to="/profile"
              title={t("MY_ACCOUNT")}
              description={t("MY_ACCOUNT_HINT")}
              icon="verified_user"
            />
            <QuickAction
              to="/package-requests/all"
              title={t("PACKAGING_REQUESTS")}
              description={t("PACKAGING_HINT")}
              icon="inventory_2"
            />
          </div>
        </OverviewSection>
      </div>
      <OverviewFooter />
    </OverviewShell>
  );
}
