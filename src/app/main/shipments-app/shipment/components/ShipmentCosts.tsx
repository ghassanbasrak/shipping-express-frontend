import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import Currency from "src/app/main/utils/currencyFormatter";
import { IShipmentPrice } from "../../models/IShipment";
export default function ShipmentCosts({
  price = {},
  highlightTotal = false,
}: {
  price: IShipmentPrice;
  highlightTotal?: boolean;
}) {
  const { t } = useTranslation("shipmentsApp");
  const rows = [
    ["shippingCompanyPrice", "SHIPPING_COMPANY_PRICE"],
    ["extraWeightPrice", "EXTRA_WEIGHT_PRICE"],
    ["codPrice", "CASH_ON_DELIVERY_SERVICE_PRICE"],
    ["subtotal", "SUBTOTAL"],
    ["fuelTotal", "FUEL_FEES"],
    ["internationalDiscount", "PLATFORM_DISCOUNT"],
    ["couponDiscount", "COUPON_DISCOUNT"],
    ["totalDiscount", "TOTAL_DISCOUNT"],
    ["total", "TOTAL"],
  ];
  return (
    <div className="space-y-8" data-testid="shipment-costs">
      {rows
        .filter(([key]) => price[key] !== undefined)
        .map(([key, label]) => (
          <Box
            key={key}
            className={`flex flex-wrap items-center justify-between gap-12 ${highlightTotal && key === "total" ? "!mt-12 rounded-12 p-12" : ""}`}
            sx={(theme) => ({
              bgcolor:
                highlightTotal && key === "total"
                  ? alpha(theme.palette.primary.main, 0.065)
                  : undefined,
            })}
          >
            <Typography
              className={
                highlightTotal
                  ? key === "total"
                    ? "text-14 font-bold"
                    : "text-13"
                  : ""
              }
            >
              {t(label)}
            </Typography>
            <Typography
              dir="ltr"
              className={
                highlightTotal && key === "total"
                  ? "text-20 font-bold"
                  : "font-semibold"
              }
              color={
                highlightTotal && key === "total"
                  ? "primary.main"
                  : "text.primary"
              }
              data-testid={`shipment-cost-${key}`}
            >
              {Currency(price[key] ?? 0)}
            </Typography>
          </Box>
        ))}
    </div>
  );
}
