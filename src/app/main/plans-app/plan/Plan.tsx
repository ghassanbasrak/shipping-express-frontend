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
import { useGetPlanQuery } from "../PlansApi";
import PlanModel, { planDefaultValues } from "../models/PlanModel";
import { PlanFormValues } from "../models/PlanSchema";
import { toPlanFormValues } from "../Utils";
import { planSchema } from "../models/PlanSchema";
import PlanHeader from "./PlanHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";

function Plan() {
  const { planId } = useParams();
  const { t } = useTranslation("plansApp");
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const isNew = planId === "new";
  const user = useAppSelector(selectUser);
  const permitted = hasOperationPermission(
    "plans",
    isNew ? "create" : "view",
    user,
  );
  const canEdit = hasOperationPermission(
    "plans",
    isNew ? "create" : "update",
    user,
  );
  const [tabValue, setTabValue] = useState(0);
  const [ready, setReady] = useState<string>();
  const initialized = useRef<string>();
  const {
    currentData: plan,
    isError,
    error,
    refetch,
  } = useGetPlanQuery(planId, {
    skip: isNew || !planId || !permitted,
    refetchOnMountOrArgChange: true,
  });
  const methods = useForm<PlanFormValues>({
    mode: "onChange",
    defaultValues: toPlanFormValues(planDefaultValues),
    resolver: zodResolver(planSchema(t)),
  });
  const { reset } = methods;
  useEffect(() => {
    if (initialized.current === planId || (!isNew && !plan)) return;
    reset(toPlanFormValues(PlanModel(isNew ? {} : plan)));
    initialized.current = planId;
    setReady(planId);
    setTabValue(0);
    // Background activation/refetches must preserve unsaved pricing and appearance edits.
  }, [planId, isNew, plan, reset]);

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
              ? "NO_SUCH_PLAN"
              : "LOAD_ERROR",
          )}
        </Alert>
        <Button onClick={() => refetch()}>{t("RETRY")}</Button>
        <Button
          className="mt-24"
          component={Link}
          variant="outlined"
          to="/plans"
          color="inherit"
        >
          {t("GO_TO_PLANS")}
        </Button>
      </motion.div>
    );
  if (ready !== planId) return <FuseLoading />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={<PlanHeader />}
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
                <BasicInfoTab plan={plan} disabled={!canEdit} />
              </div>
            </div>
          </>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
export default Plan;
