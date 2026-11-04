import { useEffect, useRef, useState } from "react";
import { Alert, Autocomplete, Button, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import PhoneInput from "mui-phone-input";
import {
  useGetShipmentUsersQuery,
  useGetShipmentUserQuery,
} from "src/app/main/shipment-users-app/ShipmentUsersApi";
import {
  savedShipmentContact,
  defaultCountry,
  defaultCountryCode,
} from "../../Utils";
import ShipmentField from "./ShipmentField";
import ShipmentGeoField from "./ShipmentGeoField";
export default function ShipmentContactFields({
  prefix,
  path = "",
  disabled = false,
  calculator = false,
}: {
  prefix: "sender" | "receiver";
  path?: string;
  disabled?: boolean;
  calculator?: boolean;
}) {
  const { t } = useTranslation("shipmentsApp"),
    { watch, setValue, getValues, control } = useFormContext(),
    [search, setSearch] = useState(""),
    [chosen, setChosen] = useState<string>(),
    applied = useRef<string>();
  const id = watch(`${path}${prefix}Id`),
    company = watch("shippingCompany"),
    local = watch("method") === "local";
  const users = useGetShipmentUsersQuery(
    { page: 0, pageSize: 50, typeFilter: prefix, searchText: search },
    { skip: calculator || disabled },
  );
  const selected = useGetShipmentUserQuery(id, {
    skip: calculator || !id || id === "new",
  });
  useEffect(() => {
    if (
      !chosen ||
      chosen === "new" ||
      applied.current === chosen ||
      selected.currentData?.id !== chosen ||
      getValues(`${path}${prefix}Id`) !== chosen
    )
      return;
    for (const [key, value] of Object.entries(
      savedShipmentContact(selected.currentData, prefix),
    ))
      setValue(`${path}${key}`, value);
    if (prefix === "sender") setValue("senderNamePrefix", "");
    applied.current = chosen;
  }, [chosen, selected.currentData, path, prefix, getValues, setValue]);
  const options = [
      {
        id: "new",
        fullName: t(
          prefix === "sender" ? "ADD_NEW_SENDER" : "ADD_NEW_RECEIVER",
        ),
      },
      ...(users.currentData?.results || []),
    ],
    current = options.find((item) => item.id === id) ||
      selected.currentData || { id: id || "new", fullName: id || "" };
  const phone = (
    name: string,
    code: string,
    label: string,
    required = false,
  ) => (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Controller
          name={code}
          control={control}
          render={({ field: country }) => (
            <div dir="ltr" className="min-w-0">
              <PhoneInput
                name={name}
                value={`${country.value || "+966"}${field.value || ""}`}
                onChange={(value) => {
                  country.onChange(
                    value.countryCode ? `+${value.countryCode}` : "",
                  );
                  field.onChange(
                    `${value.areaCode || ""}${value.phoneNumber || ""}`,
                  );
                }}
                onBlur={field.onBlur}
                label={label}
                required={required}
                disabled={disabled}
                fullWidth
                variant="outlined"
                disableParentheses
                enableSearch
                searchVariant="standard"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            </div>
          )}
        />
      )}
    />
  );
  const showState = !company || company.hasState,
    isNewSender = prefix === "sender" && id === "new";
  return (
    <div className="w-full min-w-0" data-testid={`${path}${prefix}-contact`}>
      {!calculator && (users.isError || selected.isError) && (
        <Alert
          severity="error"
          className="mb-16"
          action={
            <Button
              onClick={() => {
                if (users.isError) users.refetch();
                if (selected.isError) selected.refetch();
              }}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("CONTACT_LOOKUP_ERROR")}
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
        {!calculator && (
          <>
            <Autocomplete
              className="sm:col-span-2"
              fullWidth
              disabled={disabled}
              options={
                options.some((item) => item.id === current.id)
                  ? options
                  : [current, ...options]
              }
              value={current}
              loading={users.isFetching || selected.isFetching}
              getOptionLabel={(item) => item.fullName || item.id}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              filterOptions={(items) => items}
              onInputChange={(_, text, reason) => {
                if (reason === "input") setSearch(text);
                else if (reason === "clear") setSearch("");
              }}
              onChange={(_, value) => {
                const selectedId = value?.id || "new";
                setValue(`${path}${prefix}Id`, selectedId, {
                  shouldDirty: true,
                });
                setSearch("");
                setChosen(selectedId);
                applied.current = undefined;
                if (selectedId === "new") {
                  for (const key of [
                    "Name",
                    "Email",
                    "Phone",
                    "Phone1",
                    "StateId",
                    "StateName",
                    "CityId",
                    "CityName",
                    "Street",
                    "ZipCode",
                    "NationalAddress",
                  ])
                    setValue(`${path}${prefix}${key}`, "");
                  for (const key of ["CountryId", "CountryName", "CountryCode"])
                    setValue(
                      `${path}${prefix}${key}`,
                      local
                        ? key === "CountryId"
                          ? defaultCountry.id
                          : key === "CountryName"
                            ? defaultCountry.name.en
                            : defaultCountryCode
                        : "",
                    );
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  name={`${path}${prefix}Id`}
                  label={t(
                    prefix === "sender"
                      ? "SELECT_SINGLE_SENDER"
                      : "SELECT_SINGLE_RECEIVER",
                  )}
                  helperText={t("SAVED_CONTACT_HINT")}
                />
              )}
            />
            {isNewSender && (
              <ShipmentField
                name="senderNamePrefix"
                label={t("SENDER_NAME_PREFIX")}
                disabled={disabled}
              />
            )}
            <ShipmentField
              name={`${path}${prefix}Name`}
              label={t("NAME")}
              icon="heroicons-outline:user"
              className={isNewSender ? undefined : "sm:col-span-2"}
              required
              disabled={disabled}
            />
            {phone(
              `${path}${prefix}Phone`,
              `${path}${prefix}PhoneCountry`,
              t("PHONE_NUMBER"),
              true,
            )}
            {phone(
              `${path}${prefix}Phone1`,
              `${path}${prefix}PhoneCountry1`,
              t("SECOND_PHONE_NUMBER"),
            )}
            <ShipmentField
              name={`${path}${prefix}Email`}
              label={t("EMAIL")}
              icon="heroicons-outline:mail"
              disabled={disabled}
            />
            <ShipmentField
              name={`${path}${prefix}NationalAddress`}
              label={t("NATIONAL_ADDRESS")}
              icon="heroicons-outline:identification"
              required
              disabled={disabled}
            />
          </>
        )}
        <div
          className={`grid grid-cols-1 gap-16 sm:col-span-2 ${showState ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
        >
          <ShipmentGeoField
            prefix={prefix}
            path={path}
            kind="country"
            disabled={disabled}
          />
          {showState && (
            <ShipmentGeoField
              prefix={prefix}
              path={path}
              kind="state"
              disabled={disabled}
            />
          )}
          <ShipmentGeoField
            prefix={prefix}
            path={path}
            kind="city"
            disabled={disabled}
          />
        </div>
        <ShipmentField
          name={`${path}${prefix}Street`}
          label={t("STREET")}
          icon="heroicons-outline:location-marker"
          required
          disabled={disabled}
        />
        <ShipmentField
          name={`${path}${prefix}ZipCode`}
          label={t("ZIP_CODE")}
          required={!local}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
