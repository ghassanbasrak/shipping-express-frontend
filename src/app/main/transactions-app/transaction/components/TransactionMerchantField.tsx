import { useState } from "react";
import { Alert, Autocomplete, Button, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { User } from "src/app/auth/user";
import ITransaction from "../../models/ITransaction";
import { useGetTransactionsUsersQuery } from "../../TransactionsApi";
import { transactionUserLabel } from "../../Utils";
export default function TransactionMerchantField({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { t } = useTranslation("transactionsApp"),
    { watch, control, setValue } = useFormContext<ITransaction>(),
    [search, setSearch] = useState("");
  const userId = watch("userId"),
    user = watch("user"),
    users = useGetTransactionsUsersQuery(
      { searchText: search },
      { skip: disabled },
    );
  const options = users.currentData?.results || [],
    current = userId
      ? options.find((item) => item.id === userId) ||
        (user?.id === userId ? user : { id: userId })
      : null;
  const items =
    current && !options.some((item) => item.id === userId)
      ? [current, ...options]
      : options;
  return (
    <div className="space-y-8">
      {users.isError && (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => users.refetch()}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("USER_LOOKUP_ERROR")}
        </Alert>
      )}
      <Controller
        name="userId"
        control={control}
        render={({ field, fieldState }) => (
          <Autocomplete<User>
            fullWidth
            disabled={disabled}
            value={current}
            options={items}
            loading={users.isFetching}
            getOptionLabel={transactionUserLabel}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterOptions={(items) => items}
            onBlur={field.onBlur}
            onInputChange={(_, value, reason) => {
              if (reason === "input") setSearch(value);
              else if (reason === "clear") setSearch("");
            }}
            onChange={(_, value) => {
              field.onChange(value?.id || "");
              setValue("user", value ? structuredClone(value) : null);
              setSearch("");
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                name={field.name}
                required
                label={t("MERCHANT")}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        )}
      />
    </div>
  );
}
