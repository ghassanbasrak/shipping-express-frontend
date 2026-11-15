import {
  Alert,
  Autocomplete,
  Button,
  IconButton,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  useGetWarehousesQuery,
  useGetStorageProductsQuery,
} from "../../StorageApi";
import type IWarehouse from "../../models/IWarehouse";
import { newSupplyItem } from "../../models/SupplyRequestModel";
import { supplyProductMode, toStorageTypeTitle } from "../../Utils";
import StorageField from "../../shared/StorageField";
import WarehouseMap from "../../shared/WarehouseMap";
import Currency from "../../../utils/currencyFormatter";
export default function BasicInfoTab({
  disabled,
  allowedTypes,
  warehouse,
  onWarehouseChange,
}: {
  disabled: boolean;
  allowedTypes: string[];
  allTypes: string[];
  warehouse: IWarehouse;
  onWarehouseChange: (id: string) => void;
}) {
  const { t } = useTranslation("storageApp"),
    { control, watch, setValue, formState, getFieldState } = useFormContext(),
    user = useAppSelector(selectUser);
  const query = useGetWarehousesQuery({}),
    { fields, append, remove } = useFieldArray({
      control,
      name: "products",
      keyName: "formKey",
    });
  const id = watch("warehouseId"),
    products = watch("products"),
    selected = query.currentData?.find((r) => r.id === id) || warehouse || null;
  const inventory = useGetStorageProductsQuery(
    { userId: user.id, warehouseId: id, includeEmpty: true },
    { skip: !id },
  );
  return (
    <div className="space-y-24" data-testid="supply-request-form">
      {query.isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => query.refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <Autocomplete
        value={selected}
        options={query.currentData || []}
        getOptionLabel={(r) => r.name}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        loading={query.isFetching}
        disabled={disabled}
        onChange={(_, value) => {
          setValue("warehouseId", value?.id || "", {
            shouldDirty: true,
            shouldValidate: true,
          });
          onWarehouseChange(value?.id || "");
          products.forEach((p, i) => {
            if (p.mode === supplyProductMode.existing)
              setValue(`products.${i}`, {
                ...newSupplyItem(),
                mode: supplyProductMode.existing,
                unitPrice: null,
              });
          });
        }}
        renderInput={(params) => (
          <TextField {...params} required label={t("WAREHOUSE")} />
        )}
      />
      {warehouse && (
        <Paper variant="outlined" className="p-20 rounded-16 space-y-12">
          <Typography className="font-bold">{warehouse.name}</Typography>
          <Typography>{warehouse.pickup?.street}</Typography>
          <WarehouseMap address={warehouse.mapAddress} />
        </Paper>
      )}
      <Alert severity={!id || allowedTypes.length ? "info" : "warning"}>
        {t("ALLOWED_TYPES_HINT")}:{" "}
        {allowedTypes.map((v) => t(toStorageTypeTitle(v))).join("، ") ||
          t(id ? "NO_SUPPORTED_TYPES" : "CHOOSE_WAREHOUSE")}
      </Alert>
      {inventory.isError && (
        <Alert
          severity="error"
          action={
            <Button onClick={() => inventory.refetch()}>{t("RETRY")}</Button>
          }
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      {fields.map((item, index) => {
        const value = products[index],
          existing = value?.mode === supplyProductMode.existing;
        const stored = inventory.currentData?.find(
          (p) =>
            p.id === value?.warehouseProductId &&
            p.userId === user.id &&
            p.warehouseId === id,
        );
        return (
          <Paper
            key={item.formKey}
            variant="outlined"
            className="p-20 sm:p-24 rounded-20 space-y-20"
          >
            <div className="flex items-center justify-between gap-8">
              <Typography className="font-bold text-18">
                {t("PRODUCT_NUMBER", { number: index + 1 })}
              </Typography>
              <IconButton
                color="error"
                aria-label={t("REMOVE")}
                disabled={disabled || fields.length === 1}
                onClick={() => remove(index)}
              >
                <FuseSvgIcon size={20}>heroicons-outline:trash</FuseSvgIcon>
              </IconButton>
            </div>
            <TextField
              select
              fullWidth
              label={t("PRODUCT_SOURCE")}
              value={value?.mode || supplyProductMode.new}
              disabled={disabled}
              onChange={(e) =>
                setValue(
                  `products.${index}`,
                  { ...newSupplyItem(), mode: e.target.value },
                  { shouldDirty: true },
                )
              }
            >
              <MenuItem value={supplyProductMode.new}>
                {t("NEW_PRODUCT")}
              </MenuItem>
              <MenuItem value={supplyProductMode.existing}>
                {t("EXISTING_PRODUCT")}
              </MenuItem>
            </TextField>
            {existing && (
              <>
                <Autocomplete
                  value={stored || null}
                  options={(inventory.currentData || []).filter(
                    (p) => p.userId === user.id && p.warehouseId === id,
                  )}
                  getOptionLabel={(p) =>
                    [p.name, p.sku, t(toStorageTypeTitle(p.storageType))]
                      .filter(Boolean)
                      .join(" · ")
                  }
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  getOptionDisabled={(p) =>
                    !allowedTypes.includes(p.storageType)
                  }
                  disabled={disabled || !id || inventory.isError}
                  loading={inventory.isFetching}
                  onChange={(_, p) =>
                    setValue(
                      `products.${index}`,
                      {
                        ...value,
                        warehouseProductId: p?.id || "",
                        name: p?.name || "",
                        sku: p?.sku || "",
                        storageType: p?.storageType || "",
                        unitPrice: null,
                      },
                      { shouldDirty: true, shouldValidate: true },
                    )
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label={t("CHOOSE_PRODUCT")}
                      error={
                        !!getFieldState(
                          `products.${index}.warehouseProductId`,
                          formState,
                        ).error ||
                        (!stored && !!value?.warehouseProductId)
                      }
                      helperText={
                        getFieldState(
                          `products.${index}.warehouseProductId`,
                          formState,
                        ).error?.message ||
                        (!stored && value?.warehouseProductId
                          ? t("STOCK_UNAVAILABLE")
                          : undefined)
                      }
                    />
                  )}
                />
                {stored && (
                  <Alert severity="info">
                    {t("STOCK_INCREASE_HINT", {
                      old: stored.quantity,
                      next: stored.quantity + (Number(value.quantity) || 0),
                    })}
                    <br />
                    {t(
                      value.unitPrice == null
                        ? "PRICE_UNCHANGED_HINT"
                        : "PRICE_REPLACED_HINT",
                      { price: Currency(value.unitPrice ?? stored.unitPrice) },
                    )}
                  </Alert>
                )}
              </>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">
              {!existing && (
                <>
                  <StorageField
                    name={`products.${index}.name`}
                    label={t("PRODUCT_NAME")}
                    required
                    disabled={disabled}
                  />
                  <StorageField
                    name={`products.${index}.sku`}
                    label={t("SKU")}
                    disabled={disabled}
                  />
                  <StorageField
                    name={`products.${index}.storageType`}
                    label={t("STORAGE_TYPE")}
                    required
                    disabled={disabled || !id}
                  >
                    <MenuItem value="">{t("SELECT")}</MenuItem>
                    {allowedTypes.map((v) => (
                      <MenuItem key={v} value={v}>
                        {t(toStorageTypeTitle(v))}
                      </MenuItem>
                    ))}
                    {value.storageType &&
                      !allowedTypes.includes(value.storageType) && (
                        <MenuItem disabled value={value.storageType}>
                          {t("TYPE_NOT_ALLOWED")}
                        </MenuItem>
                      )}
                  </StorageField>
                </>
              )}
              <StorageField
                name={`products.${index}.quantity`}
                label={t("QUANTITY")}
                type="number"
                required
                disabled={disabled}
              />
              <StorageField
                name={`products.${index}.unitPrice`}
                label={t(existing ? "NEW_UNIT_PRICE" : "UNIT_PRICE")}
                type="nullableNumber"
                required={!existing}
                disabled={disabled}
                helper={existing ? t("OPTIONAL_NEW_PRICE") : undefined}
              />
              {!existing && (
                <StorageField
                  name={`products.${index}.notes`}
                  label={t("PRODUCT_NOTES")}
                  type="textarea"
                  disabled={disabled}
                />
              )}
            </div>
          </Paper>
        );
      })}
      <Button
        variant="outlined"
        disabled={disabled}
        onClick={() => append(newSupplyItem())}
        data-testid="add-supply-item"
      >
        {t("ADD_PRODUCT")}
      </Button>
    </div>
  );
}
