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
import { useGetCouponQuery } from "../CouponsApi";
import CouponModel, { couponDefaultValues } from "../models/CouponModel";
import ICoupon from "../models/ICoupon";
import { couponSchema } from "../models/CouponSchema";
import { couponsPath, generateCouponCode } from "../Utils";
import CouponHeader from "./CouponHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";

function Coupon() {
  const { couponId, shippingCompanyId = "all", userId = "all" } = useParams();
  const routeKey = `${shippingCompanyId}/${userId}/${couponId}`;
  const { t } = useTranslation("couponsApp");
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const isNew = couponId === "new";
  const user = useAppSelector(selectUser);
  const permitted = hasOperationPermission(
    "coupons",
    isNew ? "create" : "view",
    user,
  );
  const canEdit = hasOperationPermission(
    "coupons",
    isNew ? "create" : "update",
    user,
  );
  const [tabValue, setTabValue] = useState(0);
  const [ready, setReady] = useState<string>();
  const initialized = useRef<string>();
  const {
    currentData: coupon,
    isError,
    error,
    refetch,
  } = useGetCouponQuery(couponId, {
    skip: isNew || !couponId || !permitted,
    refetchOnMountOrArgChange: true,
  });
  const methods = useForm<ICoupon>({
    mode: "onChange",
    defaultValues: couponDefaultValues,
    resolver: zodResolver(couponSchema(t)),
  });
  const { reset } = methods;
  useEffect(() => {
    if (initialized.current === routeKey || (!isNew && !coupon)) return;
    reset(
      CouponModel(
        isNew ? { shippingCompanyId, code: generateCouponCode() } : coupon,
      ),
    );
    initialized.current = routeKey;
    setReady(routeKey);
    setTabValue(0);
    // Preserve form drafts when invalidation triggers a background refetch.
  }, [couponId, shippingCompanyId, routeKey, isNew, coupon, reset]);

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
              ? "NO_SUCH_COUPON"
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
          to={couponsPath(shippingCompanyId, userId)}
          color="primary"
        >
          {t("GO_TO_COUPONS")}
        </Button>
      </motion.div>
    );
  if (ready !== routeKey) return <FuseLoading />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={<CouponHeader />}
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
                <BasicInfoTab coupon={coupon} disabled={!canEdit} />
              </div>
            </div>
          </>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
export default Coupon;
