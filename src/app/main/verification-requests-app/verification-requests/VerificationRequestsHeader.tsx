import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
  FeatureHeaderToolbar,
  FeatureHeaderFilter,
} from "app/shared-components/feature-header/FeatureHeader";
import { Alert, Button, Chip, Input } from "@mui/material";

import { useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";

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
    <FeatureHeader>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="verification-requests-app">
            {selectedUser.currentData
              ? `${t("VERIFICATION_REQUESTS_OF_MERCHANT")} "${label(selectedUser.currentData)}"`
              : t("VERIFICATION_REQUESTS")}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          {profile?.verificationStatus && (
            <>
              <Chip
                label={t(
                  toVerificationRequestStatusTitle(profile.verificationStatus),
                )}
                className={
                  toVerificationRequestStatusColor(profile.verificationStatus) +
                  " text-white"
                }
              />
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
              placeholder={t("SEARCH_VERIFICATION_REQUESTS")}
              onChange={(event) =>
                dispatch(setVerificationRequestsSearchText(event))
              }
              inputProps={{
                "aria-label": t("SEARCH_VERIFICATION_REQUESTS"),
                "data-testid": "verification-requests-search",
              }}
            />
          </>
        }
      >
        <FeatureHeaderFilter
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
                      dispatch(setVerificationRequestsUpdatedByIdFilter(value)),
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
          startIcon={
            <FuseSvgIcon size={16}>heroicons-outline:refresh</FuseSvgIcon>
          }
          size="small"
          className="rounded-8 min-h-36 px-12 text-12 flex-1 sm:flex-initial whitespace-nowrap"
          color="primary"
          variant="outlined"
          onClick={() =>
            dispatch(
              newVerificationRequestsInstance({
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
