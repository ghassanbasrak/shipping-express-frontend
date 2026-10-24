import { Button, Input, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import FilterIcon from "app/shared-components/filter-icon/FilterIcon";
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
    <div className="flex flex-col gap-12 flex-1 w-full p-24 sm:p-32">
      <div className="flex flex-wrap items-center justify-between gap-16">
        <Typography
          component={motion.div}
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          className="text-24 md:text-32 font-bold"
        >
          {t("APPLICATIONS")}
        </Typography>
        <div className="flex flex-wrap items-center justify-end gap-8">
          <FilterIcon
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
                onChange: (value) =>
                  dispatch(setApplicationsUserIdFilter(value)),
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
                onChange: (value) =>
                  dispatch(setApplicationsDateToFilter(value)),
                disableTime: true,
                closeOnChange: false,
              },
            ]}
          />
          <Button onClick={() => dispatch(newApplicationsInstance(null))}>
            {t("RESET_FILTERS")}
          </Button>
          <Paper className="flex items-center w-full sm:max-w-256 gap-8 px-16 rounded-8 border-1 shadow-0">
            <FuseSvgIcon color="disabled">heroicons-solid:search</FuseSvgIcon>
            <Input
              disableUnderline
              fullWidth
              value={filters.searchText}
              placeholder={t("SEARCH_APPLICATIONS")}
              onChange={(event) => dispatch(setApplicationsSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_APPLICATIONS"),
                "data-testid": "applications-search",
              }}
            />
          </Paper>
          {hasOperationPermission("applications", "view", user) &&
            hasOperationPermission("applications", "create", user) && (
              <Button
                component={Link}
                to="/applications/new"
                variant="contained"
                color="secondary"
                data-testid="add-application"
                startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
              >
                {t("ADD_APPLICATION")}
              </Button>
            )}
        </div>
      </div>
    </div>
  );
}
