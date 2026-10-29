import { Alert, Button, Chip, Input, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import FilterIcon from "app/shared-components/filter-icon/FilterIcon";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import {
  GetVerificationRequestsApiArg,
  useGetVerificationRequestsUserQuery,
} from "../VerificationRequestsApi";
import {
  verificationRequestStatus,
  toVerificationRequestStatusTitle,
  toVerificationRequestStatusColor,
} from "../Utils";
import {
  selectVerificationRequestsFilters,
  setVerificationRequestsSearchText,
  setVerificationRequestsUserIdFilter,
  setVerificationRequestsStatusFilter,
  setVerificationRequestsDateFromFilter,
  setVerificationRequestsDateToFilter,
  newVerificationRequestsInstance,
  setVerificationRequestsUpdatedByIdFilter,
} from "../store/verificationRequestsSlice";
export default function VerificationRequestsHeader() {
  const { t } = useTranslation("verificationRequestsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser);
  const { userId = "all" } = useParams(),
    location = useLocation();
  const filters = useSelector(
    selectVerificationRequestsFilters,
  ) as GetVerificationRequestsApiArg;
  const canView = hasOperationPermission("verification-requests", "view", user);
  const selectedUser = useGetVerificationRequestsUserQuery(
    filters.userIdFilter,
    {
      skip:
        !canView ||
        user.role === "user" ||
        !filters.userIdFilter ||
        filters.userIdFilter === "all",
    },
  );
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
            ? `${t("VERIFICATION_REQUESTS_OF_MERCHANT")} "${label(selectedUser.currentData)}"`
            : t("VERIFICATION_REQUESTS")}
        </Typography>
        <div className="flex flex-wrap items-center justify-end gap-8">
          <FilterIcon
            componentProps={{
              color: "primary",
              "aria-label": t("FILTER_REQUESTS"),
              "data-testid": "verification-requests-filters",
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
                        dispatch(setVerificationRequestsUserIdFilter(value)),
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
                        dispatch(
                          setVerificationRequestsUpdatedByIdFilter(value),
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
                  dispatch(setVerificationRequestsStatusFilter(value)),
                items: [
                  { label: t("ALL"), value: "all" },
                  ...Object.values(verificationRequestStatus).map((value) => ({
                    label: t(toVerificationRequestStatusTitle(value)),
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
                  dispatch(setVerificationRequestsDateFromFilter(value)),
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
                  dispatch(setVerificationRequestsDateToFilter(value)),
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
                newVerificationRequestsInstance({
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
              placeholder={t("SEARCH_VERIFICATION_REQUESTS")}
              onChange={(event) =>
                dispatch(setVerificationRequestsSearchText(event))
              }
              inputProps={{
                "aria-label": t("SEARCH_VERIFICATION_REQUESTS"),
                "data-testid": "verification-requests-search",
              }}
            />
          </Paper>
          {profile?.verificationStatus && (
            <Chip
              label={t(
                toVerificationRequestStatusTitle(profile.verificationStatus),
              )}
              className={
                toVerificationRequestStatusColor(profile.verificationStatus) +
                " text-white"
              }
            />
          )}
        </div>
      </div>
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
