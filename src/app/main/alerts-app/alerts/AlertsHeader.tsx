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
import { GetAlertsApiArg } from "../AlertsApi";
import {
  selectAlertsFilters,
  setAlertsSearchText,
  setAlertsDateFromFilter,
  setAlertsDateToFilter,
  newAlertsInstance,
} from "../store/alertsSlice";

export default function AlertsHeader() {
  const { t } = useTranslation("alertsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser);
  const filters = useSelector(selectAlertsFilters) as GetAlertsApiArg;

  return (
    <FeatureHeader>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="alerts-app">
            {t("ALERTS")}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          {hasOperationPermission("alerts", "create", user) && (
            <>
              <Button
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                component={Link}
                to={"/alerts/new"}
                variant="contained"
                color="secondary"
                startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
                data-testid="add-alert"
              >
                {t("ADD_ALERT")}
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
              placeholder={t("SEARCH_ALERTS")}
              onChange={(event) => dispatch(setAlertsSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_ALERTS"),
                "data-testid": "alerts-search",
              }}
            />
          </>
        }
      >
        <FeatureHeaderFilter
          filters={[
            {
              type: FilterTypes.dateTime,
              title: t("START_DATE"),
              value: filters.dateFromFilter
                ? new Date(filters.dateFromFilter)
                : null,
              maxDate: filters.dateToFilter
                ? new Date(filters.dateToFilter)
                : undefined,
              onChange: (value) => dispatch(setAlertsDateFromFilter(value)),
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
              onChange: (value) => dispatch(setAlertsDateToFilter(value)),
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
          onClick={() => dispatch(newAlertsInstance(null))}
        >
          {t("RESET_FILTERS")}
        </Button>
      </FeatureHeaderToolbar>
    </FeatureHeader>
  );
}
