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
import {
  CheckoutApiResponse,
  useCreateTopupRequestMutation,
  useGetTopupRequestQuery,
} from "../TopupRequestsApi";
import { useCreateBankTransferMutation } from "../../bank-transfers-app/BankTransfersApi";
import {
  topupRequestSchema,
  TopupRequestForm,
} from "../models/TopupRequestSchema";
import { topupTotals, ownsTopupRequest } from "../Utils";
import TopupRequestHeader from "./TopupRequestHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
import PaymentResultTab from "./tabs/PaymentResultTab";
import MoyasarCheckout from "app/shared-components/moyasar-checkout/MoyasarCheckout";
import Currency from "../../utils/currencyFormatter";
export default function TopupRequest() {
  const { topupRequestId } = useParams(),
    user = useAppSelector(selectUser),
    { t } = useTranslation("topupRequestsApp"),
    [params] = useSearchParams(),
    navigate = useNavigate(),
    location = useLocation(),
    mobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg")),
    isNew = topupRequestId === "new";
  const methods = useForm<TopupRequestForm>({
    mode: "onChange",
    resolver: zodResolver(topupRequestSchema(t, user.id)),
    defaultValues: {
      amount: 0,
      method:
        params.get("method") === "bankTransfer" ? "bankTransfer" : "online",
      transactionReference: "",
      transactionImageUrl: "",
      description: "",
    },
  });
  const [create, creating] = useCreateTopupRequestMutation(),
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
        params.get("method") === "bankTransfer" ? "bankTransfer" : "online",
      transactionReference: "",
      transactionImageUrl: "",
      description: "",
    });
  }, [user.id, topupRequestId, location.key]);
  const paymentId = checkout?.payment?.id || checkout?.payment?._id;
  const stored = useGetTopupRequestQuery(paymentId, {
    skip: !paymentId || user.role !== "user",
    refetchOnMountOrArgChange: true,
  });
  const paymentReady =
    stored.currentData &&
    ownsTopupRequest(user, stored.currentData) &&
    !stored.currentData.storagePlanId &&
    (stored.currentData.id || stored.currentData._id) === paymentId;
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
      if (values.method === "bankTransfer") {
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
          amount: topupTotals(values.amount).amount,
        }).unwrap();
        if (currentLocation.current !== submittedLocation) return;
        setAccepted(true);
        const id = result.payment?.id || result.payment?._id;
        if (
          !id ||
          !ownsTopupRequest(user, result.payment) ||
          result.payment.storagePlanId ||
          !result.checkout
        )
          throw new Error("Invalid checkout");
        const currentCheckout = {
          ...result,
          payment: { ...result.payment, id },
        };
        setCheckout(currentCheckout);
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
        header={<TopupRequestHeader />}
        scroll={mobile ? "normal" : "content"}
        content={
          <div className="p-16 sm:p-24 max-w-6xl mx-auto w-full">
            {!isNew ? (
              <PaymentResultTab id={topupRequestId} />
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
                {stored.isError ? (
                  <Alert
                    severity="error"
                    action={
                      <Button onClick={() => stored.refetch()}>
                        {t("RETRY")}
                      </Button>
                    }
                  >
                    {t("NO_SUCH_TOPUP_REQUEST")}
                  </Alert>
                ) : !paymentReady || stored.isFetching ? (
                  <Typography role="status">{t("CHECKING_PAYMENT")}</Typography>
                ) : stored.currentData.status === "success" ? (
                  <Alert severity="success">{t("PAYMENT_DONE")}</Alert>
                ) : (
                  <MoyasarCheckout
                    checkout={checkout.checkout}
                    paymentId={paymentId}
                    testId="moyasar-wallet-form"
                    demoReturnPath="/wallet/payment-result"
                    onPaymentCreated={() => {}}
                  />
                )}
                <Button
                  variant="outlined"
                  onClick={() => {
                    setCheckout(undefined);
                    setAccepted(false);
                    methods.setValue("method", "bankTransfer");
                  }}
                >
                  {t("USE_BANK_INSTEAD")}
                </Button>
                <Button
                  component={Link}
                  variant="outlined"
                  to={`/topup-requests/all/${paymentId}`}
                >
                  {t("PAYMENT_STATUS")}
                </Button>
                <Button component={Link} to="/topup-requests/all">
                  {t("GO_TO_TOPUP_REQUESTS")}
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
                      data-testid="create-topup"
                    >
                      {t(
                        methods.watch("method") === "bankTransfer"
                          ? "SUBMIT_BANK_TRANSFER"
                          : "CONTINUE_MOYASAR",
                      )}
                    </LoadingButton>
                  }
                />
                <div className="flex gap-16 flex-wrap mt-24">
                  <Button component={Link} to="/topup-requests/all">
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
