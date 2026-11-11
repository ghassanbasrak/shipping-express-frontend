import { useState } from "react";
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
import { useGetWarehousesQuery } from "../../StorageApi";
import type IWarehouse from "../../models/IWarehouse";
import { newSupplyItem } from "../../models/SupplyRequestModel";
import StorageField from "../../shared/StorageField";
import WarehouseMap from "../../shared/WarehouseMap";
export default function BasicInfoTab({
  disabled,
  allowedTypes,
  allTypes,
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
    { control, watch, setValue } = useFormContext(),
    [search, setSearch] = useState("");
  const query = useGetWarehousesQuery({}),
    { fields, append, remove } = useFieldArray({
      control,
      name: "products",
      keyName: "formKey",
    });
  const id = watch("warehouseId"),
    selected =
      query.currentData?.find((row) => row.id === id) || warehouse || null;
  const options = query.currentData || [];
  return (
    <div className="space-y-20" data-testid="supply-request-form">
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
        options={
          selected && !options.some((row) => row.id === selected.id)
            ? [selected, ...options]
            : options
        }
        getOptionLabel={(row) => row.name}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        loading={query.isFetching}
        disabled={disabled}
        filterOptions={(rows) =>
          rows.filter((row) =>
            row.name.toLowerCase().includes(search.toLowerCase()),
          )
        }
        onInputChange={(_, value, reason) => {
          if (reason === "input") setSearch(value);
          if (reason === "clear") setSearch("");
        }}
        onChange={(_, value) => {
          setValue("warehouseId", value?.id || "", {
            shouldDirty: true,
            shouldValidate: true,
          });
          onWarehouseChange(value?.id || "");
          setSearch("");
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            name="warehouseId"
            required
            label={t("WAREHOUSE")}
          />
        )}
      />
      {warehouse && (
        <Paper variant="outlined" className="p-16 rounded-12 space-y-12">
          <Typography className="font-semibold">{warehouse.name}</Typography>
          <Typography>{warehouse.address}</Typography>
          <WarehouseMap address={warehouse.mapAddress} />
        </Paper>
      )}
      <Alert severity="info">
        {t("ALLOWED_TYPES_HINT")}:{" "}
        {allowedTypes.join("، ") || t("CHOOSE_WAREHOUSE")}
      </Alert>
      {fields.map((item, index) => (
        <Paper
          key={item.formKey}
          variant="outlined"
          className="p-16 sm:p-20 rounded-16 space-y-16"
        >
          <div className="flex items-center justify-between gap-8">
            <Typography className="font-semibold">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">
            <StorageField
              name={`products.${index}.sku`}
              label={t("SKU")}
              disabled={disabled}
              helper={t("SKU_HINT")}
            />
            <StorageField
              name={`products.${index}.name`}
              label={t("PRODUCT_NAME")}
              required
              disabled={disabled}
            />
            <StorageField
              name={`products.${index}.storageType`}
              label={t("STORAGE_TYPE")}
              required
              disabled={disabled || !id}
            >
              <MenuItem value="">{t("SELECT")}</MenuItem>
              {allowedTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
              {watch(`products.${index}.storageType`) &&
                !allowedTypes.some(
                  (type) => type === watch(`products.${index}.storageType`),
                ) && (
                  <MenuItem
                    value={watch(`products.${index}.storageType`)}
                    disabled
                  >
                    {allTypes.find(
                      (type) => type === watch(`products.${index}.storageType`),
                    ) || t("TYPE_NOT_ALLOWED")}
                  </MenuItem>
                )}
            </StorageField>
            <StorageField
              name={`products.${index}.quantity`}
              label={t("QUANTITY")}
              type="number"
              required
              disabled={disabled}
            />
            <StorageField
              name={`products.${index}.unitPrice`}
              label={t("UNIT_PRICE")}
              type="number"
              required
              disabled={disabled}
            />
            <StorageField
              name={`products.${index}.notes`}
              label={t("PRODUCT_NOTES")}
              disabled={disabled}
            />
          </div>
        </Paper>
      ))}
      <Button
        variant="outlined"
        color="primary"
        disabled={disabled}
        onClick={() => append(newSupplyItem())}
        data-testid="add-supply-item"
      >
        {t("ADD_PRODUCT")}
      </Button>
    </div>
  );
}
