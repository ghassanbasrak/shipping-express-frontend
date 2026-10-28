import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  OverviewSection,
  OverviewLink,
  OverviewEmpty,
} from "app/shared-components/overview/Overview";
import { overviewDate } from "app/shared-components/overview/Utils";
import {
  shipmentStatus,
  toShipmentStatusTitle,
  toShipmentStatusColor,
} from "../../../shipments-app/Utils";
import { useGetHomeShipmentsQuery } from "../../HomeApi";
import { homeShipmentRows } from "../../Utils";
export default function RecentShipments() {
  const { t, i18n } = useTranslation("homeApp"),
    user = useAppSelector(selectUser),
    query = useGetHomeShipmentsQuery(user.id, {
      refetchOnMountOrArgChange: true,
    }),
    validResponse = Array.isArray(query.currentData?.results),
    rows = homeShipmentRows(
      validResponse ? query.currentData.results : [],
      user.id,
    );
  return (
    <OverviewSection
      title={t("SHIPMENT_ACTIVITY")}
      subtitle={t("RECENT_SHIPMENTS_HINT")}
      query={query}
      testId="home-recent-shipments"
      action={
        <OverviewLink to="/shipments/all/all">{t("VIEW_ALL")}</OverviewLink>
      }
    >
      {!validResponse ? (
        <OverviewEmpty>{t("SHIPMENT_DATA_UNAVAILABLE")}</OverviewEmpty>
      ) : !rows.length ? (
        <OverviewEmpty>
          <strong>{t("NO_SHIPMENTS")}</strong>
          <p>{t("NO_SHIPMENTS_HINT")}</p>
          <OverviewLink to="/shipments/all/all/new">
            {t("CREATE_SHIPMENT")}
          </OverviewLink>
        </OverviewEmpty>
      ) : (
        rows.map((row, index) => {
          const known = Object.values(shipmentStatus).includes(row.status),
            color = known
              ? toShipmentStatusColor(row.status, false)
              : "#64748b";
          return (
            <div
              key={row.id || index}
              className="ov-shipment"
              data-testid={`home-shipment-${row.id || index}`}
            >
              <div>
                {row.id ? (
                  <Link
                    to={`/shipments/${row.shippingCompanyId || "all"}/${row.method || "all"}/${row.id}/view`}
                  >
                    {row.trackingNumber || t("AWAITING_WAYBILL")}
                  </Link>
                ) : (
                  <strong>{row.trackingNumber || t("AWAITING_WAYBILL")}</strong>
                )}
                <small>
                  {row.shippingCompany?.name || t("CARRIER_NOT_ASSIGNED")}
                </small>
              </div>
              <div className="ov-shipment-receiver">
                {row.receiverName || t("RECEIVER_NOT_AVAILABLE")}
              </div>
              <div className="ov-shipment-status">
                <span
                  className="ov-status"
                  style={{
                    color: color === "#99CC00" ? "#5b7c00" : color,
                    background: `${color}12`,
                  }}
                >
                  {t(
                    known
                      ? toShipmentStatusTitle(row.status)
                      : "UNKNOWN_STATUS",
                  )}
                </span>
              </div>
              <div className="ov-shipment-date">
                {overviewDate(row.createdAt, i18n.language)}
              </div>
            </div>
          );
        })
      )}
    </OverviewSection>
  );
}
