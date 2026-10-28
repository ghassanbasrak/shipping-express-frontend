import { Alert, Button, Input, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Link, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import FilterIcon from "app/shared-components/filter-icon/FilterIcon";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import Currency from "src/app/main/utils/currencyFormatter";
import {
  GetTransactionsApiArg,
  useGetTransactionsAccountQuery,
} from "../TransactionsApi";
import {
  availableTransactionBalances,
  transactionTitleOptions,
  toRelatedBalanceTypeTitle,
  toTransactionTitleTypeTitle,
  transactionUserLabel,
} from "../Utils";
import {
  selectTransactionsFilters,
  setTransactionsSearchText,
  setTransactionsUserIdFilter,
  setTransactionsCreatedByIdFilter,
  setTransactionsTitleTypeFilter,
  setTransactionsRelatedBalanceTypeFilter,
  setTransactionsDateFromFilter,
  setTransactionsDateToFilter,
  newTransactionsInstance,
} from "../store/transactionsSlice";
export default function TransactionsHeader({
  fixedUserId,
  fixedBalance,
}: { fixedUserId?: string; fixedBalance?: string } = {}) {
  const { t } = useTranslation("transactionsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    filters = useSelector(selectTransactionsFilters) as GetTransactionsApiArg;
  const {
      userId = fixedUserId || "all",
      relatedBalance = fixedBalance || "wallet",
    } = useParams(),
    location = useLocation(),
    allowed = availableTransactionBalances(user);
  const selected = useGetTransactionsAccountQuery(
    user.role === "user" ? "me" : filters.userIdFilter,
    {
      skip:
        !allowed.length ||
        (user.role !== "user" &&
          (!filters.userIdFilter || filters.userIdFilter === "all")),
    },
  );
  const canCreate =
    user.role !== "user" &&
    filters.userIdFilter &&
    filters.userIdFilter !== "all" &&
    hasOperationPermission("merchants", "update", user) &&
    availableTransactionBalances(user, "create").length > 0;
  return (
    <div className="flex flex-col flex-1 w-full gap-16 p-24 sm:p-32">
      <div className="flex flex-wrap justify-between items-center gap-16">
        <Typography
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-24 md:text-32 font-bold"
        >
          {t(
            filters.relatedBalanceTypeFilter === "cod"
              ? "COD_TRANSACTIONS"
              : "TRANSACTIONS",
          )}
          {selected.currentData && user.role !== "user"
            ? ` â€” ${transactionUserLabel(selected.currentData)}`
            : ""}
        </Typography>
        <div className="flex flex-wrap items-center gap-8 w-full sm:w-auto">
          <FilterIcon
            componentProps={{
              color: "primary",
              "data-testid": "transactions-filters",
              "aria-label": t("FILTER_TRANSACTIONS"),
              children: <FuseSvgIcon>heroicons-outline:filter</FuseSvgIcon>,
            }}
            filters={[
              ...(user.role !== "user" && !fixedUserId
                ? [
                    {
                      type: FilterTypes.autocomplete as const,
                      title: t("MERCHANT"),
                      placeholder: t("SELECT_SINGLE_MERCHANT"),
                      value:
                        filters.userIdFilter === "all"
                          ? null
                          : filters.userIdFilter,
                      onChange: (value) =>
                        dispatch(setTransactionsUserIdFilter(value)),
                      getItemUrl: "v1/users",
                      getItemsUrl: "v1/users?type=user",
                      getOptionLabel: transactionUserLabel,
                      closeOnChange: false,
                    },
                  ]
                : []),
              ...(user.role === "admin"
                ? [
                    {
                      type: FilterTypes.autocomplete as const,
                      title: t("CREATED_BY"),
                      placeholder: t("SELECT_SINGLE_EMPLOYEE"),
                      value: filters.createdByIdFilter || null,
                      onChange: (value) =>
                        dispatch(setTransactionsCreatedByIdFilter(value)),
                      getItemUrl: "v1/users",
                      getItemsUrl: "v1/users?role=admin&role=employee",
                      getOptionLabel: transactionUserLabel,
                      closeOnChange: false,
                    },
                  ]
                : []),
              ...(fixedBalance
                ? []
                : [
                    {
                      type: FilterTypes.dropdown as const,
                      title: t("BALANCE_TYPE"),
                      value: filters.relatedBalanceTypeFilter,
                      onChange: (value) =>
                        dispatch(
                          setTransactionsRelatedBalanceTypeFilter(value),
                        ),
                      items: [
                        ...(allowed.length === 2
                          ? [{ label: t("ALL"), value: "all" }]
                          : []),
                        ...allowed.map((value) => ({
                          label: t(toRelatedBalanceTypeTitle(value)),
                          value,
                        })),
                      ],
                      closeOnChange: false,
                    },
                  ]),
              {
                type: FilterTypes.multiChoice,
                title: t("TRANSACTION_TYPE"),
                value: filters.titleTypeFilter,
                onChange: (value) =>
                  dispatch(setTransactionsTitleTypeFilter(value)),
                items: transactionTitleOptions(
                  filters.relatedBalanceTypeFilter,
                ).map((value) => ({
                  label: t(toTransactionTitleTypeTitle(value)),
                  value,
                })),
                closeOnChange: false,
              },
              {
                type: FilterTypes.dateTime,
                title: t("START_DATE"),
                value: filters.dateFromInvalid
                  ? new Date(NaN)
                  : filters.dateFromFilter
                    ? new Date(filters.dateFromFilter)
                    : null,
                maxDate: filters.dateToFilter
                  ? new Date(filters.dateToFilter)
                  : undefined,
                onChange: (value) =>
                  dispatch(setTransactionsDateFromFilter(value)),
                disableTime: true,
                closeOnChange: false,
              },
              {
                type: FilterTypes.dateTime,
                title: t("END_DATE"),
                value: filters.dateToInvalid
                  ? new Date(NaN)
                  : filters.dateToFilter
                    ? new Date(filters.dateToFilter)
                    : null,
                minDate: filters.dateFromFilter
                  ? new Date(filters.dateFromFilter)
                  : undefined,
                onChange: (value) =>
                  dispatch(setTransactionsDateToFilter(value)),
                disableTime: true,
                closeOnChange: false,
              },
            ]}
          />
          <Button
            onClick={() =>
              dispatch(
                newTransactionsInstance({
                  userIdFilter: user.role === "user" ? "all" : userId,
                  relatedBalanceTypeFilter: allowed.includes(
                    relatedBalance as "wallet",
                  )
                    ? relatedBalance
                    : allowed.length === 2
                      ? "all"
                      : allowed[0],
                  createdByIdFilter:
                    user.role === "admin"
                      ? new URLSearchParams(location.search).get(
                          "createdById",
                        ) || ""
                      : "",
                }),
              )
            }
          >
            {t("RESET_FILTERS")}
          </Button>
          <Paper className="flex items-center w-full sm:max-w-256 gap-8 px-16 rounded-8 border-1 shadow-0">
            <FuseSvgIcon color="disabled">heroicons-solid:search</FuseSvgIcon>
            <Input
              disableUnderline
              fullWidth
              value={filters.searchText}
              placeholder={t("SEARCH_TRANSACTIONS")}
              onChange={(event) => dispatch(setTransactionsSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_TRANSACTIONS"),
                "data-testid": "transactions-search",
              }}
            />
          </Paper>
          {user.role === "user" && (
            <Button
              component={Link}
              to="/topup-requests/all/new"
              variant="contained"
              data-testid="topup-wallet"
            >
              {t("TOPUP_BALANCE")}
            </Button>
          )}
          {canCreate && (
            <Button
              component={Link}
              to={`/transactions/${filters.userIdFilter}/all/new`}
              variant="contained"
              className="whitespace-nowrap"
              data-testid="new-transaction"
            >
              {t("EDIT_BALANCE")}
            </Button>
          )}
        </div>
      </div>
      {selected.isError && (
        <Alert
          severity="error"
          action={
            <Button onClick={() => selected.refetch()}>{t("RETRY")}</Button>
          }
        >
          {t("USER_LOOKUP_ERROR")}
        </Alert>
      )}
      {selected.currentData && (
        <Typography data-testid="ledger-current-balance">
          {t(
            filters.relatedBalanceTypeFilter === "cod"
              ? "COD_BALANCE"
              : "WALLET_BALANCE",
          )}
          :{" "}
          {Currency(
            selected.currentData[
              filters.relatedBalanceTypeFilter === "cod"
                ? "codBalance"
                : "balance"
            ] ?? 0,
          )}
        </Typography>
      )}
    </div>
  );
}
