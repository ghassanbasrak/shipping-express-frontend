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
  getPayTabsResultCodeError,
  getHyperpayResultCodeError,
} from "../../Utils";
import RecreateCheckoutButton from "../../shared-components/RecreateCheckoutButton";
import Currency from "../../../utils/currencyFormatter";
export default function PaymentResultTab({
  id,
  resourcePath,
}: {
  id: string;
  resourcePath?: string;
}) {
  const { t, i18n } = useTranslation("topupRequestsApp"),
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
    const key = `${user.id}/${id}/${resourcePath || ""}/${attempt}`;
    setBusy(true);
    setError(false);
    setPayment(undefined);
    if (!work.current.has(key))
      work.current.set(
        key,
        (async () => {
          const stored = await getPayment(id, false).unwrap();
          if (!ownsTopupRequest(user, stored)) throw new Error("owner");
          if (stored.status === topupRequestStatus.confirmed) return stored;
          const result = await check({
            id,
            ...(resourcePath ? { resourcePath } : {}),
          }).unwrap();
          if (
            !ownsTopupRequest(user, result) ||
            (result.id || result._id) !== id
          )
            throw new Error("owner");
          return result;
        })(),
      );
    work.current
      .get(key)
      .then((result) => {
        if (active) {
          setPayment(result);
          if (result.status === topupRequestStatus.confirmed)
            auth.getUser().catch(() => {});
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
  }, [id, resourcePath, user.id, user.role, attempt]);
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
  const message =
    payment.code || payment.responseStatus
      ? getPayTabsResultCodeError(
          payment.responseStatus,
          String(payment.code),
          payment.responseMessage,
          i18n.language,
        )
      : payment.reference
        ? getHyperpayResultCodeError(payment.reference, i18n.language)
        : "";
  return (
    <Paper
      variant="outlined"
      className="p-24 space-y-16 max-w-2xl mx-auto"
      data-testid="topup-result"
    >
      <Typography variant="h5">
        {t(
          payment.status === topupRequestStatus.confirmed
            ? "PAYMENT_DONE"
            : payment.status === topupRequestStatus.pending
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
        {t("AMOUNT")}: {Currency(payment.amount)}
      </Typography>
      <Typography>
        {t("TOTAL")}: {Currency(payment.total ?? payment.amount)}
      </Typography>
      {payment.status !== topupRequestStatus.confirmed && message && (
        <Alert severity="info">{message}</Alert>
      )}
      <RecreateCheckoutButton payment={payment} />
      <Button component={Link} to="/topup-requests/all">
        {t("GO_TO_TOPUP_REQUESTS")}
      </Button>
    </Paper>
  );
}
