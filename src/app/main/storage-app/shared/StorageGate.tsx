import { useEffect, useState, type ReactNode } from "react";
import { Alert, Button } from "@mui/material";
import { Link, Navigate } from "react-router-dom";
import FuseLoading from "@fuse/core/FuseLoading";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { useTranslation } from "react-i18next";
import { useGetStorageSubscriptionQuery } from "../StorageApi";
import {
  canManageStorage,
  canUseStorage,
  hasActiveStorageSubscription,
} from "../Utils";
import { storageEnabled } from "../storageConfig";
export default function StorageGate({
  children,
  adminOnly = false,
  subscriptionRequired = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
  subscriptionRequired?: boolean;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const user = useAppSelector(selectUser),
    { t } = useTranslation("storageApp");
  const allowed = adminOnly ? canManageStorage(user) : canUseStorage(user);
  const subscription = useGetStorageSubscriptionQuery(user?.id, {
    skip:
      !storageEnabled ||
      !allowed ||
      user.role !== "user" ||
      !subscriptionRequired,
    refetchOnMountOrArgChange: true,
  });
  if (!allowed) return <Navigate to="/error/401" replace />;
  if (!storageEnabled)
    return (
      <div className="p-24">
        <Alert severity="info">{t("SERVICE_UNAVAILABLE")}</Alert>
      </div>
    );
  if (subscriptionRequired && user.role === "user") {
    if (
      subscription.isError &&
      !hasActiveStorageSubscription(subscription.currentData, user.id, now)
    )
      return (
        <div className="p-24">
          <Alert
            severity="error"
            action={
              <Button onClick={() => subscription.refetch()}>
                {t("RETRY")}
              </Button>
            }
          >
            {t("LOAD_ERROR")}
          </Alert>
        </div>
      );
    if (!subscription.currentData && subscription.isFetching)
      return <FuseLoading />;
    if (!hasActiveStorageSubscription(subscription.currentData, user.id, now))
      return (
        <div className="p-24">
          <Alert
            severity="info"
            action={
              <Button component={Link} to="/storage">
                {t("VIEW_PLANS")}
              </Button>
            }
          >
            {t("SUBSCRIPTION_REQUIRED")}
          </Alert>
        </div>
      );
  }
  return children;
}
