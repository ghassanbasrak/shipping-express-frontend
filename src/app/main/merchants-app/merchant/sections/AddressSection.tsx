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
import { MerchantForm } from "../../models/MerchantSchema";

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
  name: "address.countryId" | "address.stateId" | "address.cityId";
  label: string;
  options: T[];
  selected: T;
  loading: boolean;
  disabled: boolean;
  required: boolean;
  onSearch: (text: string) => void;
  onSelect: (item: T) => void;
}) {
  const { control } = useFormContext<MerchantForm>();
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
  const { t } = useTranslation("merchantsApp"),
    { watch, setValue, control } = useFormContext<MerchantForm>();
  const form = watch(),
    { countryId, stateId, cityId } = form.address;
  const [countrySearch, setCountrySearch] = useState(""),
    [stateSearch, setStateSearch] = useState(""),
    [citySearch, setCitySearch] = useState("");
  const countries = useGetCountriesQuery({
    page: 0,
    pageSize: 500,
    searchText: countrySearch,
  });
  const carrierId =
    import.meta.env.VITE_ARABIC_ADDRESS_SHIPPING_COMPANY_ID ||
    "660030be07d4cc8bca3eb0eb";
  const states = useGetStatesQuery(
    {
      page: 0,
      pageSize: 500,
      countryIdFilter: countryId,
      shippingCompanyIdFilter: carrierId,
      searchText: stateSearch,
    },
    { skip: !countryId },
  );
  // Merchant addresses retain the source country/state/carrier lookup scope.
  const cities = useGetCitiesQuery(
    {
      stateIdFilter: stateId,
      page: 0,
      pageSize: 500,
      countryIdFilter: countryId,
      shippingCompanyIdFilter: carrierId,
      searchText: citySearch,
    },
    { skip: !countryId },
  );
  const country = useGetCountryQuery(countryId, {
    skip:
      !countryId ||
      form.country?.id === countryId ||
      form.address.country?.id === countryId,
  });
  const state = useGetStateQuery(stateId, {
    skip:
      !stateId ||
      form.state?.id === stateId ||
      form.address.state?.id === stateId,
  });
  const city = useGetCityQuery(cityId, {
    skip:
      !cityId || form.city?.id === cityId || form.address.city?.id === cityId,
  });
  const selectedCountry: ICountry = countryId
    ? countries.currentData?.results.find((item) => item.id === countryId) ||
      [form.country, form.address.country, country.currentData].find(
        (item) => item?.id === countryId,
      ) || { id: countryId }
    : null;
  const selectedState: IState = stateId
    ? states.currentData?.results.find((item) => item.id === stateId) ||
      [form.state, form.address.state, state.currentData].find(
        (item) => item?.id === stateId,
      ) || { id: stateId }
    : null;
  const selectedCity: ICity = cityId
    ? cities.currentData?.results.find((item) => item.id === cityId) ||
      [form.city, form.address.city, city.currentData].find(
        (item) => item?.id === cityId,
      ) || { id: cityId }
    : null;
  const failed = [countries, states, cities, country, state, city].filter(
    (query) => query.isError,
  );
  const dirty = { shouldDirty: true, shouldValidate: true };
  function changeCountry(item: ICountry) {
    setValue("country", item);
    if ((item?.id || "") === countryId) return;
    setValue("address.stateId", "", dirty);
    setValue("address.cityId", "", dirty);
    setValue("address.zipCode", "", dirty);
    setValue("state", undefined);
    setValue("city", undefined);
    setStateSearch("");
    setCitySearch("");
  }
  function changeState(item: IState) {
    setValue("state", item);
    if ((item?.id || "") === stateId) return;
    setValue("address.cityId", "", dirty);
    setValue("address.zipCode", "", dirty);
    setValue("city", undefined);
    setCitySearch("");
  }
  function changeCity(item: ICity) {
    setValue("city", item);
    if (!item) return;
    setValue("address.stateId", item.stateId || "", dirty);
    setValue("state", item.state);
    setStateSearch("");
    if (item.postalCode) setValue("address.zipCode", item.postalCode, dirty);
  }
  return (
    <div className="space-y-16">
      {failed.length > 0 && (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => failed.forEach((query) => query.refetch())}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("LOOKUP_ERROR")}
        </Alert>
      )}
      <PlaceField<ICountry>
        name="address.countryId"
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
        name="address.stateId"
        label={t("STATE")}
        options={
          states.currentData?.results.filter(
            (item) => item.id !== "660f6619d12e5bdfbd45f2ad",
          ) || []
        }
        selected={selectedState}
        loading={states.isFetching || state.isFetching}
        disabled={disabled || !countryId}
        required
        onSearch={setStateSearch}
        onSelect={changeState}
      />
      <PlaceField<ICity>
        name="address.cityId"
        label={t("CITY")}
        options={cities.currentData?.results || []}
        selected={selectedCity}
        loading={cities.isFetching || city.isFetching}
        disabled={disabled || !stateId}
        required
        onSearch={setCitySearch}
        onSelect={changeCity}
      />
      {(["street", "zipCode"] as const).map((name) => (
        <Controller
          key={name}
          name={`address.${name}`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              value={field.value || ""}
              disabled={disabled}
              fullWidth
              label={t(name === "street" ? "STREET" : "ZIP_CODE")}
              required={name === "street" && !!form.taxNumber}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      ))}
    </div>
  );
}
