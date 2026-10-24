import { useGetStateQuery } from "../../states-app/StatesApi";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { FormProvider, useForm } from "react-hook-form";
import { Alert, Button, Tab, Tabs } from "@mui/material";
import { motion } from "framer-motion";
import FusePageCarded from "@fuse/core/FusePageCarded";
import FuseLoading from "@fuse/core/FuseLoading";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetCityQuery, useGetShipmentCitiesQuery } from "../CitiesApi";
import ICity, { IShipmentCity } from "../models/ICity";
import CityModel, { cityDefaultValues } from "../models/CityModel";
import { citySchema } from "../models/CitySchema";
import CityHeader from "./CityHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
import { citiesPath } from "../Utils";

function City() {
  const { cityId, shippingCompanyId = "all", stateId = "all" } = useParams();
  const { t } = useTranslation("citiesApp");
  const { state: locationState } = useLocation();
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const isNew = cityId === "new";
  const formKey = `${shippingCompanyId}/${stateId}/${cityId}`;
  const parentQuery = useGetStateQuery(stateId, {
    skip: !isNew || stateId === "all",
  });
  const parentState = parentQuery.currentData;
  const [tabValue, setTabValue] = useState(0);
  const [ready, setReady] = useState<string>();
  const initialized = useRef<string>();
  const cityQuery = useGetCityQuery(cityId, {
    skip: !cityId || isNew,
    refetchOnMountOrArgChange: true,
  });
  const mappingsQuery = useGetShipmentCitiesQuery(cityId, {
    skip: !cityId || isNew,
    refetchOnMountOrArgChange: true,
  });
  const city = cityQuery.currentData;
  const mappings = mappingsQuery.currentData?.results;
  const methods = useForm<ICity>({
    mode: "onChange",
    defaultValues: cityDefaultValues,
    resolver: zodResolver(citySchema(t)),
  });
  const { reset, setValue } = methods;

  useEffect(() => {
    if (initialized.current === formKey) return;
    if (!isNew && (!city || !mappings)) return;
    if (isNew && stateId !== "all" && !parentState) return;
    const shipmentCities = [...(mappings || [])];
    const pending =
      (locationState as { pendingMappings?: IShipmentCity[] })
        ?.pendingMappings || [];
    pending.forEach((row) => {
      const index = shipmentCities.findIndex(
        (item) => item.shippingCompanyId === row.shippingCompanyId,
      );
      if (index < 0) shipmentCities.push(row);
      else shipmentCities[index] = row;
    });
    reset(
      CityModel(
        isNew
          ? {
              stateId: stateId === "all" ? "" : stateId,
              state: parentState,
              countryId:
                parentState?.countryId || parentState?.country?.id || "",
              country: parentState?.country,
            }
          : { ...city, shipmentCities: mappings },
      ),
    );
    if (!isNew && pending.length) {
      setValue("shipmentCities", shipmentCities, { shouldDirty: true });
    }
    initialized.current = formKey;
    setReady(formKey);
    setTabValue(0);
    // Initialize per route so carrier saves/refetches never discard unsaved form edits.
  }, [
    formKey,
    cityId,
    stateId,
    isNew,
    city,
    mappings,
    locationState,
    parentState,
    reset,
    setValue,
  ]);

  const failedQuery = parentQuery.isError
    ? parentQuery
    : cityQuery.isError
      ? cityQuery
      : mappingsQuery.isError
        ? mappingsQuery
        : undefined;
  if (failedQuery)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.1 } }}
        className="flex flex-col flex-1 items-center justify-center h-full"
      >
        <Alert severity="error">
          {t(
            (failedQuery.error as { status?: number })?.status === 404
              ? "NO_SUCH_CITY"
              : "SOMETHING_WENT_WRONG",
          )}
        </Alert>
        <Button onClick={() => failedQuery.refetch()}>{t("RETRY")}</Button>
        <Button
          className="mt-24"
          component={Link}
          variant="outlined"
          to={citiesPath(shippingCompanyId, stateId)}
          color="inherit"
        >
          {t("GO_TO_CITIES")}
        </Button>
      </motion.div>
    );
  if (ready !== formKey) return <FuseLoading />;

  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={
          <CityHeader
            original={city ? { ...city, shipmentCities: mappings } : undefined}
          />
        }
        content={
          <>
            <Tabs
              value={tabValue}
              onChange={(_, value) => setTabValue(value)}
              indicatorColor="secondary"
              textColor="secondary"
              variant="scrollable"
              scrollButtons="auto"
              classes={{ root: "w-full h-64 border-b-1" }}
            >
              <Tab className="h-64" label={t("BASIC_INFO")} />
            </Tabs>
            <div className="p-16 sm:p-24 max-w-4xl">
              <div className={tabValue !== 0 ? "hidden" : ""}>
                <BasicInfoTab />
              </div>
            </div>
          </>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}

export default City;
