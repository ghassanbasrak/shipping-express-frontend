import { useEffect } from "react";
import { Alert, Button, MenuItem, Typography } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  useGetShipmentAccountQuery,
  useGetShipmentCarriersQuery,
} from "../../ShipmentsApi";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { defaultCountry } from "../../Utils";
import ShipmentField from "../components/ShipmentField";
import type { ShipmentFormValues } from "../../models/ShipmentSchema";
export default function BasicInfoTab({
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
    } = useFormContext(),
    carriers = useGetShipmentCarriersQuery(),
    account = useGetShipmentAccountQuery("me"),
    company = watch("shippingCompany"),
    method = watch("method"),
    carrierId = watch("shippingCompanyId");
  const choices =
    carriers.currentData?.results.filter((item) => item.isActive) || [];
  useEffect(() => {
    const selected = choices.find((item) => item.id === carrierId);
    if (selected && !getValues("shippingCompany"))
      setValue("shippingCompany", structuredClone(selected));
  }, [carriers.currentData, carrierId, getValues, setValue]);
  const authorized = account.currentData?.isAuthorized ?? user?.isAuthorized;
  function clearGeography(clearIds = false) {
    const prefixes = [
      { prefix: "sender", path: "" },
      { prefix: "receiver", path: "" },
      ...(getValues("receivers") || []).map((_, index) => ({
        prefix: "receiver",
        path: `receivers.${index}.`,
      })),
    ];
    for (const { prefix, path } of prefixes)
      for (const kind of ["State", "City"])
        for (const suffix of clearIds ? ["Id", "Name", ""] : ["Name", ""])
          setValue(
            `${path}${prefix}${kind}${suffix}` as never,
            (suffix ? "" : null) as never,
          );
  }
  return (
    <div className="space-y-16">
      <Typography className="text-18 font-semibold">
        {t("SHIPPING_COMPANY")}
      </Typography>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">
        {choices.map((item) => (
          <Button
            key={item.id}
            sx={{ height: "auto", minHeight: 96, whiteSpace: "normal" }}
            variant={carrierId === item.id ? "contained" : "outlined"}
            disabled={disabled || (item.isAuthorizationRequired && !authorized)}
            data-testid={`carrier-${item.id}`}
            onClick={() => {
              if (item.id === carrierId) return;
              clearGeography();
              setValue("shippingCompanyId", item.id, { shouldDirty: true });
              setValue("shippingCompany", structuredClone(item));
              setValue("isCod", false);
              setValue("codPrice", 0);
              if (!item.shippingMethods?.includes(method))
                setValue(
                  "method",
                  item.shippingMethods?.find((value) =>
                    ["local", "international"].includes(value),
                  ) || "local",
                );
              setValue("couponCodeId", "");
              setValue("coupon", null);
            }}
          >
            <span className="flex w-full flex-col items-center gap-8">
              {item.logoUrl && (
                <img
                  src={item.logoUrl}
                  alt=""
                  className="h-48 mx-auto object-contain"
                />
              )}
              <span>{item.name}</span>
              {item.isAuthorizationRequired && !authorized && (
                <span className="block">
                  {t("SHIPPING_COMPANY_REQUIRED_AUTHORIZATION")}
                </span>
              )}
            </span>
          </Button>
        ))}
      </div>
      {errors.shippingCompanyId && (
        <Alert severity="error">
          {String(errors.shippingCompanyId.message)}
        </Alert>
      )}
      <ShipmentField
        name="method"
        label={t("SHIPPING_TYPE")}
        disabled={disabled || !company}
        required
      >
        {(company?.shippingMethods || [])
          .filter((value) => ["local", "international"].includes(value))
          .map((value) => (
            <MenuItem
              key={value}
              value={value}
              onClick={() => {
                if (method !== value) {
                  clearGeography(true);
                  setValue("isCod", false);
                  setValue("codPrice", 0);
                  const group = [
                    { prefix: "sender", path: "" },
                    { prefix: "receiver", path: "" },
                    ...(getValues("receivers") || []).map((_, index) => ({
                      prefix: "receiver",
                      path: `receivers.${index}.`,
                    })),
                  ];
                  for (const { prefix, path } of group) {
                    setValue(
                      `${path}${prefix}CountryId` as never,
                      (value === "local" ? defaultCountry.id : "") as never,
                    );
                    setValue(
                      `${path}${prefix}CountryName` as never,
                      (value === "local"
                        ? defaultCountry.name.en
                        : "") as never,
                    );
                    setValue(
                      `${path}${prefix}CountryCode` as never,
                      (value === "local" ? defaultCountry.code : "") as never,
                    );
                  }
                }
              }}
            >
              {t(value === "local" ? "LOCAL" : "INTERNATIONAL")}
            </MenuItem>
          ))}
      </ShipmentField>
    </div>
  );
}
