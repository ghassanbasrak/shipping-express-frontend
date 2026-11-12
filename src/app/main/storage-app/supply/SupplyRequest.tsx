import { useMemo, useRef, useState } from "react";
import { Alert, Button, Tab, Tabs } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FusePageCarded from "@fuse/core/FusePageCarded";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  useCreateSupplyRequestMutation,
  useGetWarehousesQuery,
  useGetStorageProductsQuery,
} from "../StorageApi";
import { useGetStorageSubscriptionQuery } from "../../storage-subscriptions-app/StorageSubscriptionsApi";
import {
  hasActiveStorageSubscription,
  storageError,
  supplySaveValues,
  supportedStorageTypes,
  supplyProductMode,
} from "../Utils";
import SupplyRequestModel from "../models/SupplyRequestModel";
import { supplyRequestSchema } from "../models/StorageSchemas";
import StorageGate from "../shared/StorageGate";
import StorageHeader from "../shared/StorageHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
import SupplyRequestView from "./SupplyRequestView";
function NewSupplyRequest() {
  const user = useAppSelector(selectUser),
    { t } = useTranslation("storageApp"),
    navigate = useNavigate();
  const [warehouseId, setWarehouseId] = useState(""),
    [error, setError] = useState(""),
    [checking, setChecking] = useState(false),
    submitted = useRef(false),
    busy = useRef(false);
  const subscription = useGetStorageSubscriptionQuery(user.id),
    warehouse = useGetWarehousesQuery({}, { refetchOnMountOrArgChange: true });
  const currentWarehouse = warehouse.currentData?.find(
    (row) => row.id === warehouseId,
  );
  const types = subscription.currentData?.plan?.storageTypes || [];
  const allowed = supportedStorageTypes(
    subscription.currentData?.plan,
    currentWarehouse,
  );
  const inventory = useGetStorageProductsQuery(
    { warehouseId, userId: user.id, includeEmpty: true },
    { skip: !warehouseId, refetchOnMountOrArgChange: true },
  );
  const schema = useMemo(() => supplyRequestSchema(t, allowed), [t, allowed]);
  const methods = useForm({
    mode: "onChange" as const,
    defaultValues: SupplyRequestModel(),
    resolver: zodResolver(schema),
  });
  const [create, creating] = useCreateSupplyRequestMutation(),
    unavailable =
      warehouse.isError ||
      warehouse.isFetching ||
      subscription.isError ||
      subscription.isFetching ||
      inventory.isFetching ||
      inventory.isError;
  const save = methods.handleSubmit(async (values) => {
    if (busy.current || submitted.current || unavailable) return;
    busy.current = true;
    setChecking(true);
    setError("");
    let posted = false;
    try {
      const [currentSubscription, warehouses] = await Promise.all([
        subscription.refetch().unwrap(),
        warehouse.refetch().unwrap(),
      ]);
      if (
        !hasActiveStorageSubscription(currentSubscription, user.id) ||
        !warehouses.some((row) => row.id === values.warehouseId)
      )
        throw new Error(t("SUBSCRIPTION_REQUIRED"));
      const validated = supplyRequestSchema(
        t,
        supportedStorageTypes(
          currentSubscription.plan,
          warehouses.find((row) => row.id === values.warehouseId),
        ),
      ).safeParse(values);
      if (validated.success === false) {
        validated.error.issues.forEach((issue) =>
          methods.setError(issue.path.join(".") as never, {
            type: "validate",
            message: issue.message,
          }),
        );
        throw new Error(t("TYPE_NOT_ALLOWED"));
      }
      const currentInventory = await inventory.refetch().unwrap();
      for (const item of values.products) {
        if (item.mode !== supplyProductMode.existing) continue;
        const stored = currentInventory.find(
          (row) =>
            row.id === item.warehouseProductId &&
            row.userId === user.id &&
            row.warehouseId === values.warehouseId,
        );
        if (
          !stored ||
          !supportedStorageTypes(
            currentSubscription.plan,
            warehouses.find((row) => row.id === values.warehouseId),
          ).includes(stored.storageType)
        )
          throw new Error(t("STOCK_UNAVAILABLE"));
      }
      posted = true;
      await create(supplySaveValues(values)).unwrap();
      submitted.current = true;
      navigate("/storage/supply-requests", { replace: true });
    } catch (e) {
      const status = (e as { status?: number | string }).status;
      if (
        posted &&
        (status === "NETWORK_ERROR" ||
          (typeof status === "number" && status >= 500))
      ) {
        submitted.current = true;
        setError(t("SUPPLY_RESULT_UNKNOWN"));
      } else setError(storageError(e, t("SAVE_ERROR")));
    } finally {
      busy.current = false;
      setChecking(false);
    }
  });
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={
          <StorageHeader
            title={t("NEW_SUPPLY")}
            description={t("SUPPLY_CREATE_HINT")}
            back="/storage/supply-requests"
            actions={
              <>
                <Button
                  component={Link}
                  to="/storage/supply-requests"
                  variant="outlined"
                  color="primary"
                  disabled={checking}
                >
                  {t("CANCEL")}
                </Button>
                <LoadingButton
                  color="primary"
                  variant="contained"
                  loading={checking || creating.isLoading}
                  disabled={unavailable || !warehouseId || submitted.current}
                  onClick={save}
                  data-testid="submit-supply-request"
                >
                  {t("SUBMIT_REQUEST")}
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
            <div className="p-16 sm:p-24 space-y-20 max-w-6xl">
              {error && <Alert severity="error">{error}</Alert>}
              {(warehouse.isError ||
                subscription.isError ||
                inventory.isError) && (
                <Alert
                  severity="error"
                  action={
                    <Button
                      onClick={() => {
                        if (warehouse.isError) void warehouse.refetch();
                        if (inventory.isError) void inventory.refetch();
                        if (subscription.isError) void subscription.refetch();
                      }}
                    >
                      {t("RETRY")}
                    </Button>
                  }
                >
                  {t("LOAD_ERROR")}
                </Alert>
              )}
              <BasicInfoTab
                disabled={checking || submitted.current}
                allowedTypes={allowed}
                allTypes={types}
                warehouse={currentWarehouse}
                onWarehouseChange={setWarehouseId}
              />
            </div>
          </>
        }
        scroll="normal"
      />
    </FormProvider>
  );
}
export default function SupplyRequest() {
  const { supplyRequestId } = useParams(),
    user = useAppSelector(selectUser);
  if (supplyRequestId === "new" && user.role !== "user")
    return <Navigate to="/error/401" replace />;
  return (
    <StorageGate subscriptionRequired>
      {supplyRequestId === "new" ? <NewSupplyRequest /> : <SupplyRequestView />}
    </StorageGate>
  );
}
