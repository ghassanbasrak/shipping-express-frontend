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
import { useGetAdminQuery } from "../AdminsApi";
import AdminModel, { adminDefaultValues } from "../models/AdminModel";
import IAdmin from "../models/IAdmin";
import { adminSchema } from "../models/AdminSchema";
import AdminHeader from "./AdminHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";

function Admin() {
  const { adminId } = useParams();
  const { t } = useTranslation("adminsApp");
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const isNew = adminId === "new";
  const user = useAppSelector(selectUser);
  const permitted = hasOperationPermission(
    "admins",
    isNew ? "create" : "view",
    user,
  );
  const canEdit = hasOperationPermission(
    "admins",
    isNew ? "create" : "update",
    user,
  );
  const [tabValue, setTabValue] = useState(0);
  const [ready, setReady] = useState<string>();
  const initialized = useRef<string>();
  const {
    currentData: admin,
    isError,
    error,
    refetch,
  } = useGetAdminQuery(adminId, {
    skip: isNew || !adminId || !permitted,
    refetchOnMountOrArgChange: true,
  });
  const methods = useForm<IAdmin>({
    mode: "onChange",
    defaultValues: adminDefaultValues,
    resolver: zodResolver(adminSchema),
  });
  const { reset } = methods;
  useEffect(() => {
    if (initialized.current === adminId || (!isNew && !admin)) return;
    reset(AdminModel(isNew ? {} : admin));
    initialized.current = adminId;
    setReady(adminId);
    setTabValue(0);
    // Blocking and background refetches must preserve unsaved permission edits.
  }, [adminId, isNew, admin, reset]);

  if (isNew) return <Navigate to="/admins" replace />;
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
              ? "NO_SUCH_ADMIN"
              : "LOAD_ERROR",
          )}
        </Alert>
        <Button color="primary" variant="outlined" onClick={() => refetch()}>
          {t("RETRY")}
        </Button>
        <Button
          className="mt-24"
          component={Link}
          variant="outlined"
          to="/admins"
          color="primary"
        >
          {t("GO_TO_ADMINS")}
        </Button>
      </motion.div>
    );
  if (ready !== adminId) return <FuseLoading />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={<AdminHeader />}
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
                <BasicInfoTab admin={admin} disabled={!canEdit} />
              </div>
            </div>
          </>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
export default Admin;
