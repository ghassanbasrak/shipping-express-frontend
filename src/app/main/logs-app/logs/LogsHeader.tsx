import { Button, Input, Paper, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import FilterIcon from "app/shared-components/filter-icon/FilterIcon";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch } from "app/store/hooks";
import { GetLogsApiArg } from "../LogsApi";
import { logsType, toLogsTypeTitle } from "../Utils";
import {
  selectLogsFilters,
  newLogsInstance,
  setLogsSearchText,
  setLogsUserIdFilter,
  setLogsTypeFilter,
  setLogsDateFromFilter,
  setLogsDateToFilter,
} from "../store/logsSlice";
export default function LogsHeader() {
  const { t } = useTranslation("logsApp"),
    dispatch = useAppDispatch(),
    filters = useSelector(selectLogsFilters) as GetLogsApiArg;
  return (
    <div className="flex flex-wrap justify-between items-center gap-16 w-full p-24 sm:p-32">
      <Typography className="text-24 md:text-32 font-bold">
        {t("LOGS")}
      </Typography>
      <div className="flex flex-wrap items-center gap-8">
        <FilterIcon
          componentProps={{
            "data-testid": "logs-filters",
            "aria-label": t("FILTER_LOGS"),
            children: <FuseSvgIcon>heroicons-outline:filter</FuseSvgIcon>,
          }}
          filters={[
            {
              type: FilterTypes.autocomplete,
              title: t("MERCHANT"),
              placeholder: t("SELECT_SINGLE_MERCHANT"),
              value:
                filters.userIdFilter === "all" ? null : filters.userIdFilter,
              onChange: (value) => dispatch(setLogsUserIdFilter(value)),
              getItemUrl: "v1/users",
              getItemsUrl: "v1/users?type=user",
              getOptionLabel: (option) =>
                option
                  ? `${option.firstName || ""} ${option.lastName || ""} ${option.email || ""}`.trim()
                  : "",
              closeOnChange: false,
            },
            {
              type: FilterTypes.dropdown,
              title: t("TYPE"),
              value: filters.typeFilter,
              onChange: (value) => dispatch(setLogsTypeFilter(value)),
              items: [
                { label: t("ALL"), value: "all" },
                ...Object.values(logsType).map((value) => ({
                  label: t(toLogsTypeTitle(value)),
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
              onChange: (value) => dispatch(setLogsDateFromFilter(value)),
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
              onChange: (value) => dispatch(setLogsDateToFilter(value)),
              disableTime: true,
              closeOnChange: false,
            },
          ]}
        />
        <Button
          color="primary"
          variant="outlined"
          onClick={() => dispatch(newLogsInstance(null))}
        >
          {t("RESET_FILTERS")}
        </Button>
        <Paper className="flex items-center w-full sm:max-w-256 gap-8 px-16 rounded-8 border-1 shadow-0">
          <FuseSvgIcon color="disabled">heroicons-solid:search</FuseSvgIcon>
          <Input
            disableUnderline
            fullWidth
            value={filters.searchText}
            placeholder={t("SEARCH_LOGS")}
            inputProps={{
              "data-testid": "logs-search",
              "aria-label": t("SEARCH_LOGS"),
            }}
            onChange={(event) => dispatch(setLogsSearchText(event))}
          />
        </Paper>
      </div>
    </div>
  );
}
