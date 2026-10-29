import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Tab, Tabs } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  CheckoutApiResponse,
  useCreateTopupRequestMutation,
  useRecreateTopupCheckoutMutation,
} from "../TopupRequestsApi";
import {
  topupRequestSchema,
  TopupRequestForm,
} from "../models/TopupRequestSchema";
import TopupRequestModel from "../models/TopupRequestModel";
import { topupTotals } from "../Utils";
import TopupRequestHeader from "./TopupRequestHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
import PaymentResultTab from "./tabs/PaymentResultTab";
import CheckoutRedirectDialog from "../shared-components/CheckoutRedirectDialog";
export default function TopupRequest() {
  const { topupRequestId } = useParams(),
    user = useAppSelector(selectUser),
    { t } = useTranslation("topupRequestsApp"),
    mobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg")),
    isNew = topupRequestId === "new";
  const resourcePath = new URLSearchParams(useLocation().search).get(
    "resourcePath",
  );
  const methods = useForm<TopupRequestForm>({
    mode: "onChange",
    defaultValues: { amount: TopupRequestModel().amount },
    resolver: zodResolver(topupRequestSchema(t, user.id)),
  });
  const [create, state] = useCreateTopupRequestMutation(),
    [recreate, recreating] = useRecreateTopupCheckoutMutation(),
    [checkout, setCheckout] = useState<CheckoutApiResponse>(),
    [created, setCreated] = useState<CheckoutApiResponse>(),
    [error, setError] = useState<string>(),
    lock = useRef(false),
    sent = useRef(false),
    [tab, setTab] = useState(0);
  useEffect(() => {
    methods.reset({ amount: 0 });
    setCheckout(undefined);
    setCreated(undefined);
    setError(undefined);
    setTab(0);
    sent.current = false;
  }, [topupRequestId, user.id]);
  const save = methods.handleSubmit(async (values) => {
    if (!isNew || user.role !== "user" || lock.current || sent.current) return;
    lock.current = true;
    setError(undefined);
    try {
      const result = await create({
        ...topupTotals(values.amount),
        userId: user.id,
      }).unwrap();
      sent.current = true;
      const saved = { ...result, id: result.id || result._id };
      setCreated(saved);
      setCheckout(saved);
    } catch {
      setError(t("CREATE_ERROR"));
    } finally {
      lock.current = false;
    }
  });
  async function retryCheckout() {
    if (!created?.id || lock.current) return;
    lock.current = true;
    try {
      const result = await recreate(created.id).unwrap();
      const saved = { ...result, id: result.id || result._id || created.id };
      setCreated(saved);
      setCheckout(saved);
    } catch {
      setError(t("RECREATE_ERROR"));
    } finally {
      lock.current = false;
    }
  }
  if (user.role !== "user") return <Navigate to="/home" replace />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={<TopupRequestHeader />}
        content={
          <>
            <Tabs
              value={tab}
              onChange={(_, value) => setTab(value)}
              indicatorColor="secondary"
              textColor="secondary"
              classes={{ root: "w-full h-64 border-b-1" }}
            >
              <Tab label={t("BASIC_INFO")} />
            </Tabs>
            <div className="p-16 sm:p-24 max-w-6xl mx-auto w-full">
              {isNew ? (
                <>
                  {created && (
                    <Alert severity="info" className="mb-16">
                      {t("CHECKOUT_CREATED")}{" "}
                      <Button onClick={() => setCheckout(created)}>
                        {t("PROCEED_TO_PAYMENT")}
                      </Button>
                      <Button component={Link} to="/topup-requests/all">
                        {t("GO_TO_TOPUP_REQUESTS")}
                      </Button>
                    </Alert>
                  )}
                  <BasicInfoTab
                    disabled={state.isLoading || !!created}
                    error={error}
                    submit={
                      <LoadingButton
                        color="primary"
                        variant="contained"
                        fullWidth
                        loading={state.isLoading}
                        disabled={!!created}
                        onClick={() => save()}
                        data-testid="create-topup"
                      >
                        {t("CREATE_TRANSACTION_AND_PAY")}
                      </LoadingButton>
                    }
                  />
                  <CheckoutRedirectDialog
                    checkout={checkout}
                    onClose={() => setCheckout(undefined)}
                    onRetry={created?.id ? retryCheckout : undefined}
                    busy={recreating.isLoading}
                  />
                </>
              ) : (
                <PaymentResultTab
                  id={topupRequestId}
                  resourcePath={resourcePath}
                />
              )}
            </div>
          </>
        }
        scroll={mobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
