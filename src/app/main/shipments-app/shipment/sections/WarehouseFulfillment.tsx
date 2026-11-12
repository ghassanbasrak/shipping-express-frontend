import { useEffect, useRef } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  useGetWarehousesQuery,
  useGetStorageProductsQuery,
} from "../../../storage-app/StorageApi";
import { useGetStorageSubscriptionQuery } from "../../../storage-subscriptions-app/StorageSubscriptionsApi";
import { hasActiveStorageSubscription } from "../../../storage-app/Utils";
import { storageEnabled } from "../../../storage-app/storageConfig";
import WarehouseMap from "../../../storage-app/shared/WarehouseMap";
import type { ShipmentFormValues } from "../../models/ShipmentSchema";
import { shipmentWarehouseSnapshot, warehouseSenderValues } from "../../Utils";
import ShipmentChoiceTile from "../components/ShipmentChoiceTile";
import ShipmentField from "../components/ShipmentField";
export default function WarehouseFulfillment({
  disabled = false,
  completed = [],
}: {
  disabled?: boolean;
  completed?: string[];
}) {
  const user = useAppSelector(selectUser),
    { t } = useTranslation("storageApp"),
    {
      control,
      watch,
      setValue,
      getValues,
      formState: { errors },
    } = useFormContext<ShipmentFormValues>();
  const form = watch(),
    enabled = storageEnabled && user.role === "user",
    source = form.fulfillmentSource || "external",
    isWarehouse = source === "warehouse";
  const subscription = useGetStorageSubscriptionQuery(user.id, {
    skip: !enabled,
    refetchOnMountOrArgChange: true,
  });
  const active =
    enabled &&
    !subscription.isError &&
    hasActiveStorageSubscription(subscription.currentData, user.id);
  const warehouses = useGetWarehousesQuery(
    {},
    { skip: !active || !isWarehouse },
  );
  const products = useGetStorageProductsQuery(
    { warehouseId: form.warehouseId, userId: user.id },
    {
      skip: !active || !isWarehouse || !form.warehouseId,
      refetchOnMountOrArgChange: true,
    },
  );
  const { fields, append, remove } = useFieldArray({
    name: "warehouseItems",
    control,
    keyName: "formKey",
  });
  const externalSender = useRef<Partial<ShipmentFormValues>>();
  const appliedPickup = useRef<string>();
  useEffect(() => {
    const current = subscription.currentData;
    if (current?.userId === user.id)
      setValue("storageSubscription", {
        id: current.id,
        userId: current.userId,
        status: current.status,
        startsAt: current.startsAt,
        endsAt: current.endsAt,
      });
  }, [subscription.currentData, user.id, setValue]);
  useEffect(() => {
    if (!isWarehouse) {
      appliedPickup.current = undefined;
      return;
    }
    if (warehouses.isFetching || warehouses.isError) return;
    const warehouse = warehouses.currentData?.find(
      (row) => row.id === form.warehouseId,
    );
    const signature = JSON.stringify([
      warehouse?.id,
      warehouse?.name,
      warehouse?.pickup,
    ]);
    if (appliedPickup.current === signature) return;
    appliedPickup.current = signature;
    setValue(
      "warehouse",
      warehouse ? shipmentWarehouseSnapshot(warehouse) : undefined,
    );
    for (const [key, value] of Object.entries(warehouseSenderValues(warehouse)))
      setValue(key as keyof ShipmentFormValues, value as never, {
        shouldValidate: true,
      });
  }, [
    isWarehouse,
    warehouses.currentData,
    warehouses.isFetching,
    warehouses.isError,
    form.warehouseId,
    setValue,
  ]);
  useEffect(() => {
    if (!Array.isArray(products.currentData)) return;
    getValues("warehouseItems")?.forEach((item, index) => {
      const product = products.currentData.find(
        (row) =>
          row.id === item.productId &&
          row.userId === user.id &&
          row.warehouseId === form.warehouseId,
      );
      if (product && JSON.stringify(item.product) !== JSON.stringify(product))
        setValue(`warehouseItems.${index}.product`, {
          id: product.id,
          userId: product.userId,
          warehouseId: product.warehouseId,
          sku: product.sku,
          name: product.name,
          unitPrice: product.unitPrice,
          storageType: product.storageType,
          quantity: product.quantity,
        });
    });
  }, [products.currentData, user.id, form.warehouseId, setValue, getValues]);
  if (!enabled || (!active && !isWarehouse)) return null;
  const warehouse = warehouses.currentData?.find(
      (row) => row.id === form.warehouseId,
    ),
    inventory = (products.currentData || []).filter(
      (row) => row.userId === user.id && row.warehouseId === form.warehouseId,
    );
  const pending = (form.receivers || []).filter(
    (receiver) => !completed.includes(receiver.key),
  ).length;
  function chooseSource(value: "external" | "warehouse") {
    if (disabled || value === source) return;
    if (value === "warehouse") {
      externalSender.current = structuredClone(
        Object.fromEntries(
          Object.entries(getValues()).filter(([key]) =>
            key.startsWith("sender"),
          ),
        ),
      );
    } else {
      for (const [key, value] of Object.entries(externalSender.current || {}))
        setValue(key as keyof ShipmentFormValues, value as never, {
          shouldValidate: true,
        });
    }
    setValue("fulfillmentSource", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }
  return (
    <div className="space-y-16" data-testid="warehouse-fulfillment">
      <Typography className="text-16 font-semibold">
        {t("FULFILLMENT_SOURCE")}
      </Typography>
      {subscription.isError && (
        <Alert
          severity="error"
          action={
            <Button onClick={() => subscription.refetch()}>{t("RETRY")}</Button>
          }
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
        <ShipmentChoiceTile
          title={t("EXTERNAL_SOURCE")}
          hint={t("EXTERNAL_SOURCE_HINT")}
          icon="heroicons-outline:truck"
          active={!isWarehouse}
          disabled={disabled}
          testId="fulfillment-external"
          onClick={() => chooseSource("external")}
        />
        {active && (
          <ShipmentChoiceTile
            title={t("WAREHOUSE_SOURCE")}
            hint={t("WAREHOUSE_SOURCE_HINT")}
            icon="heroicons-outline:cube"
            active={isWarehouse}
            disabled={disabled || !active}
            testId="fulfillment-warehouse"
            onClick={() => chooseSource("warehouse")}
          />
        )}
      </div>
      {!active && (
        <Alert
          severity="info"
          action={
            <Button component={Link} to="/storage" target="_blank">
              {t("VIEW_PLANS")}
            </Button>
          }
        >
          {t(
            subscription.isFetching
              ? "SUBSCRIPTION_CHECK"
              : "SUBSCRIPTION_REQUIRED",
          )}
        </Alert>
      )}
      {isWarehouse && (
        <>
          {(warehouses.isError || products.isError) && (
            <Alert
              severity="error"
              action={
                <Button
                  onClick={() => {
                    if (warehouses.isError) void warehouses.refetch();
                    if (products.isError) void products.refetch();
                  }}
                >
                  {t("RETRY")}
                </Button>
              }
            >
              {t("LOAD_ERROR")}
            </Alert>
          )}
          <Autocomplete
            options={warehouses.currentData || []}
            value={warehouse || null}
            loading={warehouses.isFetching}
            disabled={disabled || !active}
            getOptionLabel={(row) => row.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            onChange={(_, value) => {
              setValue("warehouseId", value?.id || "", { shouldDirty: true });
              setValue("warehouseItems", []);
              setValue(
                "warehouse",
                value ? shipmentWarehouseSnapshot(value) : undefined,
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                name="shipmentWarehouseId"
                required
                label={t("WAREHOUSE")}
                error={!!errors.warehouseId}
                helperText={errors.warehouseId?.message}
              />
            )}
          />
          {warehouse && (
            <Paper variant="outlined" className="p-16 rounded-12 space-y-12">
              <Typography>{warehouse.pickup?.street}</Typography>
              <WarehouseMap address={warehouse.mapAddress} />
              <Typography className="text-13" color="text.secondary">
                {t("AUTOMATIC_PICKUP_HINT")}
              </Typography>
            </Paper>
          )}
          <Alert severity="info">
            {t("SHIPMENT_STOCK_HINT")}{" "}
            {t("RECEIVERS_COUNT", { count: pending })}
          </Alert>
          {fields.map((field, index) => {
            const item = form.warehouseItems?.[index] || {
                productId: "",
                quantity: 1,
              },
              current =
                inventory.find((row) => row.id === item.productId) ||
                item.product;
            return (
              <Paper
                key={field.formKey}
                variant="outlined"
                className="p-16 rounded-12 space-y-12"
              >
                <div className="flex items-start gap-12">
                  <Autocomplete
                    className="min-w-0 flex-1"
                    value={current || null}
                    options={
                      current && !inventory.some((row) => row.id === current.id)
                        ? [current, ...inventory]
                        : inventory
                    }
                    disabled={
                      disabled ||
                      !active ||
                      products.isFetching ||
                      products.isError
                    }
                    getOptionLabel={(row) =>
                      [row.sku, row.name].filter(Boolean).join(" / ")
                    }
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                    getOptionDisabled={(row) =>
                      !inventory.some(
                        (product) =>
                          product.id === row.id && product.quantity > 0,
                      )
                    }
                    onChange={(_, value) =>
                      setValue(
                        `warehouseItems.${index}`,
                        {
                          productId: value?.id || "",
                          quantity: item.quantity,
                          product: value || undefined,
                        },
                        { shouldDirty: true, shouldValidate: true },
                      )
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        name={`warehouseItems.${index}.productId`}
                        required
                        label={t("CHOOSE_PRODUCT")}
                        error={!!errors.warehouseItems?.[index]?.productId}
                        helperText={
                          errors.warehouseItems?.[index]?.productId?.message
                        }
                      />
                    )}
                  />
                  <IconButton
                    color="error"
                    aria-label={t("REMOVE")}
                    disabled={disabled}
                    onClick={() => remove(index)}
                  >
                    <FuseSvgIcon size={20}>heroicons-outline:trash</FuseSvgIcon>
                  </IconButton>
                </div>
                <ShipmentField
                  name={`warehouseItems.${index}.quantity`}
                  label={t("QUANTITY")}
                  type="number"
                  required
                  disabled={disabled}
                />
                {current && (
                  <Typography
                    className="text-13"
                    color={
                      item.quantity * pending >
                      (inventory.find((row) => row.id === current.id)
                        ?.quantity || 0)
                        ? "error"
                        : "text.secondary"
                    }
                  >
                    {t("AVAILABLE")}:{" "}
                    {inventory.find((row) => row.id === current.id)?.quantity ||
                      0}{" "}
                    |{" "}
                    {t("STOCK_TOTAL_REQUIRED", {
                      count: item.quantity * pending,
                    })}
                  </Typography>
                )}
              </Paper>
            );
          })}
          {errors.warehouseItems?.message && (
            <Alert severity="error">{errors.warehouseItems.message}</Alert>
          )}
          <div className="flex flex-wrap gap-12">
            <Button
              variant="outlined"
              color="primary"
              disabled={disabled || !active || !form.warehouseId}
              onClick={() => append({ productId: "", quantity: 1 })}
              data-testid="add-warehouse-product"
            >
              {t("ADD_PRODUCT")}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              disabled={disabled || !form.warehouseId}
              onClick={() => products.refetch()}
            >
              {t("STOCK_REFRESH")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
