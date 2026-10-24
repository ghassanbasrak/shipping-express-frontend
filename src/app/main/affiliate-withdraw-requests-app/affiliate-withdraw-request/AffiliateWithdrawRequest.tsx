import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link, Navigate, useParams } from "react-router-dom";
import { Alert, Button, Tab, Tabs } from "@mui/material";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import FusePageCarded from "@fuse/core/FusePageCarded";
import FuseLoading from "@fuse/core/FuseLoading";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  useGetAffiliateWithdrawRequestQuery,
  useGetAffiliateWithdrawBalanceQuery,
  useGetAffiliateWithdrawRequestsQuery,
} from "../AffiliateWithdrawRequestsApi";
import AffiliateWithdrawRequestModel from "../models/AffiliateWithdrawRequestModel";
import {
  affiliateWithdrawRequestSchema,
  AffiliateWithdrawRequestForm,
} from "../models/AffiliateWithdrawRequestSchema";
import { affiliateWithdrawRequestTypes } from "../Utils";
import AffiliateWithdrawRequestHeader from "./AffiliateWithdrawRequestHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
export default function AffiliateWithdrawRequest() {
  const { affiliateWithdrawRequestId } = useParams(),
    user = useAppSelector(selectUser),
    { t } = useTranslation("affiliateWithdrawRequestsApp");
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg")),
    isNew = affiliateWithdrawRequestId === "new",
    permitted = user.role === "user" && Boolean(user.isAffiliate);
  const {
    currentData: request,
    isError,
    refetch,
  } = useGetAffiliateWithdrawRequestQuery(affiliateWithdrawRequestId, {
    skip: isNew || !affiliateWithdrawRequestId || !permitted,
    refetchOnMountOrArgChange: true,
  });
  const balance = useGetAffiliateWithdrawBalanceQuery(user.id, {
    skip: !permitted,
    refetchOnMountOrArgChange: true,
  });
  const pending = useGetAffiliateWithdrawRequestsQuery(
    { page: 0, pageSize: 1, statusFilter: "pending" },
    { skip: !isNew || !permitted, refetchOnMountOrArgChange: true },
  );
  const methods = useForm<AffiliateWithdrawRequestForm>({
    mode: "onChange",
    defaultValues: { ...AffiliateWithdrawRequestModel(), availableBalance: 0 },
    resolver: zodResolver(affiliateWithdrawRequestSchema(t)),
  });
  const initialized = useRef<string>(),
    [ready, setReady] = useState<string>(),
    [tabValue, setTabValue] = useState(0);
  const owned =
    request?.type === affiliateWithdrawRequestTypes.affiliateWithdraw &&
    (request.userId === user.id || request.user?.id === user.id);
  useEffect(() => {
    if (
      initialized.current === affiliateWithdrawRequestId ||
      (!isNew && (!request || !owned))
    )
      return;
    methods.reset({
      ...AffiliateWithdrawRequestModel(isNew ? { userId: user.id } : request),
      availableBalance: balance.currentData?.balance ?? 0,
    });
    initialized.current = affiliateWithdrawRequestId;
    setReady(affiliateWithdrawRequestId);
    setTabValue(0);
  }, [
    affiliateWithdrawRequestId,
    isNew,
    request,
    owned,
    methods.reset,
    user.id,
  ]);
  useEffect(() => {
    if (balance.currentData)
      methods.setValue("availableBalance", balance.currentData.balance, {
        shouldValidate: isNew,
      });
  }, [balance.currentData, methods.setValue, isNew]);
  if (!permitted) return <Navigate to="/home" replace />;
  if (isError || (!isNew && request && !owned))
    return (
      <div className="flex flex-col items-center justify-center h-full gap-16">
        <Alert severity="error">{t("NO_SUCH_WITHDRAW_REQUEST")}</Alert>
        {isError && <Button onClick={() => refetch()}>{t("RETRY")}</Button>}
        <Button component={Link} to="/affiliate-withdraw-requests/all">
          {t("GO_TO_WITHDRAW_REQUESTS")}
        </Button>
      </div>
    );
  if (ready !== affiliateWithdrawRequestId) return <FuseLoading />;
  const blocked =
    balance.isFetching ||
    balance.isError ||
    !balance.currentData ||
    pending.isFetching ||
    pending.isError ||
    !pending.currentData ||
    pending.currentData.total > 0;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={
          <AffiliateWithdrawRequestHeader
            blocked={blocked}
            balance={balance.currentData?.balance}
          />
        }
        content={
          <>
            <Tabs
              value={tabValue}
              onChange={(_, value) => setTabValue(value)}
              indicatorColor="secondary"
              textColor="secondary"
              variant="scrollable"
              scrollButtons="auto"
              classes={{ root: "w-full h-64 border-b-1" }}
            >
              <Tab className="h-64" label={t("BASIC_INFO")} />
            </Tabs>
            <div className="p-16 sm:p-24 max-w-3xl mx-auto w-full space-y-16">
              {balance.isError && (
                <Alert
                  severity="error"
                  action={
                    <Button onClick={() => balance.refetch()}>
                      {t("RETRY")}
                    </Button>
                  }
                >
                  {t("BALANCE_LOAD_ERROR")}
                </Alert>
              )}
              {isNew && pending.isError && (
                <Alert
                  severity="error"
                  action={
                    <Button onClick={() => pending.refetch()}>
                      {t("RETRY")}
                    </Button>
                  }
                >
                  {t("PENDING_LOAD_ERROR")}
                </Alert>
              )}
              {isNew && pending.currentData?.total > 0 && (
                <Alert severity="info">{t("PENDING_REQUEST_EXISTS")}</Alert>
              )}
              {!isNew && (
                <Alert severity="info">{t("READ_ONLY_REQUEST")}</Alert>
              )}
              <BasicInfoTab disabled={!isNew} />
            </div>
          </>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
