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
  useGetWithdrawRequestQuery,
  useGetWithdrawBalanceQuery,
} from "../WithdrawRequestsApi";
import WithdrawRequestModel from "../models/WithdrawRequestModel";
import {
  withdrawRequestSchema,
  WithdrawRequestForm,
} from "../models/WithdrawRequestSchema";
import { withdrawRequestTypes } from "../Utils";
import WithdrawRequestHeader from "./WithdrawRequestHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
export default function WithdrawRequest() {
  const { withdrawRequestId } = useParams(),
    user = useAppSelector(selectUser),
    { t } = useTranslation("withdrawRequestsApp");
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg")),
    isNew = withdrawRequestId === "new",
    permitted = user.role === "user";
  const {
    currentData: request,
    isError,
    isFetching,
    refetch,
  } = useGetWithdrawRequestQuery(withdrawRequestId, {
    skip: isNew || !withdrawRequestId || !permitted,
    refetchOnMountOrArgChange: true,
  });
  const balance = useGetWithdrawBalanceQuery(user.id, {
    skip: !permitted,
    refetchOnMountOrArgChange: true,
  });

  const methods = useForm<WithdrawRequestForm>({
    mode: "onChange",
    defaultValues: { ...WithdrawRequestModel(), availableBalance: 0 },
    resolver: zodResolver(withdrawRequestSchema(t)),
  });
  const initialized = useRef<string>(),
    [ready, setReady] = useState<string>(),
    [tabValue, setTabValue] = useState(0);
  const owned =
    Object.values(withdrawRequestTypes).includes(
      request?.type as "withdrew" | "walletCharge",
    ) &&
    (request.userId === user.id || request.user?.id === user.id);
  useEffect(() => {
    if (
      initialized.current === withdrawRequestId ||
      (!isNew && (!request || !owned))
    )
      return;
    methods.reset({
      ...WithdrawRequestModel(isNew ? { userId: user.id } : request),
      availableBalance: balance.currentData?.amount ?? 0,
    });
    initialized.current = withdrawRequestId;
    setReady(withdrawRequestId);
    setTabValue(0);
  }, [withdrawRequestId, isNew, request, owned, methods.reset, user.id]);
  useEffect(() => {
    if (balance.currentData)
      methods.setValue("availableBalance", balance.currentData.amount, {
        shouldValidate: isNew,
      });
  }, [balance.currentData, methods.setValue, isNew]);
  if (!permitted) return <Navigate to="/home" replace />;
  if (
    isError ||
    (!isNew && !request && !isFetching) ||
    (!isNew && request && !owned)
  )
    return (
      <div className="flex flex-col items-center justify-center h-full gap-16">
        <Alert severity="error">{t("NO_SUCH_WITHDRAW_REQUEST")}</Alert>
        {isError && (
          <Button color="primary" variant="outlined" onClick={() => refetch()}>
            {t("RETRY")}
          </Button>
        )}
        <Button
          color="primary"
          variant="outlined"
          component={Link}
          to="/withdraw-requests/all"
        >
          {t("GO_TO_WITHDRAW_REQUESTS")}
        </Button>
      </div>
    );
  if (ready !== withdrawRequestId) return <FuseLoading />;
  const blocked = balance.isFetching || balance.isError || !balance.currentData;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={
          <WithdrawRequestHeader
            blocked={blocked}
            balance={balance.currentData?.amount}
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
