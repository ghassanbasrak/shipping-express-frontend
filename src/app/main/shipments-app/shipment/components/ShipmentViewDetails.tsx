import { Box, Chip, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  LocalShippingOutlined,
  PhoneOutlined,
  MailOutline,
  LocationOnOutlined,
  Inventory2Outlined,
  PaymentsOutlined,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import Currency from "src/app/main/utils/currencyFormatter";
import type IShipment from "../../models/IShipment";
import {
  toShipmentPaymentStatusColor,
  toShipmentPaymentStatusTitle,
  toShipmentTypeTitle,
} from "../../Utils";
import ShipmentCosts from "./ShipmentCosts";

export default function ShipmentViewDetails({ row }: { row: IShipment }) {
  const { t } = useTranslation("shipmentsApp");
  const present = (value: unknown) =>
    value !== undefined && value !== null && value !== "";
  return (
    <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Paper
        variant="outlined"
        className="min-w-0 overflow-hidden rounded-16"
        sx={{ borderColor: "divider" }}
      >
        <Box
          className="flex items-center gap-8 border-b-1 px-16 py-12"
          sx={{ borderColor: "divider", color: "primary.main" }}
        >
          <LocalShippingOutlined fontSize="small" />
          <Typography component="h2" className="text-14 font-bold">
            {t("VIEW_ROUTE_CONTACTS")}
          </Typography>
        </Box>
        <div className="grid grid-cols-1 md:grid-cols-2">
          {(["sender", "receiver"] as const).map((prefix, index) => (
            <Box
              component="section"
              key={prefix}
              className={`min-w-0 p-16 ${index ? "border-t-1 md:border-s-1 md:border-t-0" : ""}`}
              sx={{ borderColor: "divider" }}
              data-testid={`shipment-view-${prefix}`}
            >
              <div className="mb-12 flex items-center gap-8">
                <Box
                  className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-11 font-bold"
                  sx={(theme) => ({
                    bgcolor: alpha(
                      theme.palette.primary.main,
                      index ? 0.12 : 0.06,
                    ),
                    color: "primary.main",
                  })}
                >
                  {index ? "B" : "A"}
                </Box>
                <Typography
                  className="text-12 font-semibold"
                  color="text.secondary"
                >
                  {t(
                    prefix === "sender" ? "SENDER_DETAILS" : "RECEIVER_DETAILS",
                  )}
                </Typography>
              </div>
              <Typography className="mb-12 break-words text-18 font-bold">
                {row[`${prefix}Name`] || "—"}
              </Typography>
              <div className="space-y-10 text-14">
                <div className="flex items-start gap-8">
                  <PhoneOutlined color="disabled" className="mt-2 text-17" />
                  <bdi dir="ltr" className="min-w-0 break-words">
                    {row[`${prefix}Phone`] || "—"}
                  </bdi>
                </div>
                {row[`${prefix}Email`] && (
                  <div className="flex items-start gap-8">
                    <MailOutline color="disabled" className="mt-2 text-17" />
                    <bdi className="min-w-0 [overflow-wrap:anywhere]">
                      {row[`${prefix}Email`]}
                    </bdi>
                  </div>
                )}
                <div className="flex items-start gap-8">
                  <LocationOnOutlined
                    color="disabled"
                    className="mt-2 text-17"
                  />
                  <div className="min-w-0 space-y-4 break-words text-13 leading-relaxed">
                    <Typography className="text-13 font-medium">
                      {[
                        row[`${prefix}CityName`],
                        row[`${prefix}StateName`],
                        row[`${prefix}CountryName`],
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </Typography>
                    <Typography className="text-13" color="text.secondary">
                      {row[`${prefix}Street`] || "—"}
                    </Typography>
                    {row[`${prefix}ZipCode`] && (
                      <Typography className="text-12" color="text.secondary">
                        {t("ZIP_CODE")}: <bdi>{row[`${prefix}ZipCode`]}</bdi>
                      </Typography>
                    )}
                  </div>
                </div>
              </div>
            </Box>
          ))}
        </div>
        <Box
          className="border-t-1 p-16"
          sx={(theme) => ({
            borderColor: "divider",
            bgcolor: alpha(theme.palette.primary.main, 0.018),
          })}
        >
          <div className="mb-12 flex items-center gap-8">
            <Inventory2Outlined color="primary" fontSize="small" />
            <Typography component="h2" className="text-14 font-bold">
              {t("VIEW_PARCEL_DETAILS")}
            </Typography>
          </div>
          <dl className="m-0 grid grid-cols-2 gap-x-12 gap-y-10 sm:grid-cols-4">
            {[
              [
                t("SHIPMENT_TYPE"),
                row.type ? t(toShipmentTypeTitle(row.type)) : "—",
              ],
              [
                t("WEIGHT"),
                present(row.weight) ? `${row.weight} ${t("KG")}` : "—",
              ],
              [t("PACKAGES_COUNT"), row.packagesCount ?? "—"],
              [
                t("VIEW_DIMENSIONS_SHORT"),
                [row.length, row.width, row.height].every(present)
                  ? `${row.length} × ${row.width} × ${row.height} ${t("CM")}`
                  : "—",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <Typography
                  component="dt"
                  className="mb-4 text-12"
                  color="text.secondary"
                >
                  {label}
                </Typography>
                <Typography
                  component="dd"
                  className="m-0 text-14 font-semibold"
                >
                  <bdi>{value}</bdi>
                </Typography>
              </div>
            ))}
          </dl>
          {row.description && (
            <Typography className="mt-12 whitespace-pre-wrap break-words text-13">
              <Typography
                component="span"
                color="text.secondary"
                className="me-8 text-12"
              >
                {t("SHIPMENT_DESCRIPTION")}:
              </Typography>
              {row.description}
            </Typography>
          )}
          {!!row.products?.length && (
            <ul className="mb-0 mt-10 list-none space-y-6 p-0">
              {row.products.map((product, index) => (
                <li
                  key={product.id || index}
                  className="flex flex-wrap justify-between gap-8 text-13"
                >
                  <span className="min-w-0 break-words">
                    {product.title || "—"}
                    {present(product.quantity) && (
                      <span className="ms-8">× {product.quantity}</span>
                    )}
                  </span>
                  <bdi className="font-semibold">
                    {present(product.price) ? Currency(product.price) : "—"}
                  </bdi>
                </li>
              ))}
            </ul>
          )}
        </Box>
      </Paper>
      <Paper
        component="aside"
        variant="outlined"
        className="min-w-0 overflow-hidden rounded-16"
        sx={{ borderColor: "divider" }}
      >
        <Box
          className="flex items-center gap-8 border-b-1 px-16 py-12"
          sx={{ borderColor: "divider", color: "primary.main" }}
        >
          <PaymentsOutlined fontSize="small" />
          <Typography component="h2" className="text-14 font-bold">
            {t("VIEW_SHIPPING_COSTS")}
          </Typography>
        </Box>
        <div className="p-16">
          {row.shipmentPrice &&
          Object.values(row.shipmentPrice).some(present) ? (
            <ShipmentCosts price={row.shipmentPrice} highlightTotal />
          ) : (
            <Typography color="text.secondary" className="text-13">
              {t("VIEW_COSTS_UNAVAILABLE")}
            </Typography>
          )}
        </div>
        {row.isCod && (
          <Box className="border-t-1 p-16" sx={{ borderColor: "divider" }}>
            <div className="mb-10 flex flex-wrap items-center justify-between gap-8">
              <Typography component="h2" className="text-14 font-bold">
                {t("CASH_ON_DELIVERY")}
              </Typography>
              <Chip
                size="small"
                label={t(
                  toShipmentPaymentStatusTitle(row.shipmentCod?.codStatus),
                )}
                className={toShipmentPaymentStatusColor(
                  row.shipmentCod?.codStatus,
                )}
              />
            </div>
            <Typography className="mb-6 text-12" color="text.secondary">
              {t("VIEW_COD_COLLECT")}
            </Typography>
            <Typography
              className="text-24 font-bold"
              color="primary.main"
              data-testid="shipment-view-cod-total"
            >
              <bdi>{present(row.codPrice) ? Currency(row.codPrice) : "—"}</bdi>
            </Typography>
            {row.shipmentCod?.reference && (
              <Typography
                color="text.secondary"
                className="mt-8 break-words text-12"
              >
                {t("COD_REFERENCE")}: {row.shipmentCod.reference}
              </Typography>
            )}
          </Box>
        )}
      </Paper>
    </div>
  );
}
