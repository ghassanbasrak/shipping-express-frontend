import { useEffect, useRef, useState } from "react";
import { Alert, Button, Tab, Tabs, Typography } from "@mui/material";
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
  useCreateWarehouseMutation,
  useGetWarehousesQuery,
  useUpdateWarehouseMutation,
} from "../StorageApi";
import {
  canManageStorage,
  storageError,
  warehouseSaveValues,
  warehousePickupWasSaved,
} from "../Utils";
import WarehouseModel from "../models/WarehouseModel";
import { warehouseSchema } from "../models/StorageSchemas";
import StorageGate from "../shared/StorageGate";
import StorageHeader from "../shared/StorageHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
function WarehouseEditor() {
  const { warehouseId } = useParams(),
    isNew = warehouseId === "new",
    { t } = useTranslation("storageApp"),
    navigate = useNavigate(),
    user = useAppSelector(selectUser);
  const query = useGetWarehousesQuery(
    { admin: true },
    { skip: isNew, refetchOnMountOrArgChange: true },
  );
  const current = query.currentData?.find((row) => row.id === warehouseId);
  const methods = useForm({
    mode: "onChange" as const,
    defaultValues: WarehouseModel(),
    resolver: zodResolver(warehouseSchema(t)),
  });
  const saving = useRef(false);
  const savedId = useRef<string>();
  const initialized = useRef<string>(),
    [ready, setReady] = useState(""),
    [error, setError] = useState("");
  const [create, creating] = useCreateWarehouseMutation(),
    [update, updating] = useUpdateWarehouseMutation();
  const busy = creating.isLoading || updating.isLoading;
  const editable = canManageStorage(user, isNew ? "create" : "update");
  useEffect(() => {
    if (initialized.current === warehouseId || (!isNew && !current)) return;
    methods.reset(WarehouseModel(isNew ? undefined : current));
    savedId.current = undefined;
    initialized.current = warehouseId;
    setReady(warehouseId);
  }, [warehouseId, isNew, current, methods.reset]);
  if (isNew && !editable) return <Navigate to="/error/401" replace />;
  const save = methods.handleSubmit(async (values) => {
    if (!editable || busy || saving.current) return;
    saving.current = true;
    setError("");
    const data = warehouseSaveValues(values);
    try {
      const result = await (
        isNew && !savedId.current
          ? create(data)
          : update({ id: savedId.current || warehouseId, data })
      ).unwrap();
      if (!result.id) throw new Error(t("SAVE_ERROR"));
      savedId.current = result.id;
      if (!warehousePickupWasSaved(result, data))
        throw new Error(t("PICKUP_SAVE_UNSUPPORTED"));
      navigate("/storage/warehouses", { replace: true });
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
  if (!isNew && query.currentData && !current)
    return <Navigate to="/storage/warehouses" replace />;
  if (ready !== warehouseId) return <FuseLoading />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={
          <StorageHeader
            title={t(isNew ? "NEW_WAREHOUSE" : "WAREHOUSE_DETAILS")}
            back="/storage/warehouses"
            actions={
              <>
                <Button
                  component={Link}
                  to="/storage/warehouses"
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
                    data-testid="save-warehouse"
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
              {error && (
                <Alert severity="error">
                  {error}
                  {savedId.current && (
                    <Typography className="mt-8 text-13">
                      {t("SAVED_WAREHOUSE_REFERENCE")}: {savedId.current}
                    </Typography>
                  )}
                </Alert>
              )}
              <BasicInfoTab disabled={!editable || busy} />
            </div>
          </>
        }
        scroll="normal"
      />
    </FormProvider>
  );
}
export default function Warehouse() {
  return (
    <StorageGate adminOnly>
      <WarehouseEditor />
    </StorageGate>
  );
}
