import { Alert, Button, Input, Paper, Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import FilterIcon from "app/shared-components/filter-icon/FilterIcon";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import Currency from "../../utils/currencyFormatter";
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
  return (
    <div className="flex flex-col gap-16 w-full p-24 sm:p-32">
      <div className="flex flex-wrap justify-between items-center gap-16">
        <Typography className="text-24 md:text-32 font-bold">
          {t("TOPUP_REQUESTS")}
          {selected.currentData
            ? ` — ${selected.currentData.firstName || ""} ${selected.currentData.lastName || ""}`
            : ""}
        </Typography>
        <div className="flex flex-wrap items-center gap-8">
          <FilterIcon
            componentProps={{
              "data-testid": "topup-requests-filters",
              "aria-label": t("FILTER_REQUESTS"),
              children: <FuseSvgIcon>heroicons-outline:filter</FuseSvgIcon>,
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
          <Paper className="flex items-center w-full sm:max-w-256 gap-8 px-16 rounded-8 border-1 shadow-0">
            <FuseSvgIcon color="disabled">heroicons-solid:search</FuseSvgIcon>
            <Input
              disableUnderline
              fullWidth
              value={filters.searchText}
              placeholder={t("SEARCH_TOPUP_REQUESTS")}
              inputProps={{
                "data-testid": "topup-requests-search",
                "aria-label": t("SEARCH_TOPUP_REQUESTS"),
              }}
              onChange={(event) => dispatch(setTopupRequestsSearchText(event))}
            />
          </Paper>
          {user.role === "user" && (
            <Button
              component={Link}
              to="/topup-requests/all/new"
              variant="contained"
              data-testid="new-topup"
            >
              {t("TOPUP_BALANCE")}
            </Button>
          )}
          {canAdjustTopupBalance(user, filters.userIdFilter) && (
            <Button
              component={Link}
              to={`/transactions/${filters.userIdFilter}/all/new`}
              variant="contained"
              data-testid="adjust-topup-balance"
            >
              {t("EDIT_BALANCE")}
            </Button>
          )}
        </div>
      </div>
      {account && !selected.isError && (
        <Typography className="font-semibold" data-testid="topup-balance">
          {t(user.role === "user" ? "CURRENT_BALANCE" : "MERCHANT_BALANCE")}:{" "}
          {Currency(account.balance || 0)}
        </Typography>
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
    </div>
  );
}
