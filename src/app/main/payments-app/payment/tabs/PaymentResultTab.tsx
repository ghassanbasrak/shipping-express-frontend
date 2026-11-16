import { useEffect, useRef, useState } from "react";
import { Alert, Button, Chip, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FuseLoading from "@fuse/core/FuseLoading";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import {
  useLazyGetPaymentQuery,
  useCheckPaymentStatusMutation,
} from "../../PaymentsApi";
import IPayment from "../../models/IPayment";
import {
  loadPaymentResult,
  paymentStatus,
  toPaymentStatusTitle,
  toPaymentStatusColor,
  paymentType,
  toPaymentTypeTitle,
  toPaymentTypeColor,
  toPaymentMethodTypeTitle,
  toPaymentMethodTypeColor,
} from "../../Utils";
import StoragePaymentResult from "../../../storage-subscriptions-app/StoragePaymentResult";
import Currency from "../../../utils/currencyFormatter";
export default function PaymentResultTab({ id }: { id: string }) {
  const { t } = useTranslation("paymentsApp"),
    user = useAppSelector(selectUser),
    auth = useJwtAuth(),
    [getPayment] = useLazyGetPaymentQuery(),
    [check] = useCheckPaymentStatusMutation(),
    [payment, setPayment] = useState<IPayment>(),
    [error, setError] = useState(""),
    [verificationFailed, setVerificationFailed] = useState(false),
    [busy, setBusy] = useState(true),
    [attempt, setAttempt] = useState(0),
    work = useRef(new Map<string, ReturnType<typeof loadPaymentResult>>());
  useEffect(() => {
    let active = true;
    const key = [user.id, id, attempt].join("/");
    setBusy(true);
    setError("");
    setVerificationFailed(false);
    setPayment(undefined);
    if (!work.current.has(key))
      work.current.set(
        key,
        loadPaymentResult(
          user,
          id,
          () => getPayment(id, false).unwrap(),
          () => check({ id, userId: user.id }).unwrap(),
        ),
      );
    work.current
      .get(key)
      .then(({ payment: result, verificationFailed: failed }) => {
        if (!active) return;
        setPayment(result);
        setVerificationFailed(failed);
        if (!failed && result.status === paymentStatus.confirmed) {
          void auth.getUser().catch(() => {});
        }
      })
      .catch((failure) => {
        if (active)
          setError(
            failure?.status === 404 ? "NO_SUCH_PAYMENT" : "LOAD_PAYMENT_ERROR",
          );
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [id, user.id, user.role, attempt]);
  if (busy) return <FuseLoading />;
  if (error || !payment)
    return (
      <Alert
        severity="error"
        action={
          <Button onClick={() => setAttempt((value) => value + 1)}>
            {t("RETRY")}
          </Button>
        }
      >
        {t(error || "LOAD_PAYMENT_ERROR")}
      </Alert>
    );
  if (payment.type === paymentType.storageSubscription)
    return <StoragePaymentResult paymentId={id} />;
  const success = payment.status === paymentStatus.confirmed;
  return (
    <Paper
      variant="outlined"
      className="p-24 rounded-16 space-y-20 max-w-2xl mx-auto"
      data-testid="payment-result"
    >
      <Typography variant="h5">
        {t(
          verificationFailed
            ? "PAYMENT_STATUS_UNVERIFIED"
            : success
              ? "PAYMENT_DONE"
              : payment.status === paymentStatus.pending
                ? "PAYMENT_PENDING"
                : "THE_CHECKOUT_PROCESS_HAS_FAILED",
        )}
      </Typography>
      <Chip
        label={t(toPaymentStatusTitle(payment.status))}
        className={toPaymentStatusColor(payment.status) + " text-white"}
      />
      <div className="flex flex-wrap gap-8">
        <Chip
          label={t(toPaymentTypeTitle(payment.type))}
          className={toPaymentTypeColor(payment.type) + " text-white"}
        />
        <Chip
          label={t(toPaymentMethodTypeTitle(payment.paymentMethodType))}
          className={
            toPaymentMethodTypeColor(payment.paymentMethodType) + " text-white"
          }
        />
      </div>
      <Typography>
        {t("TRANSACTION_ID")}: {payment.transactionId || "—"}
      </Typography>
      <Typography>
        {t("TOPUP_AMOUNT")}: {Currency(payment.amount)}
      </Typography>
      <Typography>
        {t("TAX")}: {Currency(payment.taxTotal ?? 0)}
      </Typography>
      <Typography>
        {t("TOTAL")}: {Currency(payment.total ?? payment.amount)}
      </Typography>
      {verificationFailed ? (
        <Alert severity="warning">
          {t("PAYMENT_VERIFICATION_UNAVAILABLE")}
        </Alert>
      ) : success ? (
        <Alert
          severity={
            payment.metadata?.balanceUpdateFailed ? "warning" : "success"
          }
        >
          {t(
            payment.metadata?.balanceUpdateFailed
              ? "CREDIT_PROCESSING"
              : "SERVER_CONFIRMED",
          )}
        </Alert>
      ) : (
        <Alert
          severity={payment.status === paymentStatus.refused ? "error" : "info"}
        >
          {payment.responseMessage || t("PAYMENT_CHECK_HINT")}
        </Alert>
      )}
      {(!success || verificationFailed) && (
        <Button
          variant="outlined"
          onClick={() => setAttempt((value) => value + 1)}
        >
          {t("RETRY_PAYMENT_CHECK")}
        </Button>
      )}
      <Button component={Link} to="/payments/all">
        {t("GO_TO_PAYMENTS")}
      </Button>
    </Paper>
  );
}
