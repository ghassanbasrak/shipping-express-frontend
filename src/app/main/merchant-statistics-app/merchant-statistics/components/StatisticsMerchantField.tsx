import { useState } from "react";
import { Alert, Autocomplete, Button, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { User } from "src/app/auth/user";
import type { MerchantStatisticsForm } from "../../models/MerchantStatisticsSchema";
import {
  useGetStatisticsUsersQuery,
  useGetStatisticsUserQuery,
} from "../../MerchantStatisticsApi";
import { statisticsUserLabel } from "../../Utils";
export default function StatisticsMerchantField({
  namespace,
}: {
  namespace: string;
}) {
  const { t } = useTranslation(namespace);
  const { watch, control, setValue } = useFormContext<MerchantStatisticsForm>();
  const [search, setSearch] = useState("");
  const userId = watch("userId"),
    user = watch("user");
  const users = useGetStatisticsUsersQuery({ searchText: search });
  const selected = useGetStatisticsUserQuery(userId, {
    skip: !userId || user?.id === userId,
  });
  const current = userId
    ? users.currentData?.results.find((item) => item.id === userId) ||
      [user, selected.currentData].find((item) => item?.id === userId) || {
        id: userId,
      }
    : null;
  const options = users.currentData?.results || [];
  const items =
    current && !options.some((item) => item.id === current.id)
      ? [current, ...options]
      : options;
  return (
    <div className="space-y-8">
      {(users.isError || selected.isError) && (
        <Alert
          severity="error"
          action={
            <Button
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
            fullWidth
            value={current}
            options={items}
            loading={users.isFetching || selected.isFetching}
            getOptionLabel={statisticsUserLabel}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(items) => items}
            onBlur={field.onBlur}
            onInputChange={(_, text, reason) => {
              if (reason === "input") setSearch(text);
              else if (reason === "clear") setSearch("");
            }}
            onChange={(_, value) => {
              field.onChange(value?.id || "");
              setValue("user", value);
              setSearch("");
            }}
            renderInput={(params) => (
              <TextField
                fullWidth
                {...params}
                name="userId"
                required
                label={t("MERCHANT")}
                placeholder={t("SELECT_SINGLE_MERCHANT")}
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
