import { useState } from "react";
import { Alert, Autocomplete, Button, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { LocaleString } from "src/app/main/utils/commonTypes";
import { displayName } from "../../../countries-app/Utils";
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
import ICountry from "../../../countries-app/models/ICountry";
import IState from "../../../states-app/models/IState";
import ICity from "../../../cities-app/models/ICity";
import { PackageRequestFormValues } from "../../models/PackageRequestSchema";

function PlaceField<T extends { id: string; name?: LocaleString }>({
  name,
  label,
  options,
  selected,
  loading,
  disabled,
  required,
  onSearch,
  onSelect,
}: {
  name:
    | "shippingAddress.countryId"
    | "shippingAddress.stateId"
    | "shippingAddress.cityId";
  label: string;
  options: T[];
  selected: T;
  loading: boolean;
  disabled: boolean;
  required: boolean;
  onSearch: (text: string) => void;
  onSelect: (item: T) => void;
}) {
  const { control } = useFormContext<PackageRequestFormValues>();
  const items =
    selected && !options.some((item) => item.id === selected.id)
      ? [selected, ...options]
      : options;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Autocomplete<T>
          options={items}
          value={selected || null}
          disabled={disabled}
          loading={loading}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={(option) => displayName(option.name) || option.id}
          filterOptions={(items) => items}
          onBlur={field.onBlur}
          onInputChange={(_, text, reason) => {
            if (reason === "input") onSearch(text);
            else if (reason === "clear") onSearch("");
          }}
          onChange={(_, item) => {
            field.onChange(item?.id || "");
            onSearch("");
            onSelect(item);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              name={name}
              label={label}
              required={required}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fullWidth
            />
          )}
        />
      )}
    />
  );
}

export default function AddressSection({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { t } = useTranslation("packageRequestsApp"),
    { watch, setValue, control } = useFormContext<PackageRequestFormValues>();
  const form = watch(),
    { countryId, stateId, cityId } = form.shippingAddress;
  const [countrySearch, setCountrySearch] = useState(""),
    [stateSearch, setStateSearch] = useState(""),
    [citySearch, setCitySearch] = useState("");
  const countries = useGetCountriesQuery({
    page: 0,
    pageSize: 500,
    searchText: countrySearch,
  });
  const states = useGetStatesQuery(
    {
      page: 0,
      pageSize: 500,
      countryIdFilter: countryId,
      searchText: stateSearch,
    },
    { skip: !countryId },
  );
  // Search the whole country, as in the source: choosing a city can supply its state.
  const cities = useGetCitiesQuery(
    {
      page: 0,
      pageSize: 500,
      countryIdFilter: countryId,
      searchText: citySearch,
    },
    { skip: !countryId },
  );
  const country = useGetCountryQuery(countryId, {
    skip: !countryId || form.shippingAddress.country?.id === countryId,
  });
  const state = useGetStateQuery(stateId, {
    skip: !stateId || form.shippingAddress.state?.id === stateId,
  });
  const city = useGetCityQuery(cityId, {
    skip: !cityId || form.shippingAddress.city?.id === cityId,
  });
  const selectedCountry: ICountry = countryId
    ? countries.currentData?.results.find((item) => item.id === countryId) ||
      [form.shippingAddress.country, country.currentData].find(
        (item) => item?.id === countryId,
      ) || { id: countryId }
    : null;
  const selectedState: IState = stateId
    ? states.currentData?.results.find((item) => item.id === stateId) ||
      [form.shippingAddress.state, state.currentData].find(
        (item) => item?.id === stateId,
      ) || { id: stateId }
    : null;
  const selectedCity: ICity = cityId
    ? cities.currentData?.results.find((item) => item.id === cityId) ||
      [form.shippingAddress.city, city.currentData].find(
        (item) => item?.id === cityId,
      ) || { id: cityId }
    : null;
  const failed = [countries, states, cities, country, state, city].filter(
    (query) => query.isError,
  );
  const dirty = { shouldDirty: true, shouldValidate: true };
  function changeCountry(item: ICountry) {
    setValue("shippingAddress.country", item);
    if ((item?.id || "") === countryId) return;
    setValue("shippingAddress.stateId", "", dirty);
    setValue("shippingAddress.cityId", "", dirty);
    setValue("shippingAddress.zipCode", "", dirty);
    setValue("shippingAddress.state", undefined);
    setValue("shippingAddress.city", undefined);
    setStateSearch("");
    setCitySearch("");
  }
  function changeState(item: IState) {
    setValue("shippingAddress.state", item);
    if ((item?.id || "") === stateId) return;
    setValue("shippingAddress.cityId", "", dirty);
    setValue("shippingAddress.zipCode", "", dirty);
    setValue("shippingAddress.city", undefined);
    setCitySearch("");
  }
  function changeCity(item: ICity) {
    setValue("shippingAddress.city", item);
    if (!item) return;
    setValue("shippingAddress.stateId", item.stateId || "", dirty);
    setValue("shippingAddress.state", item.state);
    setStateSearch("");
    if (item.postalCode)
      setValue("shippingAddress.zipCode", item.postalCode, dirty);
  }
  return (
    <div className="space-y-16">
      {failed.length > 0 && (
        <Alert
          severity="error"
          action={
            <Button onClick={() => failed.forEach((query) => query.refetch())}>
              {t("RETRY")}
            </Button>
          }
        >
          {t("LOOKUP_ERROR")}
        </Alert>
      )}
      <PlaceField<ICountry>
        name="shippingAddress.countryId"
        label={t("COUNTRY")}
        options={countries.currentData?.results || []}
        selected={selectedCountry}
        loading={countries.isFetching || country.isFetching}
        disabled={disabled}
        required
        onSearch={setCountrySearch}
        onSelect={changeCountry}
      />
      <PlaceField<IState>
        name="shippingAddress.stateId"
        label={t("STATE")}
        options={states.currentData?.results || []}
        selected={selectedState}
        loading={states.isFetching || state.isFetching}
        disabled={disabled || !countryId}
        required
        onSearch={setStateSearch}
        onSelect={changeState}
      />
      <PlaceField<ICity>
        name="shippingAddress.cityId"
        label={t("CITY")}
        options={cities.currentData?.results || []}
        selected={selectedCity}
        loading={cities.isFetching || city.isFetching}
        disabled={disabled || !countryId}
        required={false}
        onSearch={setCitySearch}
        onSelect={changeCity}
      />
      {(["street", "zipCode"] as const).map((name) => (
        <Controller
          key={name}
          name={`shippingAddress.${name}`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              value={field.value || ""}
              disabled={disabled}
              fullWidth
              label={t(name === "street" ? "STREET" : "ZIP_CODE")}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      ))}
    </div>
  );
}
