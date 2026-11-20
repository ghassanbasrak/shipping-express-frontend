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
import type { ReactNode } from "react";
import type IShipment from "../models/IShipment";
import {
  shipmentPath,
  toShipmentStatusColor,
  toShipmentStatusTitle,
  toShippingTypeTitle,
} from "../Utils";

export default function ShipmentHeader({
  calculator = false,
  returned = false,
  shipment,
  actions,
}: {
  calculator?: boolean;
  returned?: boolean;
  shipment?: IShipment;
  actions?: ReactNode;
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
    <FeatureHeader className={shipment ? "!gap-12" : ""}>
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
          eyebrow={shipment ? t("SHIPMENT_DETAILS") : undefined}
          icon={
            calculator
              ? "heroicons-outline:calculator"
              : "heroicons-outline:truck"
          }
          description={
            shipment ? (
              <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
                <Chip
                  size="small"
                  label={t(toShipmentStatusTitle(shipment.status))}
                  className={toShipmentStatusColor(shipment.status)}
                />
                <span>
                  {[
                    shipment.shippingCompany?.name,
                    shipment.method
                      ? t(toShippingTypeTitle(shipment.method))
                      : "",
                    shipment.createdAt?.slice(0, 10),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            ) : mode !== "DETAILS" ? (
              t(`SHIPMENT_FORM_SUBTITLE_${mode}`)
            ) : (
              t("SHIPMENT_VIEW_SUBTITLE")
            )
          }
        >
          {shipment ? (
            <bdi className="select-all">
              {shipment.trackingNumber || t("PENDING")}
            </bdi>
          ) : (
            t(
              {
                CALCULATOR: "SHIPPING_PRICE_CALCULATOR",
                RETURN: "GENERATE_RETURNED_SHIPMENT",
                NEW: "ADD_SHIPMENT",
                DETAILS: "SHIPMENT_DETAILS",
              }[mode],
            )
          )}
        </FeatureHeaderHeading>
        {actions && (
          <FeatureHeaderActions>
            <div
              className="flex min-w-0 flex-wrap items-center gap-8 lg:justify-end"
              data-testid="shipment-view-header-actions"
            >
              {actions}
            </div>
          </FeatureHeaderActions>
        )}
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
