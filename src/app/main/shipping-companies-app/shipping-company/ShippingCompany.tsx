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
import { useGetShippingCompanyQuery } from "../ShippingCompaniesApi";
import ShippingCompanyModel, {
  shippingCompanyDefaultValues,
} from "../models/ShippingCompanyModel";
import IShippingCompany from "../models/IShippingCompany";
import { shippingCompanySchema } from "../models/ShippingCompanySchema";
import ShippingCompanyHeader from "./ShippingCompanyHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";

function ShippingCompany() {
  const { shippingCompanyId } = useParams();
  const { t } = useTranslation("shippingCompaniesApp");
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const isNew = shippingCompanyId === "new";
  const user = useAppSelector(selectUser);
  const permitted = hasOperationPermission(
    "shipping-companies",
    isNew ? "create" : "view",
    user,
  );
  const canEdit = hasOperationPermission(
    "shipping-companies",
    isNew ? "create" : "update",
    user,
  );
  const [tabValue, setTabValue] = useState(0);
  const [ready, setReady] = useState<string>();
  const initialized = useRef<string>();
  const {
    currentData: shippingCompany,
    isError,
    error,
    refetch,
  } = useGetShippingCompanyQuery(shippingCompanyId, {
    skip: isNew || !shippingCompanyId || !permitted,
    refetchOnMountOrArgChange: true,
  });
  const methods = useForm<IShippingCompany>({
    mode: "onChange",
    defaultValues: shippingCompanyDefaultValues,
    resolver: zodResolver(shippingCompanySchema(t)),
  });
  const { reset } = methods;
  useEffect(() => {
    if (
      initialized.current === shippingCompanyId ||
      (!isNew && !shippingCompany)
    )
      return;
    reset(ShippingCompanyModel(isNew ? {} : shippingCompany));
    initialized.current = shippingCompanyId;
    setReady(shippingCompanyId);
    setTabValue(0);
    // Background activation/refetches must preserve unsaved pricing and appearance edits.
  }, [shippingCompanyId, isNew, shippingCompany, reset]);

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
              ? "NO_SUCH_SHIPPING_COMPANY"
              : "LOAD_ERROR",
          )}
        </Alert>
        <Button onClick={() => refetch()}>{t("RETRY")}</Button>
        <Button
          className="mt-24"
          component={Link}
          variant="outlined"
          to="/shipping-companies"
          color="inherit"
        >
          {t("GO_TO_SHIPPING_COMPANIES")}
        </Button>
      </motion.div>
    );
  if (ready !== shippingCompanyId) return <FuseLoading />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={<ShippingCompanyHeader />}
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
                <BasicInfoTab
                  shippingCompany={shippingCompany}
                  disabled={!canEdit}
                />
              </div>
            </div>
          </>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
export default ShippingCompany;
