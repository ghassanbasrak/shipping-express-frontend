import { useTranslation } from "react-i18next";
import {
  OverviewSection,
  OverviewLink,
  OverviewEmpty,
  OverviewIcon,
  OverviewQuery,
} from "app/shared-components/overview/Overview";
import { overviewMoney } from "app/shared-components/overview/Utils";
import { getCurrentCurrency } from "../../../utils/currencyFormatter";
import { useGetShippingCompaniesQuery } from "../../../shipping-companies-app/ShippingCompaniesApi";
import IMerchant from "../../../merchants-app/models/IMerchant";
import { homeCarrierPrice } from "../../Utils";
export default function CarrierOptions({
  account,
  accountReady,
  accountQuery,
}: {
  account?: IMerchant;
  accountReady: boolean;
  accountQuery: OverviewQuery;
}) {
  const { t, i18n } = useTranslation("homeApp"),
    query = useGetShippingCompaniesQuery(
      { page: 0, pageSize: 50 },
      { refetchOnMountOrArgChange: true },
    ),
    validResponse = Array.isArray(query.currentData?.results),
    carriers = validResponse
      ? query.currentData.results.filter((c) => c?.isActive)
      : [],
    currency = getCurrentCurrency();
  return (
    <OverviewSection
      title={t("CARRIER_OPTIONS")}
      subtitle={t("CARRIER_OPTIONS_HINT")}
      query={query}
      testId="home-carrier-options"
      action={
        <OverviewLink to="/shipments/all/all/new">
          {t("ALL_OPTIONS")}
        </OverviewLink>
      }
    >
      {!carriers.length ? (
        <OverviewEmpty>
          {t(validResponse ? "NO_CARRIERS" : "CARRIER_DATA_UNAVAILABLE")}
        </OverviewEmpty>
      ) : (
        carriers.slice(0, 4).map((carrier) => (
          <div key={carrier.id} className="ov-carrier-row">
            <div>
              {carrier.logoUrl ? (
                <img
                  className="ov-carrier-logo"
                  src={carrier.logoUrl}
                  alt={carrier.name || ""}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="ov-quick-icon">
                  <OverviewIcon name="local_shipping" />
                </span>
              )}
            </div>
            <div className="ov-carrier-info">
              <strong>{carrier.name || carrier.id}</strong>
              <small>
                {carrier.shippingMethods?.includes("local")
                  ? accountReady
                    ? t("LOCAL_FROM", {
                        amount: overviewMoney(
                          homeCarrierPrice(carrier, account),
                          i18n.language,
                          currency,
                        ),
                      })
                    : t("PRICING_UNAVAILABLE")
                  : t("QUOTE_ON_REQUEST")}
                {carrier.fuelPercentage != null &&
                Number.isFinite(carrier.fuelPercentage)
                  ? ` · ${t("FUEL_FEE", { value: carrier.fuelPercentage })}`
                  : ""}
              </small>
            </div>
            <div className="ov-carrier-controls">
              <OverviewLink to={`/shipments/${carrier.id}/all/new`}>
                {t("SHIP")}
              </OverviewLink>
            </div>
          </div>
        ))
      )}
      <p className="ov-subtle-note">{t("CARRIER_PRICE_HINT")}</p>
    </OverviewSection>
  );
}
