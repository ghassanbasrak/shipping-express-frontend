import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  useVerifyStoragePaymentMutation,
  useGetStorageSubscriptionQuery,
  type StoragePaymentResponse,
} from "./StorageSubscriptionsApi";
import {
  hasActiveStorageSubscription,
  storageError,
} from "../storage-app/Utils";
import {
  paymentType,
  paymentStatus,
  ownsPayment,
  toPaymentTypeTitle,
  toPaymentTypeColor,
  toPaymentMethodTypeTitle,
  toPaymentMethodTypeColor,
} from "../payments-app/Utils";
import StorageGate from "../storage-app/shared/StorageGate";
export default function StoragePaymentResult({
  paymentId: recordId,
}: { paymentId?: string } = {}) {
  const { t } = useTranslation("storageApp"),
    { t: paymentTitle } = useTranslation("paymentsApp"),
    user = useAppSelector(selectUser),
    [params] = useSearchParams();
  const paymentId = recordId || params.get("paymentId");
  const [verify] = useVerifyStoragePaymentMutation(),
    subscription = useGetStorageSubscriptionQuery(user.id, {
      skip: user.role !== "user",
      refetchOnMountOrArgChange: true,
    });
  const [attempt, setAttempt] = useState(0),
    [verifiedPayment, setVerifiedPayment] = useState<StoragePaymentResponse>(),
    [state, setState] = useState({
      busy: true,
      verified: false,
      failed: false,
      error: "",
    });
  const requests = useRef(new Map<string, Promise<StoragePaymentResponse>>());
  useEffect(() => {
    let active = true;
    const key = [user.id, paymentId, attempt].join("/");
    setState({ busy: true, verified: false, failed: false, error: "" });
    if (!requests.current.has(key))
      requests.current.set(
        key,
        (async () => {
          if (user.role !== "user" || !paymentId)
            throw new Error(t("PAYMENT_INVALID"));
          const payment = await verify({
            paymentId,
            userId: user.id,
          }).unwrap();
          if (
            payment.id !== paymentId ||
            !ownsPayment(user, payment) ||
            payment.type !== paymentType.storageSubscription
          )
            throw new Error(t("PAYMENT_INVALID"));
          return payment;
        })(),
      );
    requests.current
      .get(key)
      .then((payment) => {
        if (!active) return;
        const verified = payment.status === paymentStatus.confirmed;
        setVerifiedPayment(payment);
        setState({
          busy: false,
          verified,
          failed: payment.status === paymentStatus.refused,
          error: verified
            ? ""
            : t(
                payment.status === paymentStatus.refused
                  ? "PAYMENT_FAILED"
                  : "PAYMENT_PENDING",
              ),
        });
        if (verified) void subscription.refetch();
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
  }, [user.id, user.role, paymentId, attempt]);
  // Observe the fulfilled entitlement query. A lazy-query promise can still carry
  // the pre-payment cache value while a navigation read is being invalidated.
  const success =
    state.verified &&
    !subscription.isError &&
    hasActiveStorageSubscription(subscription.currentData, user.id) &&
    subscription.currentData.paymentId === paymentId;
  const busy = state.busy || (state.verified && subscription.isFetching);
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
          {verifiedPayment && (
            <div className="flex flex-wrap gap-8">
              <Chip
                label={paymentTitle(toPaymentTypeTitle(verifiedPayment.type))}
                className={
                  toPaymentTypeColor(verifiedPayment.type) + " text-white"
                }
              />
              <Chip
                label={paymentTitle(
                  toPaymentMethodTypeTitle(verifiedPayment.paymentMethodType),
                )}
                className={
                  toPaymentMethodTypeColor(verifiedPayment.paymentMethodType) +
                  " text-white"
                }
              />
            </div>
          )}
          {busy ? (
            <CircularProgress />
          ) : success ? (
            <Alert severity="success">{t("SUBSCRIPTION_SUCCESS")}</Alert>
          ) : (
            <Alert
              severity={
                verifiedPayment?.status === paymentStatus.pending
                  ? "info"
                  : "error"
              }
            >
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
