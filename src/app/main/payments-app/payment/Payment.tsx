import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Paper, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  Link,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { CheckoutApiResponse, useCreatePaymentMutation } from "../PaymentsApi";
import { useCreateBankTransferMutation } from "../../bank-transfers-app/BankTransfersApi";
import { paymentSchema, PaymentForm } from "../models/PaymentSchema";
import {
  paymentTotals,
  ownsPayment,
  paymentType,
  getHostedCheckoutUrl,
  paymentFundingMethod,
} from "../Utils";
import { isDemoMode } from "src/app/demo/demoMode";
import PaymentHeader from "./PaymentHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
import PaymentResultTab from "./tabs/PaymentResultTab";
import Currency from "../../utils/currencyFormatter";
export default function Payment() {
  const { paymentId: routePaymentId } = useParams(),
    user = useAppSelector(selectUser),
    { t } = useTranslation("paymentsApp"),
    [params] = useSearchParams(),
    navigate = useNavigate(),
    location = useLocation(),
    mobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg")),
    isNew = routePaymentId === "new";
  const methods = useForm<PaymentForm>({
    mode: "onChange",
    resolver: zodResolver(paymentSchema(t, user.id)),
    defaultValues: {
      amount: 0,
      method:
        params.get("method") === paymentFundingMethod.bankTransfer
          ? paymentFundingMethod.bankTransfer
          : paymentFundingMethod.online,
      transactionReference: "",
      transactionImageUrl: "",
      description: "",
    },
  });
  const [create, creating] = useCreatePaymentMutation(),
    [createBank, banking] = useCreateBankTransferMutation(),
    [checkout, setCheckout] = useState<CheckoutApiResponse>(),
    [error, setError] = useState(""),
    [accepted, setAccepted] = useState(false),
    [uploading, setUploading] = useState(false),
    lock = useRef(false),
    currentLocation = useRef(location.key);
  currentLocation.current = location.key;
  useEffect(() => {
    setCheckout(undefined);
    setAccepted(false);
    setError("");
    methods.reset({
      amount: 0,
      method:
        params.get("method") === paymentFundingMethod.bankTransfer
          ? paymentFundingMethod.bankTransfer
          : paymentFundingMethod.online,
      transactionReference: "",
      transactionImageUrl: "",
      description: "",
    });
  }, [user.id, routePaymentId, location.key]);
  const paymentId = checkout?.payment?.id || checkout?.payment?._id;
  const busy = creating.isLoading || banking.isLoading || uploading;
  const submit = methods.handleSubmit(async (values) => {
    if (
      !isNew ||
      user.role !== "user" ||
      lock.current ||
      accepted ||
      checkout ||
      uploading
    )
      return;
    lock.current = true;
    const submittedLocation = location.key;
    setError("");
    try {
      if (values.method === paymentFundingMethod.bankTransfer) {
        await createBank({
          amount: values.amount,
          transactionReference: values.transactionReference,
          transactionImageUrl: values.transactionImageUrl,
          description: values.description,
        }).unwrap();
        if (currentLocation.current !== submittedLocation) return;
        setAccepted(true);
        navigate("/bank-transfers/all");
      } else {
        const result = await create({
          amount: paymentTotals(values.amount).amount,
        }).unwrap();
        if (currentLocation.current !== submittedLocation) return;
        setAccepted(true);
        const id = result.payment?.id || result.payment?._id;
        if (
          !id ||
          !ownsPayment(user, result.payment) ||
          result.payment.type !== paymentType.topup
        )
          throw new Error("Invalid checkout");
        const currentCheckout = {
          ...result,
          payment: { ...result.payment, id },
        };
        setCheckout(currentCheckout);
        const url = getHostedCheckoutUrl(
          result.checkoutUrl,
          isDemoMode ? window.location.origin : undefined,
        );
        if (!url) {
          setError(t("HOSTED_CHECKOUT_UNAVAILABLE"));
          return;
        }
        window.location.assign(url);
      }
    } catch {
      if (currentLocation.current === submittedLocation)
        setError(t("CREATE_ERROR"));
    } finally {
      lock.current = false;
    }
  });
  if (user.role !== "user") return <Navigate to="/home" replace />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={<PaymentHeader />}
        scroll={mobile ? "normal" : "content"}
        content={
          <div className="p-16 sm:p-24 max-w-6xl mx-auto w-full">
            {!isNew ? (
              <PaymentResultTab id={routePaymentId} />
            ) : checkout ? (
              <Paper
                variant="outlined"
                className="p-24 rounded-16 max-w-2xl mx-auto space-y-20"
              >
                <Typography className="text-24 font-semibold">
                  {t("MOYASAR_CHECKOUT")}
                </Typography>
                <Typography color="text.secondary">
                  {t("SERVER_TOTAL_HINT")}
                </Typography>
                <div className="space-y-8">
                  {[
                    ["TOPUP_AMOUNT", checkout.payment.amount],
                    ["TAX", checkout.payment.taxTotal],
                    ["TOTAL", checkout.payment.total],
                  ].map(([label, value]) => (
                    <div className="flex justify-between gap-16" key={label}>
                      <span>{t(String(label))}</span>
                      <strong>{Currency(Number(value))}</strong>
                    </div>
                  ))}
                </div>
                {error ? (
                  <Alert severity="error">{error}</Alert>
                ) : (
                  <Typography role="status">
                    {t("REDIRECTING_PAYMENT")}
                  </Typography>
                )}
                {getHostedCheckoutUrl(
                  checkout.checkoutUrl,
                  isDemoMode ? window.location.origin : undefined,
                ) && (
                  <Button
                    variant="contained"
                    onClick={() =>
                      window.location.assign(
                        getHostedCheckoutUrl(
                          checkout.checkoutUrl,
                          isDemoMode ? window.location.origin : undefined,
                        ),
                      )
                    }
                  >
                    {t("CONTINUE_MOYASAR")}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={() => {
                    setCheckout(undefined);
                    setAccepted(false);
                    methods.setValue(
                      "method",
                      paymentFundingMethod.bankTransfer,
                    );
                  }}
                >
                  {t("USE_BANK_INSTEAD")}
                </Button>
                <Button
                  component={Link}
                  variant="outlined"
                  to={`/payments/all/${paymentId}`}
                >
                  {t("PAYMENT_STATUS")}
                </Button>
                <Button component={Link} to="/payments/all">
                  {t("GO_TO_PAYMENTS")}
                </Button>
              </Paper>
            ) : (
              <>
                {accepted && (
                  <Alert severity="warning" className="mb-16">
                    {t("ACCEPTED_CHECK_HISTORY")}
                  </Alert>
                )}
                <BasicInfoTab
                  disabled={busy || accepted}
                  error={error}
                  onUploadBusy={setUploading}
                  submit={
                    <LoadingButton
                      fullWidth
                      variant="contained"
                      color="primary"
                      loading={busy}
                      disabled={accepted}
                      onClick={() => submit()}
                      data-testid="create-payment"
                    >
                      {t(
                        methods.watch("method") ===
                          paymentFundingMethod.bankTransfer
                          ? "SUBMIT_BANK_TRANSFER"
                          : "CONTINUE_MOYASAR",
                      )}
                    </LoadingButton>
                  }
                />
                <div className="flex gap-16 flex-wrap mt-24">
                  <Button component={Link} to="/payments/all">
                    {t("ONLINE_HISTORY")}
                  </Button>
                  <Button component={Link} to="/bank-transfers/all">
                    {t("BANK_HISTORY")}
                  </Button>
                </div>
              </>
            )}
          </div>
        }
      />
    </FormProvider>
  );
}
