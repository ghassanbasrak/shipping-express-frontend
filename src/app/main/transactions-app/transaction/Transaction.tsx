import { useEffect, useRef, useState } from "react";
import { Alert, Button, Tab, Tabs } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FusePageCarded from "@fuse/core/FusePageCarded";
import FuseLoading from "@fuse/core/FuseLoading";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  useGetTransactionQuery,
  useGetTransactionsAccountQuery,
} from "../TransactionsApi";
import {
  availableTransactionBalances,
  canManageTransaction,
  canUseTransactionBalance,
} from "../Utils";
import ITransaction from "../models/ITransaction";
import TransactionModel from "../models/TransactionModel";
import { transactionSchema } from "../models/TransactionSchema";
import TransactionHeader from "./TransactionHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
export default function Transaction() {
  const { t } = useTranslation("transactionsApp"),
    user = useAppSelector(selectUser),
    { userId = "all", relatedBalance = "all", transactionId } = useParams(),
    isNew = transactionId === "new";
  const key = `${transactionId}/${userId}/${relatedBalance}`;
  const balances = availableTransactionBalances(
    user,
    isNew ? "create" : "view",
  );
  const permitted =
    ["admin", "employee"].includes(user?.role) && balances.length > 0;
  const methods = useForm<ITransaction>({
    mode: "onChange",
    defaultValues: TransactionModel(),
    resolver: zodResolver(transactionSchema(t)),
  });
  const record = useGetTransactionQuery(transactionId, {
    skip: isNew || !transactionId || !permitted,
    refetchOnMountOrArgChange: true,
  });
  const [ready, setReady] = useState<string>(),
    initialized = useRef<string>();
  useEffect(() => {
    if (initialized.current === key || (!isNew && !record.currentData)) return;
    methods.reset(
      TransactionModel(
        isNew
          ? {
              userId: userId === "all" ? "" : userId,
              relatedBalance: balances.includes(relatedBalance as "wallet")
                ? relatedBalance
                : balances[0],
            }
          : record.currentData,
      ),
    );
    initialized.current = key;
    setReady(key);
  }, [key, isNew, record.currentData, methods.reset, balances.join(",")]);
  const values = methods.watch(),
    selected = useGetTransactionsAccountQuery(values.userId, {
      skip: !permitted || ready !== key || !values.userId,
      refetchOnMountOrArgChange: true,
    });
  useEffect(() => {
    if (selected.currentData?.id === methods.getValues("userId"))
      methods.setValue("user", structuredClone(selected.currentData));
  }, [selected.currentData, methods.setValue, methods.getValues]);
  const actualAllowed =
    isNew ||
    !record.currentData ||
    canUseTransactionBalance(user, record.currentData.relatedBalance, "view");
  const originalCanEdit =
    isNew ||
    !record.currentData ||
    canManageTransaction(user, record.currentData.relatedBalance, true);
  const canEdit =
    originalCanEdit &&
    canManageTransaction(user, values.relatedBalance, !isNew);
  const editableBalances = originalCanEdit
    ? availableTransactionBalances(user, isNew ? "create" : "update")
    : [];
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  if (!permitted || !actualAllowed) return <Navigate to="/home" replace />;
  if (record.isError && !isNew)
    return (
      <div className="p-24 space-y-16">
        <Alert severity="error">
          {t(
            (record.error as { status?: number })?.status === 404
              ? "NO_SUCH_TRANSACTION"
              : "LOAD_ERROR",
          )}
        </Alert>
        <Button
          color="primary"
          variant="outlined"
          onClick={() => record.refetch()}
        >
          {t("RETRY")}
        </Button>
      </div>
    );
  if (ready !== key) return <FuseLoading />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={
          <TransactionHeader
            canEdit={canEdit}
            isNew={isNew}
            accountReady={
              !!selected.currentData &&
              selected.currentData.id === values.userId &&
              !selected.isFetching &&
              !selected.isError
            }
          />
        }
        content={
          <>
            <Tabs
              value={0}
              indicatorColor="secondary"
              textColor="secondary"
              variant="scrollable"
              scrollButtons="auto"
              classes={{ root: "w-full h-64 border-b-1" }}
            >
              <Tab className="h-64" label={t("BASIC_INFO")} />
            </Tabs>
            <div className="w-full min-w-0 p-16 sm:p-24 max-w-6xl space-y-16">
              {selected.isError && (
                <Alert
                  severity="error"
                  action={
                    <Button onClick={() => selected.refetch()}>
                      {t("RETRY")}
                    </Button>
                  }
                >
                  {t("USER_LOOKUP_ERROR")}
                </Alert>
              )}
              <BasicInfoTab
                disabled={!canEdit}
                balances={editableBalances}
                account={selected.currentData}
              />
            </div>
          </>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
