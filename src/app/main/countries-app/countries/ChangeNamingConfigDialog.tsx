import { Alert, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import FuseLoading from "@fuse/core/FuseLoading";
import CustomDialog from "app/shared-components/custom-dialog/CustomDialog";
import {
  useGetCountryQuery,
  useGetShipmentCountriesQuery,
} from "../CountriesApi";
import ICountry from "../models/ICountry";
import CountryModel from "../models/CountryModel";
import { countrySchema } from "../models/CountrySchema";
import NamingConfigSection from "../country/sections/NamingConfigSection";
import { displayName } from "../Utils";
export default function ChangeNamingConfigDialog({
  country,
}: {
  country: ICountry;
}) {
  const { t } = useTranslation("countriesApp");
  const query = useGetCountryQuery(country.id, {
    refetchOnMountOrArgChange: true,
  });
  const mappings = useGetShipmentCountriesQuery(country.id, {
    refetchOnMountOrArgChange: true,
  });
  const title = `${t("CHANGE_NAMING_CONFIG_FOR")} "${displayName(country.name)}"`;
  if (!query.currentData || !mappings.currentData)
    return (
      <CustomDialog
        title={title}
        closeIcon
        noActions
        message={
          query.isError || mappings.isError ? (
            <Alert
              severity="error"
              action={
                <Button
                  color="primary"
                  variant="outlined"
                  onClick={() => {
                    query.refetch();
                    mappings.refetch();
                  }}
                >
                  {t("RETRY")}
                </Button>
              }
            >
              {t("SOMETHING_WENT_WRONG")}
            </Alert>
          ) : (
            <FuseLoading />
          )
        }
      />
    );
  return (
    <CustomDialog
      key={`country-names-${country.id}`}
      title={title}
      closeIcon
      noActions
      form
      formSchema={countrySchema(t)}
      formDefaultValues={CountryModel({
        ...query.currentData,
        shipmentCountries: mappings.currentData.results,
      })}
      message={<NamingConfigSection withoutLocaleNames />}
    />
  );
}
