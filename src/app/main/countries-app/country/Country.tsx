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
import {
  useGetCountryQuery,
  useGetShipmentCountriesQuery,
} from "../CountriesApi";
import ICountry, { IShipmentCountry } from "../models/ICountry";
import CountryModel, { countryDefaultValues } from "../models/CountryModel";
import { countrySchema } from "../models/CountrySchema";
import CountryHeader from "./CountryHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
import { countriesPath } from "../Utils";

function Country() {
  const { countryId, shippingCompanyId = "all" } = useParams();
  const { t } = useTranslation("countriesApp");
  const { state } = useLocation();
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const isNew = countryId === "new";
  const [tabValue, setTabValue] = useState(0);
  const [ready, setReady] = useState<string>();
  const initialized = useRef<string>();
  const countryQuery = useGetCountryQuery(countryId, {
    skip: !countryId || isNew,
    refetchOnMountOrArgChange: true,
  });
  const mappingsQuery = useGetShipmentCountriesQuery(countryId, {
    skip: !countryId || isNew,
    refetchOnMountOrArgChange: true,
  });
  const country = countryQuery.currentData;
  const mappings = mappingsQuery.currentData?.results;
  const methods = useForm<ICountry>({
    mode: "onChange",
    defaultValues: countryDefaultValues,
    resolver: zodResolver(countrySchema(t)),
  });
  const { reset, setValue } = methods;

  useEffect(() => {
    if (initialized.current === countryId) return;
    if (!isNew && (!country || !mappings)) return;
    const shipmentCountries = [...(mappings || [])];
    const pending =
      (state as { pendingMappings?: IShipmentCountry[] })?.pendingMappings ||
      [];
    pending.forEach((row) => {
      const index = shipmentCountries.findIndex(
        (item) => item.shippingCompanyId === row.shippingCompanyId,
      );
      if (index < 0) shipmentCountries.push(row);
      else shipmentCountries[index] = row;
    });
    reset(
      CountryModel(isNew ? {} : { ...country, shipmentCountries: mappings }),
    );
    if (!isNew && pending.length) {
      setValue("shipmentCountries", shipmentCountries, { shouldDirty: true });
    }
    initialized.current = countryId;
    setReady(countryId);
    setTabValue(0);
    // Initialize per route so carrier saves/refetches never discard unsaved form edits.
  }, [countryId, isNew, country, mappings, state, reset, setValue]);

  const failedQuery = countryQuery.isError
    ? countryQuery
    : mappingsQuery.isError
      ? mappingsQuery
      : undefined;
  if (!isNew && failedQuery)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.1 } }}
        className="flex flex-col flex-1 items-center justify-center h-full"
      >
        <Alert severity="error">
          {t(
            (failedQuery.error as { status?: number })?.status === 404
              ? "NO_SUCH_COUNTRY"
              : "SOMETHING_WENT_WRONG",
          )}
        </Alert>
        <Button
          color="primary"
          variant="outlined"
          onClick={() => failedQuery.refetch()}
        >
          {t("RETRY")}
        </Button>
        <Button
          className="mt-24"
          component={Link}
          variant="outlined"
          to={countriesPath(shippingCompanyId)}
          color="primary"
        >
          {t("GO_TO_COUNTRIES")}
        </Button>
      </motion.div>
    );
  if (ready !== countryId) return <FuseLoading />;

  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={
          <CountryHeader
            original={
              country ? { ...country, shipmentCountries: mappings } : undefined
            }
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

export default Country;
