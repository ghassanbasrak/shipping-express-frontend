import type { AffiliateWithdrawViewFeature } from "../Utils";
import { Alert, Button, Input, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import FilterIcon from "app/shared-components/filter-icon/FilterIcon";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { canViewAffiliateWithdrawRequests } from "../Utils";
import Currency from "../../utils/currencyFormatter";
import { Link } from "react-router-dom";
import {
  GetAffiliateWithdrawRequestsApiArg,
  useGetAffiliateWithdrawRequestsUserQuery,
  useGetAffiliateWithdrawRequestsQuery,
  useGetAffiliateWithdrawBalanceQuery,
} from "../AffiliateWithdrawRequestsApi";
import {
  affiliateWithdrawRequestStatus,
  toAffiliateWithdrawRequestStatusTitle,
  toAffiliateWithdrawRequestStatusColor,
} from "../Utils";
import {
  selectAffiliateWithdrawRequestsFilters,
  setAffiliateWithdrawRequestsSearchText,
  setAffiliateWithdrawRequestsUserIdFilter,
  setAffiliateWithdrawRequestsStatusFilter,
  setAffiliateWithdrawRequestsDateFromFilter,
  setAffiliateWithdrawRequestsDateToFilter,
  newAffiliateWithdrawRequestsInstance,
  setAffiliateWithdrawRequestsUpdatedByIdFilter,
} from "../store/affiliateWithdrawRequestsSlice";
export default function AffiliateWithdrawRequestsHeader({
  fixedUserId,
  viewFeature = "affiliate-withdraw-requests",
}: {
  fixedUserId?: string;
  viewFeature?: AffiliateWithdrawViewFeature;
}) {
  const { t } = useTranslation("affiliateWithdrawRequestsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser);
  const { userId: routeUserId = "all" } = useParams(),
    userId = fixedUserId || routeUserId,
    location = useLocation();
  const filters = useSelector(
    selectAffiliateWithdrawRequestsFilters,
  ) as GetAffiliateWithdrawRequestsApiArg;
  const canView = canViewAffiliateWithdrawRequests(user, viewFeature);
  const selectedUser = useGetAffiliateWithdrawRequestsUserQuery(
    filters.userIdFilter,
    {
      skip:
        !canView ||
        user.role === "user" ||
        !filters.userIdFilter ||
        filters.userIdFilter === "all",
    },
  );
  const balanceId =
    user.role === "user" ? user.id : fixedUserId || filters.userIdFilter;
  const balance = useGetAffiliateWithdrawBalanceQuery(balanceId, {
    skip: !canView || !balanceId || balanceId === "all",
    refetchOnMountOrArgChange: true,
  });
  const pending = useGetAffiliateWithdrawRequestsQuery(
    { page: 0, pageSize: 1, statusFilter: "pending" },
    { skip: !canView || user.role !== "user", refetchOnMountOrArgChange: true },
  );
  const label = (option) =>
    option
      ? `${option.firstName || ""} ${option.lastName || ""} ${option.email || ""}`.trim()
      : "";
  return (
    <div className="flex flex-col gap-12 flex-1 w-full p-24 sm:p-32">
      <div className="flex flex-wrap items-center justify-between gap-16">
        <Typography
          component={motion.div}
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          className="text-24 md:text-32 font-bold"
        >
          {selectedUser.currentData
            ? `${t("WITHDRAW_REQUESTS_OF_MERCHANT")} "${label(selectedUser.currentData)}"`
            : t("WITHDRAW_REQUESTS")}
        </Typography>
        <div className="flex flex-wrap items-center justify-end gap-8">
          {user.role === "user" &&
            pending.currentData?.total === 0 &&
            !pending.isFetching &&
            !pending.isError && (
              <Button
                color="primary"
                component={Link}
                to="/affiliate-withdraw-requests/all/new"
                variant="contained"
                data-testid="add-affiliate-withdraw-request"
              >
                {t("ADD_WITHDRAW_REQUEST")}
              </Button>
            )}

          <FilterIcon
            componentProps={{
              color: "primary",
              "aria-label": t("FILTER_REQUESTS"),
              "data-testid": "affiliate-withdraw-requests-filters",
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
                        dispatch(
                          setAffiliateWithdrawRequestsUserIdFilter(value),
                        ),
                      getItemUrl: "v1/users",
                      getItemsUrl: "v1/users?type=user&isAffiliate=true",
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
                        dispatch(
                          setAffiliateWithdrawRequestsUpdatedByIdFilter(value),
                        ),
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
                  dispatch(setAffiliateWithdrawRequestsStatusFilter(value)),
                items: [
                  { label: t("ALL"), value: "all" },
                  ...Object.values(affiliateWithdrawRequestStatus).map(
                    (value) => ({
                      label: t(toAffiliateWithdrawRequestStatusTitle(value)),
                      value,
                    }),
                  ),
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
                  dispatch(setAffiliateWithdrawRequestsDateFromFilter(value)),
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
                  dispatch(setAffiliateWithdrawRequestsDateToFilter(value)),
                disableTime: true,
                closeOnChange: false,
              },
            ]}
          />
          <Button
            color="primary"
            variant="outlined"
            onClick={() =>
              dispatch(
                newAffiliateWithdrawRequestsInstance({
                  userIdFilter: user.role === "user" ? "all" : userId,
                  updatedByIdFilter:
                    new URLSearchParams(location.search).get("updatedById") ||
                    "",
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
              placeholder={t("SEARCH_WITHDRAW_REQUESTS")}
              onChange={(event) =>
                dispatch(setAffiliateWithdrawRequestsSearchText(event))
              }
              inputProps={{
                "aria-label": t("SEARCH_WITHDRAW_REQUESTS"),
                "data-testid": "affiliate-withdraw-requests-search",
              }}
            />
          </Paper>
        </div>
      </div>

      {balance.currentData && !balance.isError && (
        <Typography className="font-semibold" data-testid="affiliate-balance">
          {t(
            user.role === "user"
              ? "CURRENT_AFFILIATE_BALANCE"
              : "MERCHANT_AFFILIATE_BALANCE",
          )}
          : {Currency(balance.currentData.balance)}
        </Typography>
      )}
      {balance.isError && (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => balance.refetch()}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("BALANCE_LOAD_ERROR")}
        </Alert>
      )}
      {pending.isError && (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => pending.refetch()}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("PENDING_LOAD_ERROR")}
        </Alert>
      )}
      {selectedUser.isError && (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => selectedUser.refetch()}
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
