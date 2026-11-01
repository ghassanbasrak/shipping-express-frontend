import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
  FeatureHeaderToolbar,
  FeatureHeaderFilter,
} from "app/shared-components/feature-header/FeatureHeader";
import { Button, Input } from "@mui/material";

import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";

import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { GetApplicationsApiArg } from "../ApplicationsApi";
import { applicationUserLabel } from "../Utils";
import {
  selectApplicationsFilters,
  setApplicationsSearchText,
  setApplicationsUserIdFilter,
  setApplicationsDateFromFilter,
  setApplicationsDateToFilter,
  newApplicationsInstance,
} from "../store/applicationsSlice";
export default function ApplicationsHeader() {
  const { t } = useTranslation("applicationsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser);
  const filters = useSelector(
    selectApplicationsFilters,
  ) as GetApplicationsApiArg;
  return (
    <FeatureHeader>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="applications-app">
            {t("APPLICATIONS")}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          {hasOperationPermission("applications", "view", user) &&
            hasOperationPermission("applications", "create", user) && (
              <>
                <Button
                  className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                  component={Link}
                  to="/applications/new"
                  variant="contained"
                  color="secondary"
                  data-testid="add-application"
                  startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
                >
                  {t("ADD_APPLICATION")}
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
              placeholder={t("SEARCH_APPLICATIONS")}
              onChange={(event) => dispatch(setApplicationsSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_APPLICATIONS"),
                "data-testid": "applications-search",
              }}
            />
          </>
        }
      >
        <FeatureHeaderFilter
          componentProps={{
            color: "primary",
            "aria-label": t("FILTERS"),
            "data-testid": "applications-filters",
            children: <FuseSvgIcon>heroicons-outline:filter</FuseSvgIcon>,
          }}
          filters={[
            {
              type: FilterTypes.autocomplete,
              title: t("MERCHANT"),
              placeholder: t("SELECT_SINGLE_MERCHANT"),
              value:
                filters.userIdFilter === "all" ? null : filters.userIdFilter,
              onChange: (value) => dispatch(setApplicationsUserIdFilter(value)),
              getItemUrl: "v1/users",
              getItemsUrl: "v1/users?type=user",
              getOptionLabel: applicationUserLabel,
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
                dispatch(setApplicationsDateFromFilter(value)),
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
              onChange: (value) => dispatch(setApplicationsDateToFilter(value)),
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
          onClick={() => dispatch(newApplicationsInstance(null))}
        >
          {t("RESET_FILTERS")}
        </Button>
      </FeatureHeaderToolbar>
    </FeatureHeader>
  );
}
