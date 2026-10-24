import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link, Navigate, useParams } from "react-router-dom";
import { Alert as MuiAlert, Button, Tab, Tabs } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import FusePageCarded from "@fuse/core/FusePageCarded";
import FuseLoading from "@fuse/core/FuseLoading";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { useGetAlertQuery } from "../AlertsApi";
import AlertModel, { alertDefaultValues } from "../models/AlertModel";
import IAlert from "../models/IAlert";
import { alertSchema } from "../models/AlertSchema";
import AlertHeader from "./AlertHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";

function Alert() {
  const { alertId } = useParams();
  const { t } = useTranslation("alertsApp");
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const isNew = alertId === "new";
  const user = useAppSelector(selectUser);
  const permitted = hasOperationPermission(
    "alerts",
    isNew ? "create" : "view",
    user,
  );
  const canEdit = hasOperationPermission(
    "alerts",
    isNew ? "create" : "update",
    user,
  );
  const [tabValue, setTabValue] = useState(0);
  const [ready, setReady] = useState<string>();
  const initialized = useRef<string>();
  const {
    currentData: alert,
    isError,
    error,
    refetch,
  } = useGetAlertQuery(alertId, {
    skip: isNew || !alertId || !permitted,
    refetchOnMountOrArgChange: true,
  });
  const methods = useForm<IAlert>({
    mode: "onChange",
    defaultValues: alertDefaultValues,
    resolver: zodResolver(alertSchema(t)),
  });
  const { reset } = methods;
  useEffect(() => {
    if (initialized.current === alertId || (!isNew && !alert)) return;
    reset(AlertModel(isNew ? {} : alert));
    initialized.current = alertId;
    setReady(alertId);
    setTabValue(0);
    // Preserve form drafts when invalidation triggers a background refetch.
  }, [alertId, isNew, alert, reset]);

  if (!permitted) return <Navigate to="/home" replace />;
  if (isError && !isNew)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.1 } }}
        className="flex flex-col flex-1 items-center justify-center h-full"
      >
        <MuiAlert severity="error">
          {t(
            (error as { status?: number })?.status === 404
              ? "NO_SUCH_ALERT"
              : "LOAD_ERROR",
          )}
        </MuiAlert>
        <Button onClick={() => refetch()}>{t("RETRY")}</Button>
        <Button
          className="mt-24"
          component={Link}
          variant="outlined"
          to="/alerts"
          color="inherit"
        >
          {t("GO_TO_ALERTS")}
        </Button>
      </motion.div>
    );
  if (ready !== alertId) return <FuseLoading />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={<AlertHeader />}
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
                <BasicInfoTab alert={alert} disabled={!canEdit} />
              </div>
            </div>
          </>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
export default Alert;
