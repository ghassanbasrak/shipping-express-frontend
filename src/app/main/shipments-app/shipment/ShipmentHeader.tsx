import FeatureHeader, {
  FeatureHeaderHeading,
  FeatureHeaderRow,
  FeatureHeaderActions,
} from "app/shared-components/feature-header/FeatureHeader";
import { Chip, Typography } from "@mui/material";
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
    <FeatureHeader>
      <Typography
        className="flex items-center self-start gap-4 text-12 font-medium hover:underline"
        component={Link}
        role="button"
        to={shipmentPath(shippingCompanyId, shippingType)}
        color="inherit"
      >
        <FuseSvgIcon size={20}>
          {theme.direction === "ltr"
            ? "heroicons-outline:arrow-sm-left"
            : "heroicons-outline:arrow-sm-right"}
        </FuseSvgIcon>
        <span className="flex mx-4 font-medium">{t("SHIPMENTS")}</span>
      </Typography>
      <FeatureHeaderRow>
        <FeatureHeaderHeading
          feature="shipments-app"
          icon={
            calculator
              ? "heroicons-outline:calculator"
              : "heroicons-outline:truck"
          }
          description={
            mode !== "DETAILS" ? t(`SHIPMENT_FORM_SUBTITLE_${mode}`) : undefined
          }
        >
          {t(
            {
              CALCULATOR: "SHIPPING_PRICE_CALCULATOR",
              RETURN: "GENERATE_RETURNED_SHIPMENT",
              NEW: "ADD_SHIPMENT",
              DETAILS: "SHIPMENT_DETAILS",
            }[mode],
          )}
        </FeatureHeaderHeading>
        {mode !== "DETAILS" && (
          <FeatureHeaderActions>
            {method && (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={t(
                  method === "international" ? "INTERNATIONAL" : "LOCAL",
                )}
              />
            )}
            {carrier && (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={carrier}
              />
            )}
          </FeatureHeaderActions>
        )}
      </FeatureHeaderRow>
    </FeatureHeader>
  );
}
