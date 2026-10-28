import { Alert, Button, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useGetShipmentAccountQuery } from "../ShipmentsApi";
import IShipment from "../models/IShipment";
export default function ShipmentSettlementBalance({
  rows,
}: {
  rows: IShipment[];
}) {
  const { t } = useTranslation("shipmentsApp"),
    account = useGetShipmentAccountQuery(rows[0].userId, {
      refetchOnMountOrArgChange: true,
    });
  if (account.isError)
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => account.refetch()}>{t("RETRY")}</Button>}
      >
        {t("BALANCE_ERROR")}
      </Alert>
    );
  if (!account.currentData) return <Typography>{t("LOADING")}</Typography>;
  const merchant = account.currentData,
    balance = merchant.balance ?? 0;
  return (
    <Paper variant="outlined" className="p-16 space-y-8">
      <Typography className="font-semibold">
        {merchant.firstName} {merchant.lastName}
      </Typography>
      <Typography>
        {t("PREVIOUS_BALANCE")}: {balance.toFixed(2)}
      </Typography>
      {rows.map((row) => (
        <Typography key={row.id}>
          {row.trackingNumber || t("PENDING")}:{" "}
          {row.shipmentCod?.codPrice ?? row.codPrice ?? 0}
        </Typography>
      ))}
      <Typography className="font-semibold">
        {t("BALANCE_AFTER_SETTLEMENT")}:{" "}
        {(
          balance +
          rows.reduce(
            (sum, row) =>
              sum + Number(row.shipmentCod?.codPrice ?? row.codPrice ?? 0),
            0,
          )
        ).toFixed(2)}
      </Typography>
    </Paper>
  );
}
