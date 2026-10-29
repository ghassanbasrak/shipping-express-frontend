import { ReactNode } from "react";
import { Alert, Box, Button, Divider, Paper, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import Currency from "src/app/main/utils/currencyFormatter";
import type { ShipmentFormValues } from "../../models/ShipmentSchema";
import type { IShipmentPrice } from "../../models/IShipment";
import ShipmentCosts from "../components/ShipmentCosts";
import type { ShipmentSectionStatus } from "../components/ShipmentSection";

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
export type ShipmentChecklistItem = {
  id: string;
  label: string;
  status: ShipmentSectionStatus;
};

function SummaryRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-12">
      <Box
        sx={(theme) => ({
          width: 32,
          height: 32,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          borderRadius: "10px",
          color: theme.palette.primary.main,
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
        })}
      >
        <FuseSvgIcon size={18} color="inherit">
          {icon}
        </FuseSvgIcon>
      </Box>
      <div className="min-w-0 flex-1">
        <Typography color="text.secondary" className="text-11 leading-tight">
          {label}
        </Typography>
        <Typography className="text-13 font-semibold break-words">
          {children}
        </Typography>
      </div>
    </div>
  );
}

export default function ShipmentSummary({
  form,
  quotes,
  outcomes,
  stale,
  busy,
  action,
  checklist,
  calculator = false,
  canCreate,
  onReview,
  onCreate,
  onGoTo,
}: {
  form: ShipmentFormValues;
  quotes: ShipmentQuote[];
  outcomes: ShipmentOutcome[];
  stale: boolean;
  busy: boolean;
  action?: "review" | "create";
  checklist: ShipmentChecklistItem[];
  calculator?: boolean;
  canCreate: boolean;
  onReview: () => void;
  onCreate: () => void;
  onGoTo: (id: string) => void;
}) {
  const { t } = useTranslation("shipmentsApp");
  const receiverNames = [
      ...(form.receivers || []).map((item) => item.receiverName),
      form.receiverName,
    ].filter(Boolean),
    nameOf = (key: string) =>
      form.receivers.find((item) => item.key === key)?.receiverName ||
      form.receiverName,
    good = quotes.filter((item) => item.cost && !item.error),
    total = good.reduce((sum, item) => sum + (item.cost?.total || 0), 0);
  return (
    <Paper
      variant="outlined"
      data-testid="shipment-review"
      sx={(theme) => ({
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: `0 10px 30px -18px ${alpha(theme.palette.primary.main, 0.5)}`,
      })}
    >
      <Box
        sx={(theme) => ({
          px: 2.5,
          py: 2,
          color: theme.palette.primary.contrastText,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        })}
      >
        <Typography className="text-16 font-bold" color="inherit">
          {t("SHIPMENT_SUMMARY")}
        </Typography>
        <Typography className="text-12 opacity-80" color="inherit">
          {t("SHIPMENT_SUMMARY_HINT")}
        </Typography>
      </Box>
      <div className="space-y-16 p-16 sm:p-20">
        <div className="space-y-12">
          <SummaryRow
            icon="heroicons-outline:globe-alt"
            label={t("SHIPPING_TYPE")}
          >
            {t(form.method === "international" ? "INTERNATIONAL" : "LOCAL")}
          </SummaryRow>
          <SummaryRow
            icon="heroicons-outline:truck"
            label={t("SHIPPING_COMPANY")}
          >
            {form.shippingCompany?.name || (
              <span className="opacity-60">{t("NOT_SELECTED_YET")}</span>
            )}
          </SummaryRow>
          {!calculator && (
            <SummaryRow
              icon="heroicons-outline:switch-horizontal"
              label={t("SENDER_AND_RECEIVERS")}
            >
              {form.senderName || "—"}
              {" → "}
              {receiverNames.length ? receiverNames.join(", ") : "—"}
            </SummaryRow>
          )}
          <SummaryRow
            icon="heroicons-outline:cube"
            label={t("SHIPMENT_DETAILS")}
          >
            <span dir="ltr">
              {form.weight ?? "—"} {t("KG")} × {form.packagesCount ?? "—"}
            </span>
          </SummaryRow>
          {form.isCod && (
            <SummaryRow
              icon="heroicons-outline:cash"
              label={t("COLLECTED_AMOUNT")}
            >
              {Currency(form.codPrice || 0)}
            </SummaryRow>
          )}
        </div>
        <Divider />
        <div className="space-y-8">
          {checklist.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onGoTo(item.id)}
              className="flex w-full items-center gap-8 bg-transparent py-2 text-start"
              style={{ cursor: "pointer", border: 0, color: "inherit" }}
            >
              <FuseSvgIcon
                size={18}
                color={
                  item.status === "complete"
                    ? "success"
                    : item.status === "error"
                      ? "error"
                      : "disabled"
                }
              >
                {item.status === "complete"
                  ? "heroicons-solid:check-circle"
                  : "heroicons-outline:minus-circle"}
              </FuseSvgIcon>
              <Typography
                className="text-13"
                color={
                  item.status === "complete" ? "text.primary" : "text.secondary"
                }
              >
                {item.label}
              </Typography>
            </button>
          ))}
        </div>
        <Divider />
        {stale && quotes.length > 0 && (
          <Alert severity="info">{t("QUOTE_CHANGED")}</Alert>
        )}
        {quotes.length > 0 && (
          <div
            className="space-y-12"
            style={{ maxHeight: 320, overflowY: "auto" }}
          >
            {quotes.map((quote) => (
              <Box
                key={quote.key}
                sx={(theme) => ({
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: "14px",
                  p: 1.5,
                  opacity: stale ? 0.55 : 1,
                })}
                className="space-y-8"
              >
                <Typography className="text-13 font-semibold">
                  {nameOf(quote.key)}
                </Typography>
                {quote.error ? (
                  <Alert severity="error">{quote.error}</Alert>
                ) : (
                  quote.cost && <ShipmentCosts price={quote.cost} />
                )}
              </Box>
            ))}
          </div>
        )}
        {good.length > 1 && (
          <div className="flex items-center justify-between gap-8">
            <Typography className="font-semibold">{t("TOTAL")}</Typography>
            <Typography dir="ltr" className="text-16 font-bold">
              {Currency(total)}
            </Typography>
          </div>
        )}
        {outcomes.map((outcome) => (
          <Alert
            key={outcome.key}
            severity={outcome.success ? "success" : "error"}
            data-testid={`shipment-outcome-${outcome.key}`}
          >
            {nameOf(outcome.key)}:{" "}
            {outcome.success
              ? t(
                  outcome.id
                    ? "SHIPMENT_CREATED_SUCCESSFULLY"
                    : "SHIPMENT_CREATION_PENDING",
                )
              : outcome.message}
          </Alert>
        ))}
        <div className="space-y-8">
          <Button
            fullWidth
            disabled={busy}
            onClick={onReview}
            variant={calculator ? "contained" : "outlined"}
            size="large"
            sx={{ borderRadius: "12px" }}
            startIcon={
              <FuseSvgIcon size={20}>heroicons-outline:calculator</FuseSvgIcon>
            }
            data-testid="review-shipment-costs"
          >
            {action === "review" ? t("REVIEWING") : t("REVIEW_SHIPMENT_COSTS")}
          </Button>
          {!calculator && (
            <LoadingButton
              fullWidth
              variant="contained"
              size="large"
              loading={busy && action === "create"}
              disabled={!canCreate}
              onClick={onCreate}
              sx={{ borderRadius: "12px" }}
              startIcon={
                <FuseSvgIcon size={20}>
                  heroicons-outline:paper-airplane
                </FuseSvgIcon>
              }
              data-testid="create-shipments"
            >
              {t("CREATE_SHIPMENT")}
            </LoadingButton>
          )}
        </div>
      </div>
    </Paper>
  );
}
