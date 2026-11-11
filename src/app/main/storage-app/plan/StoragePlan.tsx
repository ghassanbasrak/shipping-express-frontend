import { useEffect, useRef, useState } from "react";
import { Alert, Button, Tab, Tabs } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FusePageCarded from "@fuse/core/FusePageCarded";
import FuseLoading from "@fuse/core/FuseLoading";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  useCreateStoragePlanMutation,
  useGetStoragePlanQuery,
  useUpdateStoragePlanMutation,
} from "../StorageApi";
import {
  canManageStorage,
  storageError,
  storagePlanSaveValues,
} from "../Utils";
import StoragePlanModel from "../models/StoragePlanModel";
import { storagePlanSchema } from "../models/StorageSchemas";
import StorageGate from "../shared/StorageGate";
import StorageHeader from "../shared/StorageHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
function StoragePlanEditor() {
  const { planId } = useParams(),
    isNew = planId === "new",
    { t } = useTranslation("storageApp"),
    navigate = useNavigate(),
    user = useAppSelector(selectUser);
  const query = useGetStoragePlanQuery(planId, {
    skip: isNew,
    refetchOnMountOrArgChange: true,
  });
  const methods = useForm({
    mode: "onChange" as const,
    defaultValues: StoragePlanModel(),
    resolver: zodResolver(storagePlanSchema(t)),
  });
  const saving = useRef(false);
  const initialized = useRef<string>(),
    [ready, setReady] = useState(""),
    [error, setError] = useState("");
  const [create, creating] = useCreateStoragePlanMutation(),
    [update, updating] = useUpdateStoragePlanMutation(),
    busy = creating.isLoading || updating.isLoading;
  const editable = canManageStorage(user, isNew ? "create" : "update");
  useEffect(() => {
    if (initialized.current === planId || (!isNew && !query.currentData))
      return;
    methods.reset(StoragePlanModel(isNew ? undefined : query.currentData));
    initialized.current = planId;
    setReady(planId);
  }, [planId, isNew, query.currentData, methods.reset]);
  if (isNew && !editable) return <Navigate to="/error/401" replace />;
  const save = methods.handleSubmit(async (values) => {
    if (!editable || busy || saving.current) return;
    saving.current = true;
    setError("");
    const data = storagePlanSaveValues(values);
    try {
      await (isNew ? create(data) : update({ id: planId, data })).unwrap();
      navigate("/storage/plans", { replace: true });
    } catch (e) {
      setError(storageError(e, t("SAVE_ERROR")));
    } finally {
      saving.current = false;
    }
  });
  if (query.isError)
    return (
      <div className="p-24">
        <Alert
          severity="error"
          action={<Button onClick={() => query.refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      </div>
    );
  if (ready !== planId) return <FuseLoading />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={
          <StorageHeader
            title={t(isNew ? "NEW_PLAN" : "PLAN_DETAILS")}
            back="/storage/plans"
            actions={
              <>
                <Button
                  component={Link}
                  to="/storage/plans"
                  color="primary"
                  variant="outlined"
                  disabled={busy}
                >
                  {t("CANCEL")}
                </Button>
                {editable && (
                  <LoadingButton
                    color="primary"
                    variant="contained"
                    loading={busy}
                    onClick={save}
                    data-testid="save-storage-plan"
                  >
                    {t("SAVE")}
                  </LoadingButton>
                )}
              </>
            }
          />
        }
        content={
          <>
            <Tabs value={0}>
              <Tab label={t("BASIC_INFO")} />
            </Tabs>
            <div className="p-16 sm:p-24 max-w-4xl space-y-16">
              {error && <Alert severity="error">{error}</Alert>}
              <BasicInfoTab disabled={!editable || busy} />
            </div>
          </>
        }
        scroll="normal"
      />
    </FormProvider>
  );
}
export default function StoragePlan() {
  return (
    <StorageGate adminOnly>
      <StoragePlanEditor />
    </StorageGate>
  );
}
