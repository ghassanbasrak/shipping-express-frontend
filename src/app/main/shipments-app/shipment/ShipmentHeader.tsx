import { Button, Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { shipmentPath } from "../Utils";
export default function ShipmentHeader({
  calculator = false,
  returned = false,
}: {
  calculator?: boolean;
  returned?: boolean;
}) {
  const { t } = useTranslation("shipmentsApp"),
    {
      shippingCompanyId = "all",
      shippingType = "all",
      shipmentId = "new",
    } = useParams();
  return (
    <div className="w-full flex-1 p-24 sm:p-32 space-y-8">
      <Button
        component={Link}
        to={shipmentPath(shippingCompanyId, shippingType)}
        color="inherit"
      >
        {t("SHIPMENTS")}
      </Button>
      <Typography className="text-24 font-bold">
        {t(
          calculator
            ? "SHIPPING_PRICE_CALCULATOR"
            : returned
              ? "GENERATE_RETURNED_SHIPMENT"
              : shipmentId === "new"
                ? "ADD_SHIPMENT"
                : "SHIPMENT_DETAILS",
        )}
      </Typography>
    </div>
  );
}
