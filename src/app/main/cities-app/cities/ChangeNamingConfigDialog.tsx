import { Alert, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import FuseLoading from "@fuse/core/FuseLoading";
import CustomDialog from "app/shared-components/custom-dialog/CustomDialog";
import { useGetCityQuery, useGetShipmentCitiesQuery } from "../CitiesApi";
import ICity from "../models/ICity";
import CityModel from "../models/CityModel";
import { citySchema } from "../models/CitySchema";
import NamingConfigSection from "../city/sections/NamingConfigSection";
import { displayName } from "../Utils";
export default function ChangeNamingConfigDialog({ city }: { city: ICity }) {
  const { t } = useTranslation("citiesApp");
  const query = useGetCityQuery(city.id, {
    refetchOnMountOrArgChange: true,
  });
  const mappings = useGetShipmentCitiesQuery(city.id, {
    refetchOnMountOrArgChange: true,
  });
  const title = `${t("CHANGE_NAMING_CONFIG_FOR")} "${displayName(city.name)}"`;
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
      key={`city-names-${city.id}`}
      title={title}
      closeIcon
      noActions
      form
      formSchema={citySchema(t)}
      formDefaultValues={CityModel({
        ...query.currentData,
        shipmentCities: mappings.currentData.results,
      })}
      message={<NamingConfigSection withoutLocaleNames />}
    />
  );
}
