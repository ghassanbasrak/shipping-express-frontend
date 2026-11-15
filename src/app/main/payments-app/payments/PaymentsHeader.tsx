import { Alert, Button, Chip, Input, Paper, Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import FilterIcon from "app/shared-components/filter-icon/FilterIcon";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  PaymentBalanceCard,
  PaymentHeaderHeading,
  PaymentHeaderLayout,
} from "../shared-components/PaymentHeaderLayout";
import { GetPaymentsApiArg, useGetPaymentsUserQuery } from "../PaymentsApi";
import {
  canViewPayments,
  canAdjustWalletBalance,
  paymentStatus,
  toPaymentStatusTitle,
} from "../Utils";
import {
  selectPaymentsFilters,
  newPaymentsInstance,
  setPaymentsSearchText,
  setPaymentsUserIdFilter,
  setPaymentsStatusFilter,
  setPaymentsDateFromFilter,
  setPaymentsDateToFilter,
} from "../store/paymentsSlice";
export default function PaymentsHeader() {
  const { t } = useTranslation("paymentsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    { userId = "all" } = useParams(),
    filters = useSelector(selectPaymentsFilters) as GetPaymentsApiArg,
    permitted = canViewPayments(user);
  const selected = useGetPaymentsUserQuery(filters.userIdFilter, {
    skip:
      !permitted ||
      user.role === "user" ||
      !filters.userIdFilter ||
      filters.userIdFilter === "all",
  });
  const account = user.role === "user" ? user : selected.currentData;

  const activeFilters = [
    ...(user.role !== "user" &&
    filters.userIdFilter &&
    filters.userIdFilter !== "all"
      ? [t("MERCHANT")]
      : []),
    ...(filters.statusFilter && filters.statusFilter !== "all"
      ? [`${t("STATUS")}: ${t(toPaymentStatusTitle(filters.statusFilter))}`]
      : []),
    ...(filters.dateFromFilter || filters.dateFromInvalid
      ? [t("START_DATE")]
      : []),
    ...(filters.dateToFilter || filters.dateToInvalid ? [t("END_DATE")] : []),
  ];
  return (
    <PaymentHeaderLayout testId="payments-list-header">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-24">
        <PaymentHeaderHeading
          title={t("PAYMENTS")}
          description={t("PAYMENT_LIST_DESCRIPTION")}
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-16 w-full lg:w-auto shrink-0">
          {account && !selected.isError && (
            <PaymentBalanceCard
              label={t(
                user.role === "user" ? "CURRENT_BALANCE" : "MERCHANT_BALANCE",
              )}
              balance={account.balance}
              accountName={
                user.role !== "user"
                  ? `${account.firstName || ""} ${account.lastName || ""}`.trim()
                  : undefined
              }
            />
          )}
          {user.role === "user" && (
            <Button
              color="primary"
              variant="contained"
              size="large"
              component={Link}
              to="/payments/all/new"
              startIcon={
                <FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>
              }
              className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
              data-testid="new-payment"
            >
              {t("ADD_PAYMENT")}
            </Button>
          )}
          <Button
            component={Link}
            variant="outlined"
            to={
              user.role === "user"
                ? "/bank-transfers/all"
                : `/bank-transfers/${filters.userIdFilter || "all"}`
            }
          >
            {t("BANK_HISTORY")}
          </Button>
          {canAdjustWalletBalance(user, filters.userIdFilter) && (
            <Button
              color="primary"
              variant="contained"
              size="large"
              component={Link}
              to={`/transactions/${filters.userIdFilter}/all/new`}
              startIcon={
                <FuseSvgIcon size={20}>
                  heroicons-outline:adjustments
                </FuseSvgIcon>
              }
              className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
              data-testid="adjust-payment-balance"
            >
              {t("EDIT_BALANCE")}
            </Button>
          )}
        </div>
      </div>
      <Paper
        elevation={0}
        className="flex flex-col sm:flex-row sm:items-center gap-8 p-6 w-full rounded-12 border-1"
        sx={{ borderColor: "divider" }}
        data-testid="payments-search-toolbar"
      >
        <div className="flex items-center gap-8 px-8 min-h-36 min-w-0 flex-1">
          <FuseSvgIcon size={18} color="disabled">
            heroicons-outline:search
          </FuseSvgIcon>
          <Input
            disableUnderline
            fullWidth
            value={filters.searchText}
            placeholder={t("SEARCH_PAYMENTS")}
            className="text-12 min-h-36"
            inputProps={{
              "data-testid": "payments-search",
              "aria-label": t("SEARCH_PAYMENTS"),
            }}
            onChange={(event) => dispatch(setPaymentsSearchText(event))}
          />
        </div>
        <div className="flex items-center gap-8 shrink-0 [&>div]:flex [&>div]:flex-1 sm:[&>div]:flex-initial [&_.MuiBadge-root]:w-full">
          <FilterIcon
            component={Button}
            changesCount={activeFilters.length}
            badgeColor="primary"
            componentProps={{
              variant: "outlined",
              color: "primary",
              size: "small",
              fullWidth: true,
              className: "rounded-8 min-h-36 px-12 text-12",
              "data-testid": "payments-filters",
              "aria-label": t("FILTER_PAYMENTS"),
              startIcon: (
                <FuseSvgIcon size={16}>heroicons-outline:filter</FuseSvgIcon>
              ),
              children: t("PAYMENT_FILTERS"),
            }}
            filters={[
              ...(user.role !== "user"
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
                        dispatch(setPaymentsUserIdFilter(value)),
                      getItemUrl: "v1/users",
                      getItemsUrl: "v1/users?type=user",
                      getOptionLabel: (option) =>
                        option
                          ? `${option.firstName || ""} ${option.lastName || ""} ${option.email || ""}`.trim()
                          : "",
                      closeOnChange: false,
                    },
                  ]
                : []),
              {
                type: FilterTypes.dropdown,
                title: t("STATUS"),
                value: filters.statusFilter,
                onChange: (value) => dispatch(setPaymentsStatusFilter(value)),
                items: [
                  { label: t("ALL"), value: "all" },
                  ...Object.values(paymentStatus).map((value) => ({
                    label: t(toPaymentStatusTitle(value)),
                    value,
                  })),
                ],
                closeOnChange: false,
              },
              {
                type: FilterTypes.dateTime,
                title: t("START_DATE"),
                value: filters.dateFromFilter
                  ? new Date(filters.dateFromFilter)
                  : null,
                maxDate: filters.dateToFilter
                  ? new Date(filters.dateToFilter)
                  : undefined,
                onChange: (value) => dispatch(setPaymentsDateFromFilter(value)),
                disableTime: true,
                closeOnChange: false,
              },
              {
                type: FilterTypes.dateTime,
                title: t("END_DATE"),
                value: filters.dateToFilter
                  ? new Date(filters.dateToFilter)
                  : null,
                minDate: filters.dateFromFilter
                  ? new Date(filters.dateFromFilter)
                  : undefined,
                onChange: (value) => dispatch(setPaymentsDateToFilter(value)),
                disableTime: true,
                closeOnChange: false,
              },
            ]}
          />
          <Button
            color="primary"
            variant="outlined"
            size="small"
            startIcon={
              <FuseSvgIcon size={16}>heroicons-outline:refresh</FuseSvgIcon>
            }
            className="rounded-8 min-h-36 px-12 text-12 flex-1 sm:flex-initial whitespace-nowrap"
            onClick={() =>
              dispatch(
                newPaymentsInstance({
                  userIdFilter: user.role === "user" ? "all" : userId,
                }),
              )
            }
          >
            {t("RESET_FILTERS")}
          </Button>
        </div>
      </Paper>
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-8">
          <Typography color="text.secondary" className="text-11">
            {t("PAYMENT_ACTIVE_FILTERS")}
          </Typography>
          {activeFilters.map((label) => (
            <Chip
              key={label}
              label={label}
              size="small"
              color="primary"
              variant="outlined"
              className="text-11 rounded-[7px]"
            />
          ))}
        </div>
      )}
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
    </PaymentHeaderLayout>
  );
}
