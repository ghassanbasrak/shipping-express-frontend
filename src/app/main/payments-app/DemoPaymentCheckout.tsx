import { useState } from "react";
import {
  Alert,
  Button,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { isDemoMode } from "src/app/demo/demoMode";
import { useGetPaymentQuery } from "./PaymentsApi";
import {
  paymentMethodType,
  paymentType,
  toPaymentMethodTypeTitle,
  ownsPayment,
  type PaymentMethodType,
} from "./Utils";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import Currency from "../utils/currencyFormatter";

/** Local demo gateway only; this route is never registered in the live application. */
export default function DemoPaymentCheckout() {
  const { paymentId } = useParams(),
    user = useAppSelector(selectUser),
    { t } = useTranslation("paymentsApp");
  const query = useGetPaymentQuery(paymentId, {
    skip: !isDemoMode || !paymentId,
  });
  const [method, setMethod] = useState<PaymentMethodType>(
      paymentMethodType.visa,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  if (!isDemoMode) return <Navigate to="/home" replace />;
  const payment = query.currentData;
  if (!payment || !ownsPayment(user, payment))
    return (
      <Alert severity={query.isError ? "error" : "info"}>
        {t(query.isError ? "NO_SUCH_PAYMENT" : "CHECKING_PAYMENT")}
      </Alert>
    );
  const returnUrl =
    (payment.type === paymentType.storageSubscription
      ? "/storage/payment-result"
      : "/wallet/payment-result") +
    "?paymentId=" +
    encodeURIComponent(paymentId);
  return (
    <Paper
      className="p-24 m-16 max-w-2xl mx-auto space-y-20"
      variant="outlined"
    >
      <Typography className="text-24 font-semibold">
        {t("DEMO_HOSTED_TITLE")}
      </Typography>
      <Alert severity="info">{t("DEMO_HOSTED_HINT")}</Alert>
      <Typography>
        {t("TOTAL")}: {Currency(payment.total)}
      </Typography>
      <TextField
        select
        fullWidth
        disabled={busy}
        label={t("PAYMENT_METHOD")}
        value={method}
        onChange={(event) => setMethod(event.target.value as PaymentMethodType)}
      >
        {Object.values(paymentMethodType)
          .filter((value) => value !== paymentMethodType.free)
          .map((value) => (
            <MenuItem key={value} value={value}>
              {t(toPaymentMethodTypeTitle(value))}
            </MenuItem>
          ))}
      </TextField>
      {error && <Alert severity="error">{t("CREATE_ERROR")}</Alert>}
      <LoadingButton
        loading={busy}
        variant="contained"
        onClick={async () => {
          if (busy) return;
          setBusy(true);
          setError(false);
          try {
            await axios.post(
              "v1/payments/" + encodeURIComponent(paymentId) + "/demo-complete",
              { paymentMethodType: method },
            );
            window.location.assign(returnUrl);
          } catch {
            setError(true);
            setBusy(false);
          }
        }}
      >
        {t("DEMO_CONFIRM_PAYMENT")}
      </LoadingButton>
      <Button disabled={busy} onClick={() => window.location.assign(returnUrl)}>
        {t("DEMO_RETURN_PENDING")}
      </Button>
    </Paper>
  );
}
