import { useEffect, useRef, useState } from "react";
import { Alert, Button, Tab, Tabs } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FusePageCarded from "@fuse/core/FusePageCarded";
import FuseLoading from "@fuse/core/FuseLoading";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  useGetStorageProductsQuery,
  useGetWarehousesQuery,
  useUpdateStorageProductMutation,
  type UpdateStorageProductArg,
} from "../StorageApi";
import StorageProductModel from "../models/StorageProductModel";
import { storageProductSchema } from "../models/StorageSchemas";
import StorageGate from "../shared/StorageGate";
import StorageHeader from "../shared/StorageHeader";
import { storageError } from "../Utils";
import BasicInfoTab from "./tabs/BasicInfoTab";
function ProductEditor() {
  const { productId } = useParams(),
    user = useAppSelector(selectUser),
    { t } = useTranslation("storageApp"),
    navigate = useNavigate();
  const query = useGetStorageProductsQuery(
    { userId: user.id, admin: true },
    { refetchOnMountOrArgChange: true },
  );
  const warehouses = useGetWarehousesQuery({ admin: true }),
    row = query.currentData?.find((p) => p.id === productId);
  const methods = useForm({
    defaultValues: StorageProductModel(),
    resolver: zodResolver(storageProductSchema(t)),
  });
  const initialized = useRef<string>(),
    [ready, setReady] = useState(""),
    [error, setError] = useState(""),
    [checking, setChecking] = useState(false),
    lock = useRef(false),
    [save, writing] = useUpdateStorageProductMutation();
  useEffect(() => {
    if (row && initialized.current !== productId) {
      methods.reset(StorageProductModel(row));
      initialized.current = productId;
      setReady(productId);
    }
  }, [row, productId, methods.reset]);
  const submit = methods.handleSubmit(async (values) => {
    if (user.role !== "admin" || lock.current || writing.isLoading) return;
    lock.current = true;
    setChecking(true);
    setError("");
    try {
      const fresh = await warehouses.refetch().unwrap();
      if (
        !fresh
          .find((w) => w.id === values.warehouseId)
          ?.storageTypes?.includes(values.storageType as never)
      )
        throw new Error(t("TYPE_NOT_ALLOWED"));
      const data: UpdateStorageProductArg = {
        ...values,
        name: values.name.trim(),
        sku: values.sku.trim(),
        storageType:
          values.storageType as UpdateStorageProductArg["storageType"],
      };
      await save({ id: productId, data }).unwrap();
      navigate("/storage/products", { replace: true });
    } catch (e) {
      setError(storageError(e, t("SAVE_ERROR")));
    } finally {
      lock.current = false;
      setChecking(false);
    }
  });
  if (query.isError)
    return (
      <Alert
        severity="error"
        action={<Button onClick={() => query.refetch()}>{t("RETRY")}</Button>}
      >
        {t("LOAD_ERROR")}
      </Alert>
    );
  if (!row && !query.isFetching && query.currentData)
    return <Navigate to="/storage/products" replace />;
  if (ready !== productId) return <FuseLoading />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={
          <StorageHeader
            title={t("EDIT_PRODUCT")}
            back="/storage/products"
            actions={
              <>
                <Button
                  color="primary"
                  variant="outlined"
                  component={Link}
                  to="/storage/products"
                  disabled={checking || writing.isLoading}
                >
                  {t("CANCEL")}
                </Button>
                <LoadingButton
                  color="primary"
                  variant="contained"
                  onClick={submit}
                  loading={checking || writing.isLoading}
                  disabled={warehouses.isFetching || warehouses.isError}
                >
                  {t("SAVE")}
                </LoadingButton>
              </>
            }
          />
        }
        content={
          <>
            <Tabs value={0}>
              <Tab label={t("BASIC_INFO")} />
            </Tabs>
            <div className="p-24 max-w-5xl space-y-20">
              {error && <Alert severity="error">{error}</Alert>}
              {warehouses.isError && (
                <Alert
                  severity="error"
                  action={
                    <Button onClick={() => warehouses.refetch()}>
                      {t("RETRY")}
                    </Button>
                  }
                >
                  {t("LOAD_ERROR")}
                </Alert>
              )}
              <BasicInfoTab
                disabled={checking || writing.isLoading}
                warehouses={warehouses.currentData || []}
              />
            </div>
          </>
        }
        scroll="normal"
      />
    </FormProvider>
  );
}
export default function StorageProduct() {
  return (
    <StorageGate adminOnly>
      <ProductEditor />
    </StorageGate>
  );
}
