import { Chip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Currency from "../../utils/currencyFormatter";
import { displayName } from "../../countries-app/Utils";
import IPackageRequest from "../models/IPackageRequest";
import {
  toPackageRequestStatusTitle,
  toPackageRequestStatusColor,
} from "../Utils";
export default function PackageRequestSummary({
  request,
}: {
  request: IPackageRequest;
}) {
  const { t } = useTranslation("packageRequestsApp");
  return (
    <div className="space-y-16 min-w-0" data-testid="package-request-summary">
      <Chip
        label={t(toPackageRequestStatusTitle(request.status))}
        className={toPackageRequestStatusColor(request.status) + " text-white"}
      />
      <Typography className="font-semibold text-18">
        {t("REQUEST_PRODUCTS")} ({Currency(request.amount)})
      </Typography>
      {(request.products || []).map((product, index) => (
        <div
          key={product.id || index}
          className="flex flex-wrap justify-between gap-8"
        >
          <Typography>{displayName(product.name)}</Typography>
          <Typography className="font-semibold">
            {product.count ?? 0} {t("PIECES")}
          </Typography>
        </div>
      ))}
      <Typography className="font-semibold text-18">
        {t("SHIPPING_ADDRESS_AND_CONTACT_INFORMATION")}
      </Typography>
      <Typography className="break-words">{request.fullName}</Typography>
      <Typography dir="ltr" className="text-start break-all">
        {request.phone}
      </Typography>
      <Typography className="break-words">
        {[
          displayName(request.shippingAddress?.country?.name) ||
            request.shippingAddress?.countryId,
          displayName(request.shippingAddress?.state?.name) ||
            request.shippingAddress?.stateId,
          displayName(request.shippingAddress?.city?.name) ||
            request.shippingAddress?.cityId,
          request.shippingAddress?.street,
          request.shippingAddress?.zipCode,
        ]
          .filter(Boolean)
          .join(" - ")}
      </Typography>
      {request.description && (
        <>
          <Typography className="font-semibold">{t("NOTES")}</Typography>
          <Typography className="whitespace-pre-wrap break-words">
            {request.description}
          </Typography>
        </>
      )}
    </div>
  );
}
