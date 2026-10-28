import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import Currency from "src/app/main/utils/currencyFormatter";
import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import ShipmentTransactionsTable from "app/shared-components/ShipmentTransactionsTable";
import {
  useGetShipmentTransactionsQuery,
  useSyncShipmentTrackingMutation,
} from "../ShipmentsApi";
import IShipment from "../models/IShipment";
import {
  canUpdateShipment,
  canSyncShipmentTracking,
  decompressShipment,
  shipmentErrorMessage,
  toShipmentStatusTitle,
  toShipmentStatusColor,
  toShipmentPaymentStatusTitle,
} from "../Utils";
import ShipmentHeader from "./ShipmentHeader";
import ShipmentOperations from "../shared-components/ShipmentOperations";
import ShipmentDocuments from "../shared-components/ShipmentDocuments";
import ShipmentCosts from "./components/ShipmentCosts";
export default function ShipmentView({ shipment }: { shipment: IShipment }) {
  const { t } = useTranslation("shipmentsApp"),
    user = useAppSelector(selectUser),
    [tab, setTab] = useState(0),
    [error, setError] = useState(""),
    [sync, state] = useSyncShipmentTrackingMutation(),
    synced = useRef(""),
    isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const row = decompressShipment(shipment),
    transactions = useGetShipmentTransactionsQuery(
      { trackingNumber: row.trackingNumber, userId: row.userId },
      { skip: !canUpdateShipment(user) || !row.trackingNumber || tab !== 2 },
    );
  async function refreshTracking() {
    if (state.isLoading || !canSyncShipmentTracking(row)) return;
    setError("");
    try {
      await sync(row.id).unwrap();
    } catch (e) {
      setError(shipmentErrorMessage(e, t("TRACKING_ERROR")));
    }
  }
  useEffect(() => {
    if (row.id !== synced.current && canSyncShipmentTracking(row)) {
      synced.current = row.id;
      refreshTracking();
    }
  }, [row.id]);
  return (
    <FusePageCarded
      header={<ShipmentHeader />}
      content={
        <>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            indicatorColor="secondary"
            textColor="secondary"
            classes={{ root: "w-full h-64 border-b-1" }}
          >
            <Tab label={t("SHIPMENT_DETAILS")} />
            <Tab label={t("TRACKING")} />
            {canUpdateShipment(user) && <Tab label={t("TRANSACTIONS")} />}
          </Tabs>
          <div className="p-16 sm:p-24 space-y-24" data-testid="shipment-view">
            {error && <Alert severity="error">{error}</Alert>}
            {tab === 0 && (
              <>
                <div className="flex flex-wrap items-center gap-16">
                  <Typography variant="h5">
                    {row.trackingNumber || t("PENDING")}
                  </Typography>
                  <Chip
                    label={t(toShipmentStatusTitle(row.status))}
                    className={toShipmentStatusColor(row.status)}
                  />
                  <ShipmentOperations row={shipment} />
                  <ShipmentDocuments row={shipment} />
                </div>
                {(row.reason || row.trackingText) && (
                  <Alert severity="info">
                    {row.reason} {row.trackingText}
                  </Alert>
                )}
                <Typography>
                  {row.shippingCompany?.name} · {row.method} ·{" "}
                  {row.createdAt?.slice(0, 10)}
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  {(["sender", "receiver"] as const).map((prefix) => (
                    <Paper
                      key={prefix}
                      variant="outlined"
                      className="p-16 space-y-8"
                    >
                      <Typography variant="h6">
                        {t(
                          prefix === "sender"
                            ? "SENDER_DETAILS"
                            : "RECEIVER_DETAILS",
                        )}
                      </Typography>
                      {(
                        [
                          "Name",
                          "Email",
                          "Phone",
                          "Phone1",
                          "CountryName",
                          "StateName",
                          "CityName",
                          "Street",
                          "ZipCode",
                        ] as const
                      ).map((field) => (
                        <Typography key={field}>
                          {row[`${prefix}${field}`] || ""}
                        </Typography>
                      ))}
                    </Paper>
                  ))}
                </div>
                <Typography>{row.description}</Typography>
                <Typography>
                  {row.length} × {row.width} × {row.height} cm · {row.weight} kg
                  · {row.packagesCount} {t("PACKAGES_COUNT")}
                </Typography>
                {row.products?.map((product, i) => (
                  <Typography key={i}>
                    {product.title} · {Currency(product.price ?? 0)}
                  </Typography>
                ))}
                {row.isCod && (
                  <Alert severity="info">
                    {t("CASH_ON_DELIVERY")}: {row.codPrice} ·{" "}
                    {t(
                      toShipmentPaymentStatusTitle(
                        shipment.shipmentCod?.codStatus,
                      ),
                    )}
                  </Alert>
                )}
                <ShipmentCosts price={row.shipmentPrice} />
              </>
            )}
            {tab === 1 && (
              <>
                <Button
                  disabled={state.isLoading || !canSyncShipmentTracking(row)}
                  onClick={refreshTracking}
                >
                  {t("SYNC_TRACKING")}
                </Button>
                {!row.trackingStats?.length && (
                  <Alert severity="info">{t("NO_TRACKING_EVENTS")}</Alert>
                )}
                <ol className="space-y-16">
                  {[...(row.trackingStats || [])].reverse().map((event, i) => (
                    <li key={i}>
                      <Typography className="font-semibold">
                        {event.description}
                      </Typography>
                      <Typography>
                        {event.date} · {event.location}
                      </Typography>
                    </li>
                  ))}
                </ol>
              </>
            )}
            {tab === 2 && canUpdateShipment(user) && (
              <>
                {transactions.isError && (
                  <Alert
                    severity="error"
                    action={
                      <Button onClick={() => transactions.refetch()}>
                        {t("RETRY")}
                      </Button>
                    }
                  >
                    {t("LOAD_ERROR")}
                  </Alert>
                )}
                <ShipmentTransactionsTable
                  transactions={transactions.data?.results || []}
                  loading={transactions.isFetching}
                />
              </>
            )}
          </div>
        </>
      }
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
