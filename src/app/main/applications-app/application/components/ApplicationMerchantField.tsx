import { useState } from "react";
import { Alert, Autocomplete, Button, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { User } from "src/app/auth/user";
import IApplication from "../../models/IApplication";
import { applicationUserLabel } from "../../Utils";
import {
  useGetApplicationUsersQuery,
  useGetApplicationUserQuery,
} from "../../ApplicationsApi";
export default function ApplicationMerchantField({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { t } = useTranslation("applicationsApp"),
    { watch, control, setValue } = useFormContext<IApplication>(),
    form = watch(),
    [search, setSearch] = useState("");
  const users = useGetApplicationUsersQuery(
    { searchText: search },
    { skip: disabled },
  );
  const selected = useGetApplicationUserQuery(form.userId, {
    skip: !form.userId || form.user?.id === form.userId,
  });
  const current: User = form.userId
    ? users.currentData?.results.find((user) => user.id === form.userId) ||
      [form.user, selected.currentData].find(
        (user) => user?.id === form.userId,
      ) || { id: form.userId }
    : null;
  const options = users.currentData?.results || [];
  const items =
    current && !options.some((user) => user.id === current.id)
      ? [current, ...options]
      : options;
  return (
    <div className="space-y-8">
      {(users.isError || selected.isError) && (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => {
                if (users.isError) users.refetch();
                if (selected.isError) selected.refetch();
              }}
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
            disabled={disabled}
            value={current}
            options={items}
            loading={users.isFetching || selected.isFetching}
            getOptionLabel={applicationUserLabel}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(options) => options}
            onBlur={field.onBlur}
            onInputChange={(_, text, reason) => {
              if (reason === "input") setSearch(text);
              else if (reason === "clear") setSearch("");
            }}
            onChange={(_, user) => {
              field.onChange(user?.id || "");
              setValue("user", user);
              setSearch("");
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                name="userId"
                label={t("MERCHANT")}
                placeholder={t("SELECT_SINGLE_MERCHANT")}
                required
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
