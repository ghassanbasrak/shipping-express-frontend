import { Link } from "react-router-dom";
import { ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
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
  quoteId?: string;
  error?: string;
};
export type ShipmentOutcome = {
  key: string;
  success: boolean;
  uncertain?: boolean;
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
  stage,
  canCreate,
  onContinue,
  onEdit,
  detailsLocked = false,
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
  stage: "details" | "review";
  canCreate: boolean;
  onContinue: () => void;
  onEdit: () => void;
  detailsLocked?: boolean;
  onReview: () => void;
  onCreate: () => void;
  onGoTo: (id: string) => void;
}) {
  const { t, i18n } = useTranslation("shipmentsApp");
  const receiverNames = [
      ...(form.receivers || []).map((item) => item.receiverName),
      form.receiverName,
    ].filter(Boolean),
    nameOf = (key: string) =>
      form.receivers.find((item) => item.key === key)?.receiverName ||
      form.receiverName,
    good = quotes.filter((item) => item.cost && !item.error),
    total = good.reduce((sum, item) => sum + (item.cost?.total || 0), 0);
  if (stage === "details")
    return (
      <Paper
        variant="outlined"
        className="rounded-16 p-16 sm:p-24"
        data-testid="shipment-continue"
      >
        <div className="flex flex-col gap-16 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-8">
            <Typography className="text-16 font-semibold">
              {t("READY_FOR_CARRIER")}
            </Typography>
            <Typography className="text-13" color="text.secondary">
              {t("READY_FOR_CARRIER_HINT")}
            </Typography>
            <div className="flex flex-wrap gap-x-16 gap-y-8">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={busy}
                  onClick={() => onGoTo(item.id)}
                  className="flex items-center gap-6 border-0 bg-transparent p-0 text-start text-12"
                  style={{ color: "inherit", cursor: "pointer" }}
                >
                  <FuseSvgIcon
                    size={16}
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
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <Button
            variant="contained"
            color="primary"
            size="large"
            className="min-h-48 shrink-0 rounded-12"
            disabled={busy}
            onClick={onContinue}
            data-testid="submit-shipment-details"
            endIcon={
              <FuseSvgIcon size={20}>heroicons-outline:truck</FuseSvgIcon>
            }
          >
            {t("CONTINUE_TO_CARRIERS")}
          </Button>
        </div>
      </Paper>
    );
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
          {t("PRICE_REVIEW")}
        </Typography>
        <Typography className="text-12 opacity-80" color="inherit">
          {t("PRICE_REVIEW_HINT")}
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
              {i18n.dir() === "rtl" ? " ← " : " → "}
              {receiverNames.length ? receiverNames.join(", ") : "—"}
            </SummaryRow>
          )}
          <SummaryRow
            icon="heroicons-outline:cube"
            label={t("SHIPMENT_DETAILS")}
          >
            <span dir="ltr" className="inline-flex items-center gap-4">
              <span>{form.weight ?? "—"}</span>
              <span>{t("KG")}</span>
              <span>×</span>
              <span>{form.packagesCount ?? "—"}</span>
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
        {busy && action === "review" && (
          <div className="space-y-12" role="status">
            <LinearProgress />
            <Typography className="text-13" color="text.secondary">
              {t("REVIEWING")}
            </Typography>
          </div>
        )}
        {!quotes.length && action !== "review" && (
          <Typography
            className="text-13 leading-relaxed"
            color="text.secondary"
          >
            {t(
              form.shippingCompanyId
                ? "PRICES_AFTER_VALIDATION"
                : "SELECT_CARRIER_FOR_PRICES",
            )}
          </Typography>
        )}
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
            severity={
              outcome.success
                ? "success"
                : outcome.uncertain
                  ? "warning"
                  : "error"
            }
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
        {outcomes.some((item) => item.uncertain) && (
          <Button
            component={Link}
            to="/shipments/all/all"
            variant="outlined"
            color="primary"
          >
            {t("SHIPMENTS")}
          </Button>
        )}
        <div className="space-y-8">
          <Button
            fullWidth
            color="primary"
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
            {action === "review" ? t("REVIEWING_ALL_CARRIERS") : t("REFRESH_CARRIER_OFFERS")}
          </Button>
          {!calculator && (
            <LoadingButton
              fullWidth
              color="primary"
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
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            disabled={busy || detailsLocked}
            onClick={onEdit}
            data-testid="edit-shipment-details"
            className="min-h-44 rounded-12"
          >
            {t("EDIT_DETAILS")}
          </Button>
        </div>
      </div>
    </Paper>
  );
}
