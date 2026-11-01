import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
  FeatureHeaderMeta,
  FeatureHeaderToolbar,
  FeatureHeaderFilter,
} from "app/shared-components/feature-header/FeatureHeader";
import { Alert, Button, Input, Typography } from "@mui/material";

import { useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";

import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { canViewWithdrawRequests } from "../Utils";
import Currency from "../../utils/currencyFormatter";
import { Link } from "react-router-dom";
import {
  GetWithdrawRequestsApiArg,
  useGetWithdrawRequestsUserQuery,
  useGetWithdrawBalanceQuery,
} from "../WithdrawRequestsApi";
import { withdrawRequestStatus, toWithdrawRequestStatusTitle } from "../Utils";
import {
  selectWithdrawRequestsFilters,
  setWithdrawRequestsSearchText,
  setWithdrawRequestsUserIdFilter,
  setWithdrawRequestsStatusFilter,
  setWithdrawRequestsDateFromFilter,
  setWithdrawRequestsDateToFilter,
  newWithdrawRequestsInstance,
  setWithdrawRequestsUpdatedByIdFilter,
} from "../store/withdrawRequestsSlice";
export default function WithdrawRequestsHeader() {
  const { t } = useTranslation("withdrawRequestsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser);
  const { userId = "all" } = useParams(),
    location = useLocation();
  const filters = useSelector(
    selectWithdrawRequestsFilters,
  ) as GetWithdrawRequestsApiArg;
  const canView = canViewWithdrawRequests(user);
  const selectedUser = useGetWithdrawRequestsUserQuery(filters.userIdFilter, {
    skip:
      !canView ||
      user.role === "user" ||
      !filters.userIdFilter ||
      filters.userIdFilter === "all",
  });
  const balanceId = user.role === "user" ? user.id : filters.userIdFilter;
  const balance = useGetWithdrawBalanceQuery(balanceId, {
    skip: !canView || !balanceId || balanceId === "all",
    refetchOnMountOrArgChange: true,
  });

  const label = (option) =>
    option
      ? `${option.firstName || ""} ${option.lastName || ""} ${option.email || ""}`.trim()
      : "";
  return (
    <FeatureHeader>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="withdraw-requests-app">
            {selectedUser.currentData
              ? `${t("WITHDRAW_REQUESTS_OF_MERCHANT")} "${label(selectedUser.currentData)}"`
              : t("WITHDRAW_REQUESTS")}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          {balance.currentData && !balance.isError && (
            <>
              <FeatureHeaderMeta>
                <Typography
                  className="font-semibold"
                  data-testid="withdraw-balance"
                >
                  {t(
                    user.role === "user"
                      ? "CURRENT_BALANCE"
                      : "MERCHANT_BALANCE",
                  )}
                  : {Currency(balance.currentData.amount)}
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
                to="/withdraw-requests/all/new"
                variant="contained"
                data-testid="add-withdraw-request"
              >
                {t("ADD_WITHDRAW_REQUEST")}
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
              placeholder={t("SEARCH_WITHDRAW_REQUESTS")}
              onChange={(event) =>
                dispatch(setWithdrawRequestsSearchText(event))
              }
              inputProps={{
                "aria-label": t("SEARCH_WITHDRAW_REQUESTS"),
                "data-testid": "withdraw-requests-search",
              }}
            />
          </>
        }
      >
        <FeatureHeaderFilter
          componentProps={{
            color: "primary",
            "aria-label": t("FILTER_REQUESTS"),
            "data-testid": "withdraw-requests-filters",
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
                      dispatch(setWithdrawRequestsUserIdFilter(value)),
                    getItemUrl: "v1/users",
                    getItemsUrl: "v1/users?type=user",
                    getOptionLabel: label,
                    closeOnChange: false,
                  },
                ]
              : []),
            ...(user.role === "admin"
              ? [
                  {
                    type: FilterTypes.autocomplete as const,
                    title: t("UPDATED_BY"),
                    placeholder: t("SELECT_SINGLE_EMPLOYEE"),
                    value: filters.updatedByIdFilter || null,
                    onChange: (value) =>
                      dispatch(setWithdrawRequestsUpdatedByIdFilter(value)),
                    getItemUrl: "v1/users",
                    getItemsUrl: "v1/users?role=admin&role=employee",
                    getOptionLabel: label,
                    closeOnChange: false,
                  },
                ]
              : []),
            {
              type: FilterTypes.dropdown,
              title: t("STATUS"),
              value: filters.statusFilter,
              onChange: (value) =>
                dispatch(setWithdrawRequestsStatusFilter(value)),
              items: [
                { label: t("ALL"), value: "all" },
                ...Object.values(withdrawRequestStatus).map((value) => ({
                  label: t(toWithdrawRequestStatusTitle(value)),
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
                dispatch(setWithdrawRequestsDateFromFilter(value)),
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
                dispatch(setWithdrawRequestsDateToFilter(value)),
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
              newWithdrawRequestsInstance({
                userIdFilter: user.role === "user" ? "all" : userId,
                updatedByIdFilter:
                  new URLSearchParams(location.search).get("updatedById") || "",
              }),
            )
          }
        >
          {t("RESET_FILTERS")}
        </Button>
      </FeatureHeaderToolbar>
      {balance.isError && (
        <>
          <Alert
            severity="error"
            action={
              <Button onClick={() => balance.refetch()}>{t("RETRY")}</Button>
            }
          >
            {t("BALANCE_LOAD_ERROR")}
          </Alert>
        </>
      )}
      {selectedUser.isError && (
        <>
          <Alert
            severity="error"
            action={
              <Button onClick={() => selectedUser.refetch()}>
                {t("RETRY")}
              </Button>
            }
          >
            {t("USER_LOOKUP_ERROR")}
          </Alert>
        </>
      )}
    </FeatureHeader>
  );
}
