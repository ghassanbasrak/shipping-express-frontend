import { useEffect, useState } from "react";
import { Alert, Autocomplete, Button, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  useGetCountriesQuery,
  useGetCountryQuery,
} from "src/app/main/countries-app/CountriesApi";
import {
  useGetStatesQuery,
  useGetStateQuery,
} from "src/app/main/states-app/StatesApi";
import {
  useGetCitiesQuery,
  useGetCityQuery,
} from "src/app/main/cities-app/CitiesApi";
import { displayName } from "src/app/main/countries-app/Utils";
import { shippingGeoName } from "../../Utils";
import ICountry from "../../../countries-app/models/ICountry";
import IState from "../../../states-app/models/IState";
import ICity from "../../../cities-app/models/ICity";
type GeoOption = ICountry & Partial<IState & ICity>;
export default function ShipmentGeoField({
  prefix,
  path = "",
  kind,
  disabled = false,
}: {
  prefix: "sender" | "receiver";
  path?: string;
  kind: "country" | "state" | "city";
  disabled?: boolean;
}) {
  const { t } = useTranslation("shipmentsApp"),
    { watch, setValue, getValues, control } = useFormContext(),
    [search, setSearch] = useState("");
  const suffix = kind[0].toUpperCase() + kind.slice(1),
    name = `${path}${prefix}${suffix}Id`,
    id = watch(name),
    carrier = watch("shippingCompanyId"),
    company = watch("shippingCompany"),
    countryId = watch(`${path}${prefix}CountryId`),
    stateId = watch(`${path}${prefix}StateId`),
    local = watch("method") === "local";
  const countries = useGetCountriesQuery(
    {
      page: 0,
      pageSize: 50,
      searchText: search,
      shippingCompanyIdFilter: carrier,
    },
    { skip: kind !== "country" || !carrier },
  );
  const states = useGetStatesQuery(
    {
      page: 0,
      pageSize: 50,
      searchText: search,
      shippingCompanyIdFilter: carrier,
      countryIdFilter: countryId,
    },
    { skip: kind !== "state" || !carrier || !countryId },
  );
  const cities = useGetCitiesQuery(
    {
      page: 0,
      pageSize: 50,
      searchText: search,
      shippingCompanyIdFilter: carrier,
      countryIdFilter: countryId,
      stateIdFilter: company?.hasState ? stateId : undefined,
    },
    { skip: kind !== "city" || !carrier || !countryId },
  );
  const country = useGetCountryQuery(id, { skip: kind !== "country" || !id });
  const state = useGetStateQuery(id, { skip: kind !== "state" || !id });
  const city = useGetCityQuery(id, { skip: kind !== "city" || !id });
  const list =
      kind === "country" ? countries : kind === "state" ? states : cities,
    selected = kind === "country" ? country : kind === "state" ? state : city;
  const options: GeoOption[] = list.currentData?.results || [],
    current: GeoOption = id
      ? options.find((item) => item.id === id) ||
        (selected.currentData as GeoOption) || { id, name: { en: id } }
      : null;
  const items: GeoOption[] =
    current && !options.some((item) => item.id === id)
      ? [current, ...options]
      : options;
  const entity =
    options.find((item) => item.id === id) ||
    (selected.currentData as GeoOption);
  useEffect(() => {
    if (!entity || getValues(name) !== entity.id) return;
    setValue(`${path}${prefix}${suffix}`, structuredClone(entity));
    setValue(
      `${path}${prefix}${suffix}Name`,
      shippingGeoName(entity, carrier, kind),
    );
    if (kind === "country")
      setValue(`${path}${prefix}CountryCode`, entity.code || "");
    if (kind === "city") {
      if (entity.stateId && !getValues(`${path}${prefix}StateId`))
        setValue(`${path}${prefix}StateId`, entity.stateId);
      if (entity.postalCode && !getValues(`${path}${prefix}ZipCode`))
        setValue(`${path}${prefix}ZipCode`, entity.postalCode);
    }
  }, [entity, carrier, kind, name, path, prefix, suffix, getValues, setValue]);
  const mappingMissing =
    !!entity && kind !== "country" && !shippingGeoName(entity, carrier, kind);
  return (
    <div className="space-y-8">
      {(list.isError || selected.isError) && (
        <Alert
          severity="error"
          action={
            <Button
              onClick={() => {
                if (list.isError) list.refetch();
                if (selected.isError) selected.refetch();
              }}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("ADDRESS_LOOKUP_ERROR")}
        </Alert>
      )}
      {mappingMissing && (
        <Alert severity="warning">{t("CITY_NOT_AVAILABLE_FOR_CARRIER")}</Alert>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <Autocomplete
            fullWidth
            value={current}
            options={items}
            disabled={
              disabled ||
              (kind === "country" && local) ||
              !carrier ||
              (kind !== "country" && !countryId)
            }
            loading={list.isFetching || selected.isFetching}
            getOptionLabel={(item) => displayName(item.name) || item.id}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterOptions={(items) => items}
            onBlur={field.onBlur}
            onInputChange={(_, value, reason) => {
              if (reason === "input") setSearch(value);
              else if (reason === "clear") setSearch("");
            }}
            onChange={(_, value) => {
              const changed = field.value !== value?.id;
              field.onChange(value?.id || "");
              setSearch("");
              setValue(
                `${path}${prefix}${suffix}`,
                value ? structuredClone(value) : null,
              );
              setValue(
                `${path}${prefix}${suffix}Name`,
                shippingGeoName(value, carrier, kind),
              );
              if (kind === "country")
                setValue(`${path}${prefix}CountryCode`, value?.code || "");
              if (changed && kind !== "city") {
                for (const child of kind === "country"
                  ? ["State", "City"]
                  : ["City"])
                  for (const tail of ["Id", "Name", ""])
                    setValue(
                      `${path}${prefix}${child}${tail}`,
                      tail ? "" : null,
                    );
                setValue(`${path}${prefix}ZipCode`, "");
              }
              if (kind === "city" && value) {
                if (value.stateId)
                  setValue(`${path}${prefix}StateId`, value.stateId);
                if (value.postalCode)
                  setValue(`${path}${prefix}ZipCode`, value.postalCode);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                name={name}
                required
                label={t(
                  kind === "country"
                    ? "COUNTRY"
                    : kind === "state"
                      ? "STATE"
                      : "CITY",
                )}
                error={!!fieldState.error || mappingMissing}
                helperText={fieldState.error?.message}
              />
            )}
          />
        )}
      />
    </div>
  );
}
