import { useState } from "react";
import { Alert, Button, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLazyGetShipmentCouponsQuery } from "../../ShipmentsApi";
import type { ShipmentFormValues } from "../../models/ShipmentSchema";
import ShipmentField from "../components/ShipmentField";
export default function PaymentTab({
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
  return (
    <div className="space-y-16">
      <Typography className="text-18 font-semibold">
        {t("PAYMENT_DETAILS")}
      </Typography>
      {!returned &&
        (form.method === "local" &&
        form.shippingCompany?.shippingMethods?.includes("cashOnDelivery") ? (
          <ShipmentField
            name="isCod"
            type="checkbox"
            label={t("CASH_ON_DELIVERY")}
            disabled={disabled}
          />
        ) : (
          <Alert severity="info">
            {t("SHIPPING_COMPANY_DOESNT_SUPPORT_COD")}
          </Alert>
        ))}
      {!returned && form.isCod && (
        <ShipmentField
          name="codPrice"
          type="number"
          label={t("COLLECTED_AMOUNT")}
          disabled={disabled}
          required
        />
      )}
      <ShipmentField
        name="couponCode"
        label={t("COUPON_CODE")}
        disabled={disabled || !!form.coupon}
      />
      {form.coupon ? (
        <>
          <Typography>{form.coupon.code}</Typography>
          <Button
            disabled={disabled}
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
        </>
      ) : (
        <LoadingButton
          disabled={disabled || !form.couponCode}
          loading={isFetching}
          onClick={check}
          data-testid="check-shipment-coupon"
        >
          {t("CHECK_COUPON")}
        </LoadingButton>
      )}
      {error && <Alert severity="error">{error}</Alert>}
    </div>
  );
}
