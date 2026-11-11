import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  useVerifyStoragePaymentMutation,
  useGetStorageSubscriptionQuery,
  type StoragePaymentResponse,
} from "./StorageApi";
import { hasActiveStorageSubscription, storageError } from "./Utils";
import StorageGate from "./shared/StorageGate";
export default function StoragePaymentResult() {
  const { t } = useTranslation("storageApp"),
    user = useAppSelector(selectUser),
    [params] = useSearchParams(),
    navigate = useNavigate();
  const paymentId = params.get("paymentId"),
    gatewayId = params.get("id");
  const [verify] = useVerifyStoragePaymentMutation(),
    subscription = useGetStorageSubscriptionQuery(user.id, {
      skip: user.role !== "user",
      refetchOnMountOrArgChange: true,
    });
  const [attempt, setAttempt] = useState(0),
    [state, setState] = useState({
      busy: true,
      verified: false,
      failed: false,
      error: "",
    });
  const requests = useRef(new Map<string, Promise<StoragePaymentResponse>>());
  useEffect(() => {
    let active = true;
    const key = [user.id, paymentId, gatewayId, attempt].join("/");
    setState({ busy: true, verified: false, failed: false, error: "" });
    if (!requests.current.has(key))
      requests.current.set(
        key,
        (async () => {
          if (user.role !== "user" || !paymentId || !gatewayId)
            throw new Error(t("PAYMENT_INVALID"));
          const payment = await verify({
            paymentId,
            moyasarPaymentId: gatewayId,
          }).unwrap();
          if (
            payment.id !== paymentId ||
            payment.userId !== user.id ||
            !payment.storagePlanId
          )
            throw new Error(t("PAYMENT_INVALID"));
          if (payment.status !== "success")
            throw Object.assign(
              new Error(
                t(
                  payment.status === "failed"
                    ? "PAYMENT_FAILED"
                    : "PAYMENT_PENDING",
                ),
              ),
              { paymentFailed: payment.status === "failed" },
            );
          return payment;
        })(),
      );
    requests.current
      .get(key)
      .then(() => {
        if (active) {
          setState({ busy: false, verified: true, failed: false, error: "" });
          void subscription.refetch();
        }
      })
      .catch((error) => {
        if (active)
          setState({
            busy: false,
            verified: false,
            failed: error.paymentFailed === true,
            error: storageError(error, t("SAVE_ERROR")),
          });
      });
    return () => {
      active = false;
    };
  }, [user.id, user.role, paymentId, gatewayId, attempt]);
  // Observe the fulfilled entitlement query. A lazy-query promise can still carry
  // the pre-payment cache value while a navigation read is being invalidated.
  const success =
    state.verified &&
    !subscription.isError &&
    hasActiveStorageSubscription(subscription.currentData, user.id) &&
    subscription.currentData.paymentId === paymentId;
  const busy = state.busy || (state.verified && subscription.isFetching);
  useEffect(() => {
    if (success)
      try {
        sessionStorage.removeItem("storage-checkout:" + user.id);
      } catch {}
  }, [success, user.id]);
  return (
    <StorageGate>
      <div
        className="p-16 sm:p-24 max-w-2xl mx-auto"
        data-testid="storage-payment-result"
      >
        <Paper variant="outlined" className="p-24 rounded-16 space-y-20">
          <Typography className="text-24 font-bold">
            {t("STORAGE_PAYMENT")}
          </Typography>
          {busy ? (
            <CircularProgress />
          ) : success ? (
            <Alert severity="success">{t("SUBSCRIPTION_SUCCESS")}</Alert>
          ) : (
            <Alert severity="error">
              {state.error || t("SUBSCRIPTION_REFRESH")}
            </Alert>
          )}
          <div className="flex flex-wrap gap-12">
            {!busy && !success && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  if (state.verified) void subscription.refetch();
                  else setAttempt((value) => value + 1);
                }}
              >
                {t("RETRY_VERIFICATION")}
              </Button>
            )}
            {state.failed && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  try {
                    const key = "storage-checkout:" + user.id,
                      pending = JSON.parse(sessionStorage.getItem(key));
                    if (
                      pending?.payment?.id === paymentId &&
                      pending.payment.userId === user.id
                    ) {
                      delete pending.gatewayId;
                      sessionStorage.setItem(key, JSON.stringify(pending));
                    }
                  } catch {}
                  navigate("/storage");
                }}
              >
                {t("RETRY_CARD")}
              </Button>
            )}
            <Button
              component={Link}
              to="/storage"
              variant="outlined"
              color="primary"
            >
              {t("BACK_TO_STORAGE")}
            </Button>
          </div>
        </Paper>
      </div>
    </StorageGate>
  );
}
