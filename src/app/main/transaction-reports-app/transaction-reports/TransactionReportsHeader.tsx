import {
  Alert,
  Autocomplete,
  Button,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import type { User } from "src/app/auth/user";
import Currency from "src/app/main/utils/currencyFormatter";
import {
  useGetTransactionsAccountQuery,
  useGetTransactionsUsersQuery,
} from "../../transactions-app/TransactionsApi";
import {
  availableTransactionBalances,
  toRelatedBalanceTypeTitle,
  toTransactionTitleTypeTitle,
  transactionTitleOptions,
  transactionUserLabel,
} from "../../transactions-app/Utils";
import { GetTransactionReportsApiArg } from "../TransactionReportsApi";
import {
  selectTransactionReportsFilters,
  setTransactionReportsUserIdFilter,
  setTransactionReportsRelatedBalanceTypeFilter,
  setTransactionReportsTitleTypeFilter,
  setTransactionReportsDateFromFilter,
  setTransactionReportsDateToFilter,
} from "../store/transactionReportsSlice";
export default function TransactionReportsHeader() {
  const { t } = useTranslation("transactionReportsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    filters = useSelector(
      selectTransactionReportsFilters,
    ) as GetTransactionReportsApiArg,
    [search, setSearch] = useState("");
  const allowed = availableTransactionBalances(user),
    users = useGetTransactionsUsersQuery(
      { searchText: search },
      { skip: user.role === "user" || !allowed.length },
    );
  const selected = useGetTransactionsAccountQuery(
    user.role === "user" ? "me" : filters.userIdFilter,
    {
      skip:
        !allowed.length ||
        (user.role !== "user" &&
          (!filters.userIdFilter || filters.userIdFilter === "all")),
    },
  );
  const options = users.currentData?.results || [],
    current =
      filters.userIdFilter && filters.userIdFilter !== "all"
        ? options.find((item) => item.id === filters.userIdFilter) ||
          selected.currentData || { id: filters.userIdFilter }
        : null;
  const items =
    current && !options.some((item) => item.id === current.id)
      ? [current, ...options]
      : options;
  return (
    <div className="w-full flex-1 min-w-0 p-24 sm:p-32 space-y-16">
      <Typography className="text-24 md:text-32 font-bold">
        {t("TRANSACTION_REPORTS")}
      </Typography>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="space-y-16 min-w-0">
          {user.role !== "user" && (
            <Autocomplete<User>
              fullWidth
              options={items}
              value={current}
              loading={users.isFetching || selected.isFetching}
              getOptionLabel={transactionUserLabel}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              filterOptions={(items) => items}
              onInputChange={(_, text, reason) => {
                if (reason === "input") setSearch(text);
                else if (reason === "clear") setSearch("");
              }}
              onChange={(_, value) => {
                dispatch(setTransactionReportsUserIdFilter(value?.id || "all"));
                setSearch("");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  name="reportUserId"
                  required
                  label={t("MERCHANT")}
                  placeholder={t("SELECT_SINGLE_MERCHANT")}
                />
              )}
            />
          )}
          {selected.currentData && (
            <div className="space-y-8">
              <Typography data-testid="report-wallet-balance">
                {t("WALLET_BALANCE")}:{" "}
                {Currency(selected.currentData.balance ?? 0)}
              </Typography>
              <Typography>
                {t("COD_BALANCE")}:{" "}
                {Currency(selected.currentData.codBalance ?? 0)}
              </Typography>
            </div>
          )}
        </div>
        <div className="space-y-16 min-w-0">
          <div className="flex flex-wrap gap-8">
            {allowed.map((balance) => (
              <Button
                key={balance}
                variant={
                  filters.relatedBalanceTypeFilter === balance
                    ? "contained"
                    : "outlined"
                }
                data-testid={`report-balance-${balance}`}
                onClick={() =>
                  dispatch(
                    setTransactionReportsRelatedBalanceTypeFilter(balance),
                  )
                }
              >
                {t(toRelatedBalanceTypeTitle(balance))}
              </Button>
            ))}
          </div>
          <TextField
            fullWidth
            select
            label={t("TRANSACTION_TYPE")}
            name="reportTitle"
            value={filters.titleTypeFilter}
            onChange={(event) =>
              dispatch(setTransactionReportsTitleTypeFilter(event))
            }
          >
            <MenuItem value="all">{t("ALL")}</MenuItem>
            {transactionTitleOptions(filters.relatedBalanceTypeFilter).map(
              (value) => (
                <MenuItem key={value} value={value}>
                  {t(toTransactionTitleTypeTitle(value))}
                </MenuItem>
              ),
            )}
          </TextField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-16 min-w-0">
          {(["From", "To"] as const).map((which) => (
            <DatePicker
              key={which}
              label={t(which === "From" ? "START_DATE" : "END_DATE")}
              value={
                filters[`date${which}Invalid`]
                  ? new Date(NaN)
                  : filters[`date${which}Filter`]
                    ? new Date(filters[`date${which}Filter`])
                    : null
              }
              onChange={(value) =>
                dispatch(
                  which === "From"
                    ? setTransactionReportsDateFromFilter(value)
                    : setTransactionReportsDateToFilter(value),
                )
              }
              {...(which === "From"
                ? {
                    maxDate: filters.dateToFilter
                      ? new Date(filters.dateToFilter)
                      : undefined,
                  }
                : {
                    minDate: filters.dateFromFilter
                      ? new Date(filters.dateFromFilter)
                      : undefined,
                  })}
              slotProps={{
                textField: { name: `reportDate${which}`, fullWidth: true },
                actionBar: { actions: ["clear"] },
              }}
            />
          ))}
        </div>
      </div>
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
    </div>
  );
}
