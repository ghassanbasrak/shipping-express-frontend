import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { RefreshOutlined } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
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
} from "../Utils";
import ShipmentHeader from "./ShipmentHeader";
import ShipmentOperations from "../shared-components/ShipmentOperations";
import ShipmentDocuments from "../shared-components/ShipmentDocuments";
import ShipmentViewDetails from "./components/ShipmentViewDetails";

export default function ShipmentView({ shipment }: { shipment: IShipment }) {
  const { t } = useTranslation("shipmentsApp"),
    user = useAppSelector(selectUser),
    [tab, setTab] = useState(0),
    [error, setError] = useState(""),
    [sync, state] = useSyncShipmentTrackingMutation(),
    synced = useRef(""),
    isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const row = decompressShipment(shipment),
    events = [...(row.trackingStats || [])].reverse(),
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
  const tabId = (value: number) => `shipment-view-tab-${value}`;
  const panelId = (value: number) => `shipment-view-panel-${value}`;
  return (
    <FusePageCarded
      header={
        <ShipmentHeader
          shipment={row}
          actions={
            <>
              <ShipmentDocuments row={shipment} buttonVariant="contained" />
              <ShipmentOperations row={shipment} display="buttons" />
              {tab === 1 && (
                <Button
                  color="primary"
                  variant="outlined"
                  className="min-h-44 rounded-8 px-12 text-13"
                  startIcon={<RefreshOutlined />}
                  disabled={state.isLoading || !canSyncShipmentTracking(row)}
                  onClick={refreshTracking}
                >
                  {t(state.isLoading ? "SYNCING" : "SYNC_TRACKING")}
                </Button>
              )}
            </>
          }
        />
      }
      content={
        <Box
          className="min-w-0 p-16"
          sx={{ bgcolor: "background.default" }}
          data-testid="shipment-view"
        >
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label={t("SHIPMENT_DETAILS")}
            className="min-h-48 rounded-12 border-1 px-4"
            sx={{ bgcolor: "background.paper", borderColor: "divider" }}
          >
            <Tab
              id={tabId(0)}
              aria-controls={panelId(0)}
              label={t("SHIPMENT_DETAILS")}
              className="min-h-48 text-13"
            />
            <Tab
              id={tabId(1)}
              aria-controls={panelId(1)}
              label={t("TRACKING")}
              className="min-h-48 text-13"
            />
            {canUpdateShipment(user) && (
              <Tab
                id={tabId(2)}
                aria-controls={panelId(2)}
                label={t("TRANSACTIONS")}
                className="min-h-48 text-13"
              />
            )}
          </Tabs>
          {(row.reason || row.trackingText) && (
            <Alert severity="info" className="mt-12">
              {row.reason} {row.trackingText}
            </Alert>
          )}
          {error && (
            <Alert
              severity="error"
              className="mt-12"
              action={
                <Button disabled={state.isLoading} onClick={refreshTracking}>
                  {t("RETRY")}
                </Button>
              }
            >
              {error}
            </Alert>
          )}
          <div
            id={panelId(tab)}
            role="tabpanel"
            aria-labelledby={tabId(tab)}
            className="min-w-0 pt-16"
          >
            {tab === 0 && <ShipmentViewDetails row={row} />}
            {tab === 1 && (
              <>
                {state.isLoading && (
                  <LinearProgress className="mb-12" aria-label={t("SYNCING")} />
                )}
                {!events.length && (
                  <Alert severity="info">{t("NO_TRACKING_EVENTS")}</Alert>
                )}
                <Box
                  component="ol"
                  className="m-0 list-none rounded-16 border-1 p-16"
                  sx={{ bgcolor: "background.paper", borderColor: "divider" }}
                  data-testid="shipment-tracking-events"
                >
                  {events.map((event, index) => (
                    <Box
                      component="li"
                      key={index}
                      className="flex gap-12 border-b-1 py-12 first:pt-0 last:border-b-0"
                      sx={{ borderColor: "divider" }}
                    >
                      <Box
                        className="mt-4 h-10 w-10 shrink-0 rounded-full"
                        sx={{
                          bgcolor: index === 0 ? "primary.main" : "divider",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <Typography className="break-words text-14 font-semibold">
                          {event.description || "—"}
                        </Typography>
                        <Typography
                          className="mt-4 text-12"
                          color="text.secondary"
                        >
                          {[event.date, event.location]
                            .filter(Boolean)
                            .join(" · ")}
                        </Typography>
                      </div>
                      {index === 0 && (
                        <Typography color="primary.main" className="text-12">
                          {t("VIEW_LATEST_UPDATE")}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
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
                  transactions={transactions.currentData?.results || []}
                  loading={transactions.isFetching}
                />
              </>
            )}
          </div>
        </Box>
      }
      scroll={isMobile ? "normal" : "content"}
    />
  );
}
