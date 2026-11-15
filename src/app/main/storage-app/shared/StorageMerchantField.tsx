import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Alert, Autocomplete, Button, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  useGetMerchantsQuery,
  useGetMerchantQuery,
} from "../../merchants-app/MerchantsApi";
export default function StorageMerchantField({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { t } = useTranslation("storageApp"),
    { control, watch } = useFormContext(),
    [search, setSearch] = useState("");
  const id = watch("userId"),
    query = useGetMerchantsQuery({ page: 0, pageSize: 30, searchText: search }),
    selected = useGetMerchantQuery(id, { skip: !id });
  const options = query.currentData?.results || [],
    value = options.find((r) => r.id === id) || selected.currentData || null;
  return (
    <div>
      <Controller
        control={control}
        name="userId"
        render={({ field, fieldState }) => (
          <Autocomplete
            disabled={disabled}
            options={
              value && !options.some((r) => r.id === value.id)
                ? [value, ...options]
                : options
            }
            value={value}
            loading={query.isFetching || selected.isFetching}
            filterOptions={(r) => r}
            getOptionLabel={(r) =>
              r.companyName ||
              [r.firstName, r.lastName].filter(Boolean).join(" ") ||
              r.id
            }
            isOptionEqualToValue={(a, b) => a.id === b.id}
            onBlur={field.onBlur}
            onInputChange={(_, v, reason) => {
              if (reason === "input") setSearch(v);
              if (reason === "clear") setSearch("");
            }}
            onChange={(_, v) => field.onChange(v?.id || "")}
            renderInput={(params) => (
              <TextField
                {...params}
                required
                label={t("MERCHANT")}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        )}
      />
      {(query.isError || selected.isError) && (
        <Alert
          severity="error"
          action={
            <Button
              onClick={() => {
                if (query.isError) void query.refetch();
                if (selected.isError) void selected.refetch();
              }}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
    </div>
  );
}
