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
  ownsPayment,
  paymentStatus,
  toPaymentStatusTitle,
  toPaymentStatusColor,
  paymentType,
  isPaymentType,
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
    [error, setError] = useState(false),
    [busy, setBusy] = useState(true),
    [attempt, setAttempt] = useState(0),
    work = useRef(new Map<string, Promise<IPayment>>());
  useEffect(() => {
    let active = true;
    const key = [user.id, id, attempt].join("/");
    setBusy(true);
    setError(false);
    setPayment(undefined);
    if (!work.current.has(key))
      work.current.set(
        key,
        (async () => {
          if (!id) throw new Error("paymentId");
          const stored = await getPayment(id, false).unwrap();
          if (
            !ownsPayment(user, stored) ||
            (stored.id || stored._id) !== id ||
            !isPaymentType(stored.type)
          )
            throw new Error("owner");
          if (stored.type === paymentType.storageSubscription) return stored;
          const result = await check({ id, userId: user.id }).unwrap();
          if (
            !ownsPayment(user, result) ||
            (result.id || result._id) !== id ||
            result.type !== paymentType.topup
          )
            throw new Error("owner");
          return result;
        })(),
      );
    work.current
      .get(key)
      .then((result) => {
        if (!active) return;
        setPayment(result);
        if (result.status === paymentStatus.confirmed) {
          void auth.getUser().catch(() => {});
        }
      })
      .catch(() => {
        if (active) setError(true);
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
        {t("NO_SUCH_PAYMENT")}
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
          success
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
      {success ? (
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
      {!success && (
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
