import { Box, Typography, alpha } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import CustomAutoComplete from "app/shared-components/custom-auto-complete/CustomAutoComplete";
import ICountry from "../../../countries-app/models/ICountry";
import IState from "../../models/IState";
import { displayName } from "../../Utils";
function CountrySection() {
  const { t } = useTranslation("statesApp");
  const { watch, getValues } = useFormContext<IState>();
  const { id, countryId } = watch();
  return (
    <section>
      <Box
        className="py-8 px-16 my-16 rounded-lg"
        sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) }}
      >
        <Typography className="text-17 font-bold">
          {t("COUNTRY_BELONGS")}
        </Typography>
      </Box>
      <CustomAutoComplete<ICountry>
        name="countryId"
        label={t("COUNTRY")}
        getItemUrl="v1/countries"
        getItemsUrl="v1/countries?page=0&pageSize=1000"
        getOptionLabel={(item) => displayName(item.name)}
        defaultItem={getValues("country")}
        defaultItemId={countryId}
        disabled={Boolean(id)}
      />
    </section>
  );
}
export default CountrySection;
