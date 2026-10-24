import { Box, Typography, TextField, alpha } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import CustomAutoComplete from "app/shared-components/custom-auto-complete/CustomAutoComplete";
import ICountry from "../../../countries-app/models/ICountry";
import IState from "../../../states-app/models/IState";
import ICity from "../../models/ICity";
import { displayName } from "../../Utils";
function StateSection() {
  const { t } = useTranslation("citiesApp");
  const { control, watch, getValues, setValue } = useFormContext<ICity>();
  const { id, countryId, stateId } = watch();
  return (
    <section>
      <Box
        className="py-8 px-16 my-16 rounded-lg"
        sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}
      >
        <Typography className="text-17 font-bold">
          {t("STATE_BELONGS")}
        </Typography>
      </Box>
      <Controller
        name="postalCode"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            className="mt-8 mb-16"
            label={t("ZIP_CODE")}
            fullWidth
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <CustomAutoComplete<ICountry>
        name="countryId"
        label={t("COUNTRY")}
        getItemUrl="v1/countries"
        getItemsUrl="v1/countries?page=0&pageSize=1000"
        getOptionLabel={(item) => displayName(item.name)}
        defaultItem={getValues("country")}
        defaultItemId={countryId}
        disabled={Boolean(id)}
        onChange={() => {
          setValue("stateId", "", { shouldDirty: true, shouldValidate: true });
          setValue("state", undefined);
        }}
      />
      <CustomAutoComplete<IState>
        key={countryId || "no-country"}
        name="stateId"
        label={t("STATE")}
        getItemUrl="v1/states"
        getItemsUrl={`v1/states?page=0&pageSize=1000${countryId ? `&countryId=${encodeURIComponent(countryId)}` : ""}`}
        getOptionLabel={(item) => displayName(item.name)}
        defaultItem={getValues("state")}
        defaultItemId={stateId}
        disabled={Boolean(id) || !countryId}
      />
    </section>
  );
}
export default StateSection;
