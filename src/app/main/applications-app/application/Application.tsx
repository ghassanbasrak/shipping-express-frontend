import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link, Navigate, useParams } from "react-router-dom";
import { Alert, Button, Tab, Tabs } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import FusePageCarded from "@fuse/core/FusePageCarded";
import FuseLoading from "@fuse/core/FuseLoading";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { useGetApplicationQuery } from "../ApplicationsApi";
import ApplicationModel, {
  applicationDefaultValues,
} from "../models/ApplicationModel";
import IApplication from "../models/IApplication";
import { applicationSchema } from "../models/ApplicationSchema";
import ApplicationHeader from "./ApplicationHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";

function Application() {
  const { applicationId } = useParams();
  const { t } = useTranslation("applicationsApp");
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const isNew = applicationId === "new";
  const user = useAppSelector(selectUser);
  const canView = hasOperationPermission("applications", "view", user);
  const permitted =
    canView &&
    hasOperationPermission("applications", isNew ? "create" : "view", user);
  const canEdit =
    canView &&
    hasOperationPermission("applications", isNew ? "create" : "update", user);
  const [tabValue, setTabValue] = useState(0);
  const [ready, setReady] = useState<string>();
  const initialized = useRef<string>();
  const {
    currentData: application,
    isError,
    error,
    refetch,
  } = useGetApplicationQuery(applicationId, {
    skip: isNew || !applicationId || !permitted,
    refetchOnMountOrArgChange: true,
  });
  const methods = useForm<IApplication>({
    mode: "onChange",
    defaultValues: ApplicationModel(applicationDefaultValues),
    resolver: zodResolver(applicationSchema(t)),
  });
  const { reset } = methods;
  useEffect(() => {
    if (initialized.current === applicationId || (!isNew && !application))
      return;
    reset(ApplicationModel(isNew ? {} : application));
    initialized.current = applicationId;
    setReady(applicationId);
    setTabValue(0);
    // Preserve application drafts and scope limits during background refetches.
  }, [applicationId, isNew, application, reset]);

  if (!permitted) return <Navigate to="/home" replace />;
  if (isError && !isNew)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.1 } }}
        className="flex flex-col flex-1 items-center justify-center h-full"
      >
        <Alert severity="error">
          {t(
            (error as { status?: number })?.status === 404
              ? "NO_SUCH_APPLICATION"
              : "LOAD_ERROR",
          )}
        </Alert>
        <Button onClick={() => refetch()}>{t("RETRY")}</Button>
        <Button
          className="mt-24"
          component={Link}
          variant="outlined"
          to="/applications"
          color="inherit"
        >
          {t("GO_TO_APPLICATIONS")}
        </Button>
      </motion.div>
    );
  if (ready !== applicationId) return <FuseLoading />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={<ApplicationHeader />}
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
            <div className="p-16 sm:p-24 max-w-6xl">
              <div className={tabValue !== 0 ? "hidden" : ""}>
                <BasicInfoTab application={application} disabled={!canEdit} />
              </div>
            </div>
          </>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
export default Application;
