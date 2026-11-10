import { useEffect, useRef, useState } from "react";
import { Alert, Button, Chip, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FuseLoading from "@fuse/core/FuseLoading";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import {
  useLazyGetTopupRequestQuery,
  useCheckTopupStatusMutation,
} from "../../TopupRequestsApi";
import ITopupRequest from "../../models/ITopupRequest";
import {
  ownsTopupRequest,
  topupRequestStatus,
  toTopupRequestStatusTitle,
  toTopupRequestStatusColor,
} from "../../Utils";
import Currency from "../../../utils/currencyFormatter";
export default function PaymentResultTab({
  id,
  gatewayId,
}: {
  id: string;
  gatewayId?: string;
}) {
  const { t } = useTranslation("topupRequestsApp"),
    user = useAppSelector(selectUser),
    auth = useJwtAuth(),
    [getPayment] = useLazyGetTopupRequestQuery(),
    [check] = useCheckTopupStatusMutation(),
    [payment, setPayment] = useState<ITopupRequest>(),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(true),
    [attempt, setAttempt] = useState(0),
    work = useRef(new Map<string, Promise<ITopupRequest>>());
  useEffect(() => {
    let active = true;
    const providerId = gatewayId,
      key = `${user.id}/${id}/${providerId || ""}/${attempt}`;
    setBusy(true);
    setError(false);
    setPayment(undefined);
    if (!work.current.has(key))
      work.current.set(
        key,
        (async () => {
          const stored = await getPayment(id, false).unwrap();
          if (
            !ownsTopupRequest(user, stored) ||
            (stored.id || stored._id) !== id
          )
            throw new Error("owner");
          // Storage payments have a separate entitlement confirmation flow.
          if (
            stored.storagePlanId ||
            stored.status === "success" ||
            !providerId
          )
            return stored;
          const result = await check({
            id,
            moyasarPaymentId: providerId,
          }).unwrap();
          if (
            !ownsTopupRequest(user, result) ||
            (result.id || result._id) !== id ||
            result.storagePlanId
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
        if (result.status === "success") {
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
  }, [id, gatewayId, user.id, user.role, attempt]);
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
        {t("NO_SUCH_TOPUP_REQUEST")}
      </Alert>
    );
  const success = payment.status === topupRequestStatus.confirmed;
  return (
    <Paper
      variant="outlined"
      className="p-24 rounded-16 space-y-20 max-w-2xl mx-auto"
      data-testid="topup-result"
    >
      <Typography variant="h5">
        {t(
          success
            ? "PAYMENT_DONE"
            : payment.status === "pending"
              ? "PAYMENT_PENDING"
              : "THE_CHECKOUT_PROCESS_HAS_FAILED",
        )}
      </Typography>
      <Chip
        label={t(toTopupRequestStatusTitle(payment.status))}
        className={toTopupRequestStatusColor(payment.status) + " text-white"}
      />
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
        <Alert severity="info">
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
      <Button component={Link} to="/topup-requests/all">
        {t("GO_TO_TOPUP_REQUESTS")}
      </Button>
    </Paper>
  );
}
