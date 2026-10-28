import { Alert, Button, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ShipmentFormValues } from "../../models/ShipmentSchema";
import { IShipmentPrice } from "../../models/IShipment";
import ShipmentCosts from "../components/ShipmentCosts";
export type ShipmentQuote = {
  key: string;
  cost?: IShipmentPrice;
  error?: string;
};
export type ShipmentOutcome = {
  key: string;
  success: boolean;
  id?: string;
  message?: string;
};
export default function ReviewTab({
  form,
  quotes,
  outcomes,
  stale,
  busy,
  onReview,
}: {
  form: ShipmentFormValues;
  quotes: ShipmentQuote[];
  outcomes: ShipmentOutcome[];
  stale: boolean;
  busy: boolean;
  onReview: () => void;
}) {
  const { t } = useTranslation("shipmentsApp");
  return (
    <div className="space-y-16" data-testid="shipment-review">
      <Typography className="text-18 font-semibold">
        {t("PREVIEW_SHIPMENT")}
      </Typography>
      <Typography>
        {form.shippingCompany?.name} — {form.senderName}
      </Typography>
      <Typography>
        {form.description} / {form.weight} {t("KG")} / {form.packagesCount}
      </Typography>
      {stale && <Alert severity="info">{t("QUOTE_CHANGED")}</Alert>}
      <Button
        disabled={busy}
        onClick={onReview}
        variant="outlined"
        data-testid="review-shipment-costs"
      >
        {t("REVIEW_SHIPMENT_COSTS")}
      </Button>
      {quotes.map((quote) => (
        <Paper key={quote.key} variant="outlined" className="p-16 space-y-16">
          <Typography className="font-semibold">
            {form.receivers.find((item) => item.key === quote.key)
              ?.receiverName || form.receiverName}
          </Typography>
          {quote.error ? (
            <Alert severity="error">{quote.error}</Alert>
          ) : (
            quote.cost && <ShipmentCosts price={quote.cost} />
          )}
        </Paper>
      ))}
      {outcomes.map((outcome) => (
        <Alert
          key={outcome.key}
          severity={outcome.success ? "success" : "error"}
          data-testid={`shipment-outcome-${outcome.key}`}
        >
          {form.receivers.find((item) => item.key === outcome.key)
            ?.receiverName || form.receiverName}
          :{" "}
          {outcome.success
            ? t(
                outcome.id
                  ? "SHIPMENT_CREATED_SUCCESSFULLY"
                  : "SHIPMENT_CREATION_PENDING",
              )
            : outcome.message}
        </Alert>
      ))}
    </div>
  );
}
