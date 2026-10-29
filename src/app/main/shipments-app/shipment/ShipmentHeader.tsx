import { Box, Button, Chip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link, useParams } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { shipmentPath } from "../Utils";

export default function ShipmentHeader({
  calculator = false,
  returned = false,
}: {
  calculator?: boolean;
  returned?: boolean;
}) {
  const { t } = useTranslation("shipmentsApp"),
    theme = useTheme(),
    form = useFormContext(),
    {
      shippingCompanyId = "all",
      shippingType = "all",
      shipmentId = "new",
    } = useParams();
  const method = form?.watch("method"),
    carrier = form?.watch("shippingCompany")?.name;
  const mode = calculator
    ? "CALCULATOR"
    : returned
      ? "RETURN"
      : shipmentId === "new"
        ? "NEW"
        : "DETAILS";
  return (
    <div className="flex w-full flex-1 items-center justify-between gap-16 p-16 sm:p-32">
      <div className="flex min-w-0 items-center gap-16">
        <Box
          className="hidden sm:grid"
          sx={{
            width: 56,
            height: 56,
            flexShrink: 0,
            placeItems: "center",
            borderRadius: "16px",
            backgroundColor: "rgba(255,255,255,.16)",
            border: "1px solid rgba(255,255,255,.25)",
          }}
        >
          <FuseSvgIcon size={30} color="inherit">
            {calculator
              ? "heroicons-outline:calculator"
              : "heroicons-outline:truck"}
          </FuseSvgIcon>
        </Box>
        <div className="min-w-0">
          <Button
            component={Link}
            to={shipmentPath(shippingCompanyId, shippingType)}
            color="inherit"
            size="small"
            sx={{ ml: -1, minWidth: 0, opacity: 0.85 }}
            startIcon={
              <FuseSvgIcon size={18}>
                {theme.direction === "rtl"
                  ? "heroicons-outline:arrow-sm-right"
                  : "heroicons-outline:arrow-sm-left"}
              </FuseSvgIcon>
            }
          >
            {t("SHIPMENTS")}
          </Button>
          <Typography className="truncate text-20 sm:text-26 font-bold leading-tight">
            {t(
              {
                CALCULATOR: "SHIPPING_PRICE_CALCULATOR",
                RETURN: "GENERATE_RETURNED_SHIPMENT",
                NEW: "ADD_SHIPMENT",
                DETAILS: "SHIPMENT_DETAILS",
              }[mode],
            )}
          </Typography>
          {mode !== "DETAILS" && (
            <Typography className="hidden sm:block text-13 opacity-80">
              {t(`SHIPMENT_FORM_SUBTITLE_${mode}`)}
            </Typography>
          )}
        </div>
      </div>
      {mode !== "DETAILS" && (
        <div className="hidden shrink-0 gap-8 md:flex">
          {method && (
            <Chip
              size="small"
              label={t(method === "international" ? "INTERNATIONAL" : "LOCAL")}
              sx={{
                color: "inherit",
                backgroundColor: "rgba(255,255,255,.16)",
              }}
            />
          )}
          {carrier && (
            <Chip
              size="small"
              label={carrier}
              sx={{
                color: "inherit",
                backgroundColor: "rgba(255,255,255,.16)",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
