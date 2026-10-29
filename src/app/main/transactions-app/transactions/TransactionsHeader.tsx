import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
  FeatureHeaderMeta,
  FeatureHeaderToolbar,
  FeatureHeaderFilter,
} from "app/shared-components/feature-header/FeatureHeader";
import { Alert, Button, Input, Typography } from "@mui/material";

import { Link, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";

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
    <FeatureHeader>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="transactions-app">
            {t(
              filters.relatedBalanceTypeFilter === "cod"
                ? "COD_TRANSACTIONS"
                : "TRANSACTIONS",
            )}

            {selected.currentData && user.role !== "user"
              ? ` â€” ${transactionUserLabel(selected.currentData)}`
              : ""}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          {selected.currentData && (
            <>
              <FeatureHeaderMeta>
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
              </FeatureHeaderMeta>
            </>
          )}
          {user.role === "user" && (
            <>
              <Button
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                color="primary"
                component={Link}
                to="/topup-requests/all/new"
                variant="contained"
                data-testid="topup-wallet"
              >
                {t("TOPUP_BALANCE")}
              </Button>
            </>
          )}
          {canCreate && (
            <>
              <Button
                color="primary"
                component={Link}
                to={`/transactions/${filters.userIdFilter}/all/new`}
                variant="contained"
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                data-testid="new-transaction"
              >
                {t("EDIT_BALANCE")}
              </Button>
            </>
          )}
        </FeatureHeaderActions>
      </FeatureHeaderRow>
      <FeatureHeaderToolbar
        search={
          <>
            <Input
              className="text-12 min-h-36 flex-1"
              disableUnderline
              fullWidth={true}
              value={filters.searchText}
              placeholder={t("SEARCH_TRANSACTIONS")}
              onChange={(event) => dispatch(setTransactionsSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_TRANSACTIONS"),
                "data-testid": "transactions-search",
              }}
            />
          </>
        }
      >
        <FeatureHeaderFilter
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
                      dispatch(setTransactionsRelatedBalanceTypeFilter(value)),
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
              onChange: (value) => dispatch(setTransactionsDateToFilter(value)),
              disableTime: true,
              closeOnChange: false,
            },
          ]}
        />
        <Button
          startIcon={
            <FuseSvgIcon size={16}>heroicons-outline:refresh</FuseSvgIcon>
          }
          size="small"
          className="rounded-8 min-h-36 px-12 text-12 flex-1 sm:flex-initial whitespace-nowrap"
          color="primary"
          variant="outlined"
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
                    ? new URLSearchParams(location.search).get("createdById") ||
                      ""
                    : "",
              }),
            )
          }
        >
          {t("RESET_FILTERS")}
        </Button>
      </FeatureHeaderToolbar>
      {selected.isError && (
        <>
          <Alert
            severity="error"
            action={
              <Button onClick={() => selected.refetch()}>{t("RETRY")}</Button>
            }
          >
            {t("USER_LOOKUP_ERROR")}
          </Alert>
        </>
      )}
    </FeatureHeader>
  );
}
