import { useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  Skeleton,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  useGetShipmentAccountQuery,
  useGetShipmentCarriersQuery,
} from "../../ShipmentsApi";
import { carrierMissesAddress } from "../sectionUtils";
import type { ShipmentFormValues } from "../../models/ShipmentSchema";

export default function CarrierSection({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { t } = useTranslation("shipmentsApp"),
    user = useAppSelector(selectUser),
    {
      watch,
      setValue,
      getValues,
      formState: { errors },
    } = useFormContext<ShipmentFormValues>(),
    carriers = useGetShipmentCarriersQuery(),
    account = useGetShipmentAccountQuery("me"),
    form = watch(),
    method = form.method,
    carrierId = form.shippingCompanyId,
    company = form.shippingCompany;
  const active =
      carriers.currentData?.results.filter((item) => item.isActive) || [],
    choices = active.filter((item) => item.shippingMethods?.includes(method));
  useEffect(() => {
    const selected = active.find((item) => item.id === carrierId);
    if (selected && !getValues("shippingCompany"))
      setValue("shippingCompany", structuredClone(selected));
  }, [carriers.currentData, carrierId, getValues, setValue]);
  const authorized = account.currentData?.isAuthorized ?? user?.isAuthorized;
  const selectedMisses =
    !!company && !!carrierId && carrierMissesAddress(company, form);

  function choose(item: (typeof choices)[number]) {
    if (item.id === carrierId) return;
    // Canonical address IDs stay; the geography fields refresh the carrier names.
    setValue("shippingCompanyId", item.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("shippingCompany", structuredClone(item));
    setValue("isCod", false);
    setValue("codPrice", 0);
    setValue("couponCodeId", "");
    setValue("coupon", null);
  }

  return (
    <div className="space-y-16">
      {carriers.isError && (
        <Alert
          severity="error"
          action={
            <Button onClick={() => carriers.refetch()}>{t("RETRY")}</Button>
          }
        >
          {t("CARRIERS_LOAD_ERROR")}
        </Alert>
      )}
      {!carrierId && !carriers.isError && (
        <Alert severity="info" icon={false} sx={{ borderRadius: "12px" }}>
          {t("CARRIER_AFTER_ADDRESS_HINT")}
        </Alert>
      )}
      {carriers.isLoading && (
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton
              key={item}
              variant="rounded"
              height={92}
              sx={{ borderRadius: "16px" }}
            />
          ))}
        </div>
      )}
      {!carriers.isLoading && !carriers.isError && !choices.length && (
        <Alert severity="warning">{t("NO_CARRIERS_FOR_TYPE")}</Alert>
      )}
      <div
        role="radiogroup"
        aria-label={t("SHIPPING_COMPANY")}
        className="grid grid-cols-1 gap-12 sm:grid-cols-2 xl:grid-cols-3"
        style={{ maxHeight: 460, overflowY: "auto", padding: 4, margin: -4 }}
      >
        {choices.map((item) => {
          const selected = carrierId === item.id,
            needsAuthorization = item.isAuthorizationRequired && !authorized,
            misses = carrierMissesAddress(item, form),
            blocked = disabled || needsAuthorization || misses;
          return (
            <ButtonBase
              key={item.id}
              role="radio"
              aria-checked={selected}
              disabled={blocked && !selected}
              data-testid={`carrier-${item.id}`}
              onClick={() => choose(item)}
              sx={(theme) => ({
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 1.5,
                textAlign: "start",
                p: 1.5,
                minHeight: 92,
                borderRadius: "16px",
                border: `2px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
                backgroundColor: selected
                  ? alpha(theme.palette.primary.main, 0.07)
                  : theme.palette.background.paper,
                opacity: blocked && !selected ? 0.6 : 1,
                transition: "all .2s ease",
                "&:hover": {
                  borderColor: theme.palette.primary.light,
                  boxShadow: `0 8px 20px -12px ${alpha(theme.palette.primary.main, 0.5)}`,
                },
              })}
            >
              <Box
                sx={(theme) => ({
                  width: 56,
                  height: 56,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "12px",
                  overflow: "hidden",
                  backgroundColor: theme.palette.common.white,
                  border: `1px solid ${theme.palette.divider}`,
                })}
              >
                {item.logoUrl ? (
                  <img
                    src={item.logoUrl}
                    alt=""
                    className="h-40 w-40 object-contain"
                  />
                ) : (
                  <FuseSvgIcon color="disabled">
                    heroicons-outline:truck
                  </FuseSvgIcon>
                )}
              </Box>
              <span className="min-w-0 flex-1 space-y-4">
                <Typography className="text-14 font-bold leading-tight">
                  {item.name}
                </Typography>
                <span className="flex flex-wrap gap-4">
                  {method === "local" &&
                    item.shippingMethods?.includes("cashOnDelivery") && (
                      <Chip
                        size="small"
                        label={t("CASH_ON_DELIVERY")}
                        sx={{ height: 20, fontSize: 11 }}
                      />
                    )}
                  {item.isEnglish && (
                    <Chip
                      size="small"
                      label="EN"
                      sx={{ height: 20, fontSize: 11 }}
                    />
                  )}
                </span>
                {needsAuthorization && (
                  <Typography color="warning.main" className="block text-11">
                    {t("SHIPPING_COMPANY_REQUIRED_AUTHORIZATION")}
                  </Typography>
                )}
                {!needsAuthorization && misses && (
                  <Typography color="warning.main" className="block text-11">
                    {t("CARRIER_DOES_NOT_COVER_ADDRESS")}
                  </Typography>
                )}
              </span>
              {selected && (
                <FuseSvgIcon size={22} color="primary">
                  heroicons-solid:check-circle
                </FuseSvgIcon>
              )}
            </ButtonBase>
          );
        })}
      </div>
      {selectedMisses && (
        <Alert severity="warning">{t("CITY_NOT_AVAILABLE_FOR_CARRIER")}</Alert>
      )}
      {company?.isEnglish && (
        <Alert severity="info">
          {t("SHIPPING_COMPANY_SUPPORT_ONLY_ENGLISH_LANGUAGE")}
        </Alert>
      )}
      {errors.shippingCompanyId && (
        <Alert severity="error">
          {String(errors.shippingCompanyId.message)}
        </Alert>
      )}
    </div>
  );
}
