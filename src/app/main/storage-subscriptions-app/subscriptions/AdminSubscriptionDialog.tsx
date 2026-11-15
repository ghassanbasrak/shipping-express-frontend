import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { useCreateAdminStorageSubscriptionMutation } from "../StorageSubscriptionsApi";
import { useGetStoragePlansQuery } from "../../storage-app/StorageApi";
import {
  storageSubscriptionOperation,
  storageSubscriptionStatus,
  toStorageSubscriptionOperationTitle,
} from "../Utils";
import { storageError } from "../../storage-app/Utils";
import StorageField from "../../storage-app/shared/StorageField";
import StorageMerchantField from "../../storage-app/shared/StorageMerchantField";
import StorageSubscriptionModel from "../models/StorageSubscriptionModel";
import { storageSubscriptionSchema } from "../models/StorageSubscriptionSchema";
import type { AdminStorageSubscriptionArg } from "../StorageSubscriptionsApi";
export default function AdminSubscriptionDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  const { t } = useTranslation("storageApp"),
    user = useAppSelector(selectUser),
    lock = useRef(false),
    accepted = useRef(false),
    [error, setError] = useState(""),
    [checking, setChecking] = useState(false);
  const plans = useGetStoragePlansQuery({ admin: true }),
    [create, writing] = useCreateAdminStorageSubscriptionMutation();
  const methods = useForm({
    defaultValues: StorageSubscriptionModel(),
    resolver: zodResolver(storageSubscriptionSchema()),
  });
  const submit = methods.handleSubmit(async (values) => {
    if (user.role !== "admin" || lock.current || accepted.current) return;
    lock.current = true;
    setChecking(true);
    setError("");
    let posted = false;
    try {
      const fresh = await plans.refetch().unwrap();
      if (!fresh.some((p) => p.id === values.planId && p.isActive))
        throw new Error(t("PLAN_UNAVAILABLE"));
      posted = true;
      const result = await create(
        values as AdminStorageSubscriptionArg,
      ).unwrap();
      accepted.current = true;
      if (
        result.userId !== values.userId ||
        result.planId !== values.planId ||
        result.status !== storageSubscriptionStatus.active
      )
        throw new Error(t("SUBSCRIPTION_REFRESH"));
      onClose();
    } catch (e) {
      if (
        posted &&
        ((e as { status?: string | number }).status === "NETWORK_ERROR" ||
          Number((e as { status?: number }).status) >= 500)
      )
        accepted.current = true;
      setError(storageError(e, t("SAVE_ERROR")));
    } finally {
      lock.current = false;
      setChecking(false);
    }
  });
  return (
    <Dialog
      open
      fullWidth
      maxWidth="sm"
      onClose={() => {
        if (!lock.current) onClose();
      }}
    >
      <FormProvider {...methods}>
        <DialogTitle>{t("CREATE_SUBSCRIPTION")}</DialogTitle>
        <DialogContent className="space-y-20 pt-12">
          <Alert severity="info">{t("ADMIN_SUBSCRIPTION_HINT")}</Alert>
          {error && (
            <Alert severity="error">
              {error}
              {accepted.current && (
                <Typography>{t("CHECK_SUBSCRIPTION_HISTORY")}</Typography>
              )}
            </Alert>
          )}
          {plans.isError && (
            <Alert
              severity="error"
              action={
                <Button onClick={() => plans.refetch()}>{t("RETRY")}</Button>
              }
            >
              {t("LOAD_ERROR")}
            </Alert>
          )}
          <StorageMerchantField
            disabled={checking || writing.isLoading || accepted.current}
          />
          <StorageField
            name="operation"
            label={t("OPERATION")}
            disabled={checking || writing.isLoading || accepted.current}
          >
            {Object.values(storageSubscriptionOperation).map((v) => (
              <MenuItem key={v} value={v}>
                {t(toStorageSubscriptionOperationTitle(v))}
              </MenuItem>
            ))}
          </StorageField>
          <StorageField
            name="planId"
            label={t("PLAN")}
            disabled={checking || writing.isLoading || accepted.current}
            required
          >
            {(plans.currentData || [])
              .filter((p) => p.isActive)
              .map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
          </StorageField>
        </DialogContent>
        <DialogActions>
          <Button
            disabled={checking || writing.isLoading}
            onClick={() => {
              if (!lock.current) onClose();
            }}
          >
            {t("CANCEL")}
          </Button>
          <LoadingButton
            color="primary"
            variant="contained"
            loading={checking || writing.isLoading}
            disabled={plans.isError || plans.isFetching || accepted.current}
            onClick={submit}
          >
            {t("ACTIVATE_SUBSCRIPTION")}
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}
