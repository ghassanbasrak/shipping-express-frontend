import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import LanguageSwitcher from "app/theme-layouts/shared-components/LanguageSwitcher";
import { useLazyGetTopupRequestQuery } from "../topup-requests-app/TopupRequestsApi";
import { ownsTopupRequest } from "../topup-requests-app/Utils";
import {
  useGetCallbackPaymentStatusMutation,
  useUpdateCallbackPaymentMutation,
} from "./PaymentApi";
import {
  getMyFatoorahPaymentErrorCode,
  myFatoorahPaymentStatus,
  topupRequestStatus,
} from "./Utils";
export default function PaymentPage() {
  const { t } = useTranslation("paymentApp"),
    user = useAppSelector(selectUser),
    auth = useJwtAuth(),
    { userId, topupRequestId } = useParams(),
    paymentId = new URLSearchParams(useLocation().search).get("paymentId");
  const [getPayment] = useLazyGetTopupRequestQuery(),
    [getStatus] = useGetCallbackPaymentStatusMutation(),
    [update] = useUpdateCallbackPaymentMutation(),
    [attempt, setAttempt] = useState(0),
    [state, setState] = useState({
      busy: true,
      success: false,
      error: "",
      signOut: false,
      retry: false,
    }),
    work = useRef(
      new Map<string, Promise<{ success: boolean; error?: string }>>(),
    );
  useEffect(() => {
    let active = true;
    if (!topupRequestId || !userId || !paymentId) {
      setState({
        busy: false,
        success: false,
        error: "THE_PROVIDED_DATA_IS_INVALID",
        retry: false,
        signOut: false,
      });
      return;
    }
    if (userId !== user.id) {
      setState({
        busy: false,
        success: false,
        error: "THIS_ORDER_IS_RELATED_TO_ANOTHER_USER",
        retry: false,
        signOut: true,
      });
      return;
    }
    const key = `${user.id}/${topupRequestId}/${paymentId}/${attempt}`;
    setState({
      busy: true,
      success: false,
      error: "",
      retry: false,
      signOut: false,
    });
    if (!work.current.has(key))
      work.current.set(
        key,
        (async () => {
          const stored = await getPayment(topupRequestId, false).unwrap();
          if (!ownsTopupRequest(user, stored)) throw new Error("owner");
          const response = await getStatus(paymentId).unwrap(),
            data = response.Data;
          if (
            !data?.CustomerReference ||
            data.CustomerReference !== topupRequestId
          )
            throw new Error("reference");
          const paid = data.InvoiceStatus === myFatoorahPaymentStatus.paid,
            transactionId = paymentId,
            status = paid
              ? topupRequestStatus.confirmed
              : data.InvoiceStatus === myFatoorahPaymentStatus.pending
                ? topupRequestStatus.pending
                : topupRequestStatus.refused,
            reference = paid
              ? String(data.InvoiceId ?? "")
              : data.InvoiceTransactions?.[0]?.ErrorCode || "";
          // Never downgrade or reconfirm an already successful payment during callback replay.
          if (
            stored.status !== topupRequestStatus.confirmed &&
            (stored.status !== status ||
              stored.transactionId !== transactionId ||
              (stored.reference || "") !== reference)
          )
            await update({
              id: topupRequestId,
              transactionId,
              status: status as "pending" | "success" | "failed",
              reference,
            }).unwrap();
          return paid
            ? { success: true }
            : {
                success: false,
                error: getMyFatoorahPaymentErrorCode(
                  data.InvoiceTransactions?.[0]?.ErrorCode || "",
                ),
              };
        })(),
      );
    work.current
      .get(key)
      .then((result) => {
        if (active) {
          setState({
            busy: false,
            success: result.success,
            error: result.error || "",
            retry: !result.success,
            signOut: false,
          });
          if (result.success) auth.getUser().catch(() => {});
        }
      })
      .catch(() => {
        if (active)
          setState({
            busy: false,
            success: false,
            error: "SOMETHING_WENT_WRONG_WHEN_CONFIRM_PAYMENT",
            retry: true,
            signOut: false,
          });
      });
    return () => {
      active = false;
    };
  }, [user.id, user.role, userId, topupRequestId, paymentId, attempt]);
  if (user.role !== "user") return <Navigate to="/home" replace />;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-16 sm:p-32 gap-24 bg-gray-100 dark:bg-gray-900">
      <div className="absolute top-16 start-16">
        <LanguageSwitcher />
      </div>
      <Paper
        className="p-24 sm:p-48 max-w-xl w-full space-y-24 text-center"
        data-testid="payment-callback"
        data-status={
          state.busy ? "loading" : state.success ? "success" : "error"
        }
      >
        <img
          src="/assets/images/logo/logo-text.png"
          alt="Ashamco Express"
          className="h-64 max-w-full object-contain mx-auto"
        />
        {state.busy ? (
          <>
            <CircularProgress />
            <Typography>{t("LOADING")}</Typography>
          </>
        ) : (
          <>
            <Typography variant="h4">
              {t(state.success ? "PAYMENT_DONE" : "SOMETHING_WENT_WRONG")}
            </Typography>
            {state.error && <Alert severity="error">{t(state.error)}</Alert>}
            <div className="flex flex-wrap gap-8 justify-center">
              {state.retry && (
                <Button
                  onClick={() => setAttempt((value) => value + 1)}
                  data-testid="retry-callback"
                >
                  {t("RETRY")}
                </Button>
              )}
              {state.signOut && (
                <Button component={Link} to="/sign-out">
                  {t("SIGN_OUT")}
                </Button>
              )}
              <Button component={Link} to="/home">
                {t("GO_TO_HOME")}
              </Button>
              <Button component={Link} to="/topup-requests/all">
                {t("GO_TO_TOPUP_REQUESTS")}
              </Button>
            </div>
          </>
        )}
      </Paper>
    </div>
  );
}
