import { useState } from "react";
import { Alert, Button, Chip, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useLazyGetShipmentCouponsQuery } from "../../ShipmentsApi";
import type { ShipmentFormValues } from "../../models/ShipmentSchema";
import ShipmentField from "../components/ShipmentField";

export default function PaymentSection({
  disabled = false,
  returned = false,
}: {
  disabled?: boolean;
  returned?: boolean;
}) {
  const { t } = useTranslation("shipmentsApp"),
    { watch, setValue } = useFormContext<ShipmentFormValues>(),
    form = watch(),
    [getCoupon, { isFetching }] = useLazyGetShipmentCouponsQuery(),
    [error, setError] = useState<string>();
  async function check() {
    setError(undefined);
    try {
      const result = await getCoupon(form.couponCode, false).unwrap(),
        coupon = result.results.find(
          (item) => item.code?.toLowerCase() === form.couponCode?.toLowerCase(),
        );
      if (!coupon) throw new Error(t("INVALID_COUPON"));
      if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date())
        throw new Error(t("EXPIRED_COUPON"));
      if (
        coupon.shippingCompanyId &&
        coupon.shippingCompanyId !== form.shippingCompanyId
      )
        throw new Error(t("COUPON_NOT_AVILABLE_SHIPPING_COMPANY"));
      if (coupon.startTime && new Date(coupon.startTime) >= new Date())
        throw new Error(t("NOT_YET_COUPON"));
      setValue("couponCodeId", coupon.id);
      setValue("coupon", structuredClone(coupon));
    } catch (error) {
      setError(error instanceof Error ? error.message : t("INVALID_COUPON"));
    }
  }
  const supportsCod =
    form.method === "local" &&
    form.shippingCompany?.shippingMethods?.includes("cashOnDelivery");
  return (
    <div className="grid grid-cols-1 gap-24 sm:grid-cols-2">
      {!returned && (
        <div className="space-y-12">
          <Typography className="text-14 font-semibold">
            {t("CASH_ON_DELIVERY")}
          </Typography>
          {supportsCod ? (
            <>
              <ShipmentField
                name="isCod"
                type="checkbox"
                label={t("CASH_ON_DELIVERY")}
                helper={t("CASH_ON_DELIVERY_HINT")}
                disabled={disabled}
              />
              {form.isCod && (
                <ShipmentField
                  name="codPrice"
                  type="number"
                  icon="heroicons-outline:cash"
                  label={t("COLLECTED_AMOUNT")}
                  disabled={disabled}
                  required
                />
              )}
            </>
          ) : (
            <Alert severity="info" sx={{ borderRadius: "12px" }}>
              {form.shippingCompany
                ? t("SHIPPING_COMPANY_DOESNT_SUPPORT_COD")
                : t("COD_AFTER_CARRIER_HINT")}
            </Alert>
          )}
        </div>
      )}
      <div className={`space-y-12 ${returned ? "sm:col-span-2" : ""}`}>
        <Typography className="text-14 font-semibold">{t("COUPON")}</Typography>
        <div className="flex items-start gap-8">
          <ShipmentField
            name="couponCode"
            label={t("COUPON_CODE")}
            icon="heroicons-outline:ticket"
            className="min-w-0 flex-1"
            disabled={disabled || !!form.coupon}
          />
          {form.coupon ? (
            <Button
              disabled={disabled}
              color="error"
              sx={{ height: 56, borderRadius: "12px", flexShrink: 0 }}
              onClick={() => {
                setValue("couponCode", "");
                setValue("couponCodeId", "");
                setValue("coupon", null);
                setError(undefined);
              }}
              data-testid="remove-shipment-coupon"
            >
              {t("REMOVE_COUPON")}
            </Button>
          ) : (
            <LoadingButton
              variant="contained"
              disabled={disabled || !form.couponCode}
              loading={isFetching}
              sx={{ height: 56, borderRadius: "12px", flexShrink: 0 }}
              onClick={check}
              data-testid="check-shipment-coupon"
            >
              {t("CHECK_COUPON")}
            </LoadingButton>
          )}
        </div>
        {form.coupon && (
          <Chip
            color="success"
            variant="outlined"
            icon={
              <FuseSvgIcon size={18}>heroicons-solid:check-circle</FuseSvgIcon>
            }
            label={form.coupon.code}
          />
        )}
        {error && <Alert severity="error">{error}</Alert>}
      </div>
    </div>
  );
}
