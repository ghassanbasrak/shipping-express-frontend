import { Alert, Button, Input, Paper, Typography } from "@mui/material";
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
    <div className="flex flex-col gap-12 flex-1 w-full p-24 sm:p-32">
      <div className="flex flex-wrap items-center justify-between gap-16">
        <motion.div
          initial={{ x: -20 }}
          animate={{ x: 0, transition: { delay: 0.3 } }}
        >
          <Typography className="text-24 md:text-32 font-bold">
            {t("ALERTS")}
          </Typography>
        </motion.div>
        <div className="flex flex-wrap items-center justify-end gap-8">
          <FilterIcon
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
            color="primary"
            variant="outlined"
            onClick={() => dispatch(newAlertsInstance(null))}
          >
            {t("RESET_FILTERS")}
          </Button>
          <Paper className="flex items-center w-full sm:max-w-256 gap-8 px-16 rounded-8 border-1 shadow-0">
            <FuseSvgIcon color="disabled">heroicons-solid:search</FuseSvgIcon>
            <Input
              disableUnderline
              fullWidth
              value={filters.searchText}
              placeholder={t("SEARCH_ALERTS")}
              onChange={(event) => dispatch(setAlertsSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_ALERTS"),
                "data-testid": "alerts-search",
              }}
            />
          </Paper>
          {hasOperationPermission("alerts", "create", user) && (
            <Button
              component={Link}
              to={"/alerts/new"}
              variant="contained"
              color="secondary"
              startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
              data-testid="add-alert"
            >
              {t("ADD_ALERT")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
