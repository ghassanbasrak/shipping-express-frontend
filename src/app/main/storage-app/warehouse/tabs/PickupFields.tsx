import { useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  useGetCountriesQuery,
  useGetCountryQuery,
} from "../../../countries-app/CountriesApi";
import {
  useGetStatesQuery,
  useGetStateQuery,
} from "../../../states-app/StatesApi";
import {
  useGetCitiesQuery,
  useGetCityQuery,
} from "../../../cities-app/CitiesApi";
import { displayName } from "../../../countries-app/Utils";
import StorageField from "../../shared/StorageField";
import WarehouseModel from "../../models/WarehouseModel";

function Place({
  kind,
  disabled,
}: {
  kind: "country" | "state" | "city";
  disabled: boolean;
}) {
  const { t } = useTranslation("storageApp"),
    { watch, control, setValue } =
      useFormContext<ReturnType<typeof WarehouseModel>>(),
    [search, setSearch] = useState("");
  const pickup = watch("pickup"),
    id = pickup[`${kind}Id`],
    name = `pickup.${kind}Id` as const;
  const countries = useGetCountriesQuery(
    { page: 0, pageSize: 50, searchText: search },
    { skip: kind !== "country" },
  );
  const states = useGetStatesQuery(
    {
      page: 0,
      pageSize: 50,
      searchText: search,
      countryIdFilter: pickup.countryId,
    },
    { skip: kind !== "state" || !pickup.countryId },
  );
  const cities = useGetCitiesQuery(
    {
      page: 0,
      pageSize: 50,
      searchText: search,
      countryIdFilter: pickup.countryId,
      stateIdFilter: pickup.stateId,
    },
    { skip: kind !== "city" || !pickup.countryId },
  );
  const country = useGetCountryQuery(id, { skip: kind !== "country" || !id });
  const state = useGetStateQuery(id, { skip: kind !== "state" || !id });
  const city = useGetCityQuery(id, { skip: kind !== "city" || !id });
  const list =
      kind === "country" ? countries : kind === "state" ? states : cities,
    selected = kind === "country" ? country : kind === "state" ? state : city,
    options = list.currentData?.results || [],
    current =
      options.find((row) => row.id === id) ||
      selected.currentData ||
      (id ? { id, name: { en: id } } : null);
  return (
    <div>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <Autocomplete
            options={
              current && !options.some((row) => row.id === id)
                ? [current, ...options]
                : options
            }
            value={current}
            disabled={disabled || (kind !== "country" && !pickup.countryId)}
            loading={list.isFetching || selected.isFetching}
            filterOptions={(items) => items}
            getOptionLabel={(row) => displayName(row.name) || row.id}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            onBlur={field.onBlur}
            onInputChange={(_, value, reason) => {
              if (reason === "input") setSearch(value);
              else if (reason === "clear") setSearch("");
            }}
            onChange={(_, value) => {
              if (field.value === value?.id) return;
              field.onChange(value?.id || "");
              setSearch("");
              if (kind !== "city") {
                setValue("pickup.cityId", "");
                setValue("pickup.zipCode", "");
              }
              if (kind === "country") setValue("pickup.stateId", "");
              if (kind === "city" && value) {
                if ("stateId" in value)
                  setValue("pickup.stateId", value.stateId as string);
                if ("postalCode" in value)
                  setValue("pickup.zipCode", value.postalCode as string);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                name={name}
                label={t(kind.toUpperCase())}
                required
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        )}
      />
      {(list.isError || selected.isError) && (
        <Alert
          severity="error"
          action={
            <Button
              onClick={() => {
                if (list.isError) void list.refetch();
                if (selected.isError) void selected.refetch();
              }}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
    </div>
  );
}
export default function PickupFields({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation("storageApp");
  return (
    <div className="space-y-16" data-testid="warehouse-pickup-fields">
      <Typography className="text-16 font-semibold">
        {t("PICKUP_DETAILS")}
      </Typography>
      <Typography color="text.secondary" className="text-13">
        {t("PICKUP_DETAILS_HINT")}
      </Typography>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
        <StorageField
          name="pickup.phone"
          label={t("PICKUP_PHONE")}
          helper={t("PICKUP_PHONE_HINT")}
          required
          disabled={disabled}
        />
        <StorageField
          name="pickup.email"
          label={t("EMAIL")}
          disabled={disabled}
        />
        <Place kind="country" disabled={disabled} />
        <Place kind="state" disabled={disabled} />
        <Place kind="city" disabled={disabled} />
        <StorageField
          name="pickup.zipCode"
          label={t("ZIP_CODE")}
          disabled={disabled}
        />
        <StorageField
          name="pickup.street"
          label={t("STREET")}
          required
          disabled={disabled}
        />
        <StorageField
          name="pickup.nationalAddress"
          label={t("NATIONAL_ADDRESS")}
          required
          disabled={disabled}
        />
      </div>
    </div>
  );
}
