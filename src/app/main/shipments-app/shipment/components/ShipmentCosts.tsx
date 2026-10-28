import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Currency from "src/app/main/utils/currencyFormatter";
import { IShipmentPrice } from "../../models/IShipment";
export default function ShipmentCosts({
  price = {},
}: {
  price: IShipmentPrice;
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
          <div key={key} className="flex flex-wrap justify-between gap-16">
            <Typography>{t(label)}</Typography>
            <Typography
              dir="ltr"
              className="font-semibold"
              data-testid={`shipment-cost-${key}`}
            >
              {Currency(price[key] ?? 0)}
            </Typography>
          </div>
        ))}
    </div>
  );
}
