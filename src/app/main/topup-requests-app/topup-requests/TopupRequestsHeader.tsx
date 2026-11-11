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
  TopupBalanceCard,
  TopupHeaderHeading,
  TopupHeaderLayout,
} from "../shared-components/TopupHeaderLayout";
import {
  GetTopupRequestsApiArg,
  useGetTopupRequestsUserQuery,
} from "../TopupRequestsApi";
import {
  canViewTopupRequests,
  canAdjustTopupBalance,
  topupRequestStatus,
  toTopupRequestStatusTitle,
} from "../Utils";
import {
  selectTopupRequestsFilters,
  newTopupRequestsInstance,
  setTopupRequestsSearchText,
  setTopupRequestsUserIdFilter,
  setTopupRequestsStatusFilter,
  setTopupRequestsDateFromFilter,
  setTopupRequestsDateToFilter,
} from "../store/topupRequestsSlice";
export default function TopupRequestsHeader() {
  const { t } = useTranslation("topupRequestsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    { userId = "all" } = useParams(),
    filters = useSelector(selectTopupRequestsFilters) as GetTopupRequestsApiArg,
    permitted = canViewTopupRequests(user);
  const selected = useGetTopupRequestsUserQuery(filters.userIdFilter, {
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
      ? [
          `${t("STATUS")}: ${t(toTopupRequestStatusTitle(filters.statusFilter))}`,
        ]
      : []),
    ...(filters.dateFromFilter || filters.dateFromInvalid
      ? [t("START_DATE")]
      : []),
    ...(filters.dateToFilter || filters.dateToInvalid ? [t("END_DATE")] : []),
  ];
  return (
    <TopupHeaderLayout testId="topup-list-header">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-24">
        <TopupHeaderHeading
          title={t("TOPUP_REQUESTS")}
          description={t("TOPUP_LIST_DESCRIPTION")}
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-16 w-full lg:w-auto shrink-0">
          {account && !selected.isError && (
            <TopupBalanceCard
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
              to="/topup-requests/all/new"
              startIcon={
                <FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>
              }
              className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
              data-testid="new-topup"
            >
              {t("TOPUP_BALANCE")}
            </Button>
          )}
          {canAdjustTopupBalance(user, filters.userIdFilter) && (
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
              data-testid="adjust-topup-balance"
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
        data-testid="topup-search-toolbar"
      >
        <div className="flex items-center gap-8 px-8 min-h-36 min-w-0 flex-1">
          <FuseSvgIcon size={18} color="disabled">
            heroicons-outline:search
          </FuseSvgIcon>
          <Input
            disableUnderline
            fullWidth
            value={filters.searchText}
            placeholder={t("SEARCH_TOPUP_REQUESTS")}
            className="text-12 min-h-36"
            inputProps={{
              "data-testid": "topup-requests-search",
              "aria-label": t("SEARCH_TOPUP_REQUESTS"),
            }}
            onChange={(event) => dispatch(setTopupRequestsSearchText(event))}
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
              "data-testid": "topup-requests-filters",
              "aria-label": t("FILTER_REQUESTS"),
              startIcon: (
                <FuseSvgIcon size={16}>heroicons-outline:filter</FuseSvgIcon>
              ),
              children: t("TOPUP_FILTERS"),
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
                        dispatch(setTopupRequestsUserIdFilter(value)),
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
                onChange: (value) =>
                  dispatch(setTopupRequestsStatusFilter(value)),
                items: [
                  { label: t("ALL"), value: "all" },
                  ...Object.values(topupRequestStatus).map((value) => ({
                    label: t(toTopupRequestStatusTitle(value)),
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
                onChange: (value) =>
                  dispatch(setTopupRequestsDateFromFilter(value)),
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
                onChange: (value) =>
                  dispatch(setTopupRequestsDateToFilter(value)),
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
                newTopupRequestsInstance({
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
            {t("TOPUP_ACTIVE_FILTERS")}
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
    </TopupHeaderLayout>
  );
}
