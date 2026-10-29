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
import { useGetStateQuery, useGetShipmentStatesQuery } from "../StatesApi";
import IState, { IShipmentState } from "../models/IState";
import StateModel, { stateDefaultValues } from "../models/StateModel";
import { stateSchema } from "../models/StateSchema";
import StateHeader from "./StateHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
import { statesPath } from "../Utils";

function State() {
  const { stateId, shippingCompanyId = "all", countryId = "all" } = useParams();
  const { t } = useTranslation("statesApp");
  const { state: locationState } = useLocation();
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const isNew = stateId === "new";
  const formKey = `${shippingCompanyId}/${countryId}/${stateId}`;
  const [tabValue, setTabValue] = useState(0);
  const [ready, setReady] = useState<string>();
  const initialized = useRef<string>();
  const stateQuery = useGetStateQuery(stateId, {
    skip: !stateId || isNew,
    refetchOnMountOrArgChange: true,
  });
  const mappingsQuery = useGetShipmentStatesQuery(stateId, {
    skip: !stateId || isNew,
    refetchOnMountOrArgChange: true,
  });
  const state = stateQuery.currentData;
  const mappings = mappingsQuery.currentData?.results;
  const methods = useForm<IState>({
    mode: "onChange",
    defaultValues: stateDefaultValues,
    resolver: zodResolver(stateSchema(t)),
  });
  const { reset, setValue } = methods;

  useEffect(() => {
    if (initialized.current === formKey) return;
    if (!isNew && (!state || !mappings)) return;
    const shipmentStates = [...(mappings || [])];
    const pending =
      (locationState as { pendingMappings?: IShipmentState[] })
        ?.pendingMappings || [];
    pending.forEach((row) => {
      const index = shipmentStates.findIndex(
        (item) => item.shippingCompanyId === row.shippingCompanyId,
      );
      if (index < 0) shipmentStates.push(row);
      else shipmentStates[index] = row;
    });
    reset(
      StateModel(
        isNew
          ? { countryId: countryId === "all" ? "" : countryId }
          : { ...state, shipmentStates: mappings },
      ),
    );
    if (!isNew && pending.length) {
      setValue("shipmentStates", shipmentStates, { shouldDirty: true });
    }
    initialized.current = formKey;
    setReady(formKey);
    setTabValue(0);
    // Initialize per route so carrier saves/refetches never discard unsaved form edits.
  }, [
    formKey,
    stateId,
    countryId,
    isNew,
    state,
    mappings,
    locationState,
    reset,
    setValue,
  ]);

  const failedQuery = stateQuery.isError
    ? stateQuery
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
              ? "NO_SUCH_STATE"
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
          to={statesPath(shippingCompanyId, countryId)}
          color="primary"
        >
          {t("GO_TO_STATES")}
        </Button>
      </motion.div>
    );
  if (ready !== formKey) return <FuseLoading />;

  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={
          <StateHeader
            original={
              state ? { ...state, shipmentStates: mappings } : undefined
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

export default State;
