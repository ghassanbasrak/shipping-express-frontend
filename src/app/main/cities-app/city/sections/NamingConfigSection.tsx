import { useEffect } from "react";
import { Alert, Button, Typography, Box, alpha } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import LocaleInput from "app/shared-components/locale-input/LocaleInput";
import {
  useGetCountriesShippingCompaniesQuery,
  useGetCountriesLanguagesQuery,
} from "../../../countries-app/CountriesApi";
import ICity from "../../models/ICity";
import ShipmentCityItem from "./ShipmentCityItem";
export default function NamingConfigSection({
  withoutLocaleNames = false,
}: {
  withoutLocaleNames?: boolean;
}) {
  const { t } = useTranslation("citiesApp");
  const companies = useGetCountriesShippingCompaniesQuery();
  const languages = useGetCountriesLanguagesQuery();
  const { control, getValues, watch } = useFormContext<ICity>();
  const { fields, append } = useFieldArray<ICity, "shipmentCities", "formKey">({
    control,
    name: "shipmentCities",
    keyName: "formKey",
  });
  const id = watch("id");
  useEffect(() => {
    const existing = getValues("shipmentCities") || [];
    const missing = (companies.data?.results || []).filter(
      (company) =>
        !existing.some((row) => row.shippingCompanyId === company.id),
    );
    if (missing.length)
      append(
        missing.map((company) => ({
          name: "",
          isActive: false,
          cityId: id,
          shippingCompanyId: company.id,
        })),
        { shouldFocus: false },
      );
  }, [companies.data, fields.length, id, append, getValues]);
  const codes = [
    ...new Set([
      "en",
      "ar",
      ...(languages.data?.results || []),
      ...Object.keys(getValues("name") || {}),
    ]),
  ];
  return (
    <section>
      <Box
        component="div"
        className="py-8 px-16 my-16 w-full rounded-lg"
        sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}
      >
        <Typography className="text-17 font-bold">
          {t("NAMES_CONFIG")}
        </Typography>
      </Box>
      {!withoutLocaleNames && (
        <LocaleInput
          name="name"
          label={t("NAME")}
          languages={codes}
          requiredLanguages={["en"]}
        />
      )}
      {languages.isError && (
        <Alert
          severity="warning"
          action={
            <Button onClick={() => languages.refetch()}>{t("RETRY")}</Button>
          }
        >
          {t("LANGUAGES_ERROR")}
        </Alert>
      )}
      {companies.isError && (
        <Alert
          severity="error"
          action={
            <Button onClick={() => companies.refetch()}>{t("RETRY")}</Button>
          }
        >
          {t("LOOKUP_ERROR")}
        </Alert>
      )}
      <div className="flex flex-col gap-16 mt-24">
        {fields.map((field, index) => (
          <ShipmentCityItem
            key={field.formKey}
            index={index}
            company={companies.data?.results.find(
              (company) => company.id === field.shippingCompanyId,
            )}
          />
        ))}
      </div>
    </section>
  );
}
