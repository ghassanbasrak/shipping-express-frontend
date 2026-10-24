import { Alert, Button, Chip, Input, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import FilterIcon from "app/shared-components/filter-icon/FilterIcon";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import {
  GetAuthRequestsApiArg,
  useGetAuthRequestsUserQuery,
} from "../AuthRequestsApi";
import { authRequestStatus, toAuthRequestStatusTitle } from "../Utils";
import {
  selectAuthRequestsFilters,
  setAuthRequestsSearchText,
  setAuthRequestsUserIdFilter,
  setAuthRequestsStatusFilter,
  setAuthRequestsDateFromFilter,
  setAuthRequestsDateToFilter,
  newAuthRequestsInstance,
} from "../store/authRequestsSlice";
export default function AuthRequestsHeader() {
  const { t } = useTranslation("authRequestsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser);
  const { userId = "all" } = useParams();
  const filters = useSelector(
    selectAuthRequestsFilters,
  ) as GetAuthRequestsApiArg;
  const canView = hasOperationPermission("auth-requests", "view", user);
  const selectedUser = useGetAuthRequestsUserQuery(filters.userIdFilter, {
    skip:
      !canView ||
      user.role === "user" ||
      !filters.userIdFilter ||
      filters.userIdFilter === "all",
  });
  const profile = user.role === "user" ? user : selectedUser.currentData;
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
            ? `${t("AUTH_REQUESTS_OF_MERCHANT")} "${label(selectedUser.currentData)}"`
            : t("AUTH_REQUESTS")}
        </Typography>
        <div className="flex flex-wrap items-center justify-end gap-8">
          <FilterIcon
            componentProps={{
              color: "primary",
              "aria-label": t("FILTER_REQUESTS"),
              "data-testid": "auth-requests-filters",
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
                        dispatch(setAuthRequestsUserIdFilter(value)),
                      getItemUrl: "v1/users",
                      getItemsUrl: "v1/users?type=user",
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
                  dispatch(setAuthRequestsStatusFilter(value)),
                items: [
                  { label: t("ALL"), value: "all" },
                  ...Object.values(authRequestStatus).map((value) => ({
                    label: t(toAuthRequestStatusTitle(value)),
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
                  dispatch(setAuthRequestsDateFromFilter(value)),
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
                  dispatch(setAuthRequestsDateToFilter(value)),
                disableTime: true,
                closeOnChange: false,
              },
            ]}
          />
          <Button
            onClick={() =>
              dispatch(
                newAuthRequestsInstance({
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
              placeholder={t("SEARCH_AUTH_REQUESTS")}
              onChange={(event) => dispatch(setAuthRequestsSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_AUTH_REQUESTS"),
                "data-testid": "auth-requests-search",
              }}
            />
          </Paper>
          {profile && (
            <Chip
              label={t(profile.isAuthorized ? "AUTHORIZED" : "UNAUTHORIZED")}
              color={profile.isAuthorized ? "success" : "error"}
            />
          )}
          {user.role === "user" &&
            !user.isAuthorized &&
            hasOperationPermission("auth-requests", "create", user) && (
              <Button
                component={Link}
                to="/auth-requests/all/new"
                variant="contained"
                color="secondary"
                data-testid="add-auth-request"
                startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
              >
                {t("ADD_AUTH_REQUEST")}
              </Button>
            )}
        </div>
      </div>
      {selectedUser.isError && (
        <Alert
          severity="error"
          action={
            <Button onClick={() => selectedUser.refetch()}>{t("RETRY")}</Button>
          }
        >
          {t("USER_LOOKUP_ERROR")}
        </Alert>
      )}
    </div>
  );
}
