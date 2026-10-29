import { useGetCountriesShippingCompaniesQuery } from "../../countries-app/CountriesApi";
import { motion } from "framer-motion";
import { Alert, Button, Input, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "app/store/hooks";
import { useTranslation } from "react-i18next";
import FilterIcon from "app/shared-components/filter-icon/FilterIcon";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { GetStatesApiArg } from "../StatesApi";
import {
  newStatesInstance,
  setStatesCountryIdFilter,
  selectStatesFilters,
  setStatesSearchText,
  setStatesShippingCompanyIdFilter,
  setStatesDateFromFilter,
  setStatesDateToFilter,
} from "../store/statesSlice";
import { statesPath, displayName } from "../Utils";
export default function StatesHeader() {
  const { t } = useTranslation("statesApp");
  const dispatch = useAppDispatch();
  const filters = useSelector(selectStatesFilters) as GetStatesApiArg;
  const companies = useGetCountriesShippingCompaniesQuery();
  return (
    <div
      className="flex flex-col space-y-12 sm:space-y-0 flex-1 w-full justify-between py-8 sm:py-16 px-16 md:px-24"
      data-testid="states-header"
    >
      <div className="flex flex-wrap gap-16 items-center justify-between w-full">
        <motion.span
          initial={{ x: -20 }}
          animate={{ x: 0, transition: { delay: 0.2 } }}
        >
          <Typography className="text-24 md:text-32 font-extrabold tracking-tight">
            {t("STATES")}
          </Typography>
        </motion.span>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-8">
          <FilterIcon
            filters={[
              {
                type: FilterTypes.autocomplete,
                title: t("COUNTRY"),
                value:
                  filters.countryIdFilter === "all"
                    ? null
                    : filters.countryIdFilter,
                getItemUrl: "v1/countries",
                getItemsUrl: "v1/countries?page=0&pageSize=1000",
                getOptionLabel: (item) => displayName(item.name),
                onChange: (value) => dispatch(setStatesCountryIdFilter(value)),
                closeOnChange: false,
              },

              {
                type: FilterTypes.dropdown,
                title: t("SHIPPING_COMPANY"),
                value: filters.shippingCompanyIdFilter,
                onChange: (value) =>
                  dispatch(setStatesShippingCompanyIdFilter(value)),
                items: [
                  { label: t("ALL"), value: "all" },
                  ...(companies.data?.results || []).map((company) => ({
                    label: displayName(company.name),
                    value: company.id,
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
                onChange: (date) => dispatch(setStatesDateFromFilter(date)),
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
                onChange: (date) => dispatch(setStatesDateToFilter(date)),
                disableTime: true,
                closeOnChange: false,
              },
            ]}
            changesCount={
              [
                filters.shippingCompanyIdFilter !== "all",
                filters.countryIdFilter !== "all",
                !!filters.dateFromFilter,
                !!filters.dateToFilter,
              ].filter(Boolean).length
            }
          />
          <Button
            color="primary"
            variant="outlined"
            onClick={() =>
              dispatch(newStatesInstance({ shippingCompanyIdFilter: "all" }))
            }
          >
            {t("RESET_FILTERS")}
          </Button>
          <Paper
            component={motion.div}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
            className="flex items-center w-full sm:max-w-256 space-x-8 px-16 rounded-8 border-1 shadow-0"
          >
            <FuseSvgIcon color="disabled">heroicons-solid:search</FuseSvgIcon>
            <Input
              disableUnderline
              fullWidth
              placeholder={t("SEARCH_STATES")}
              value={filters.searchText}
              onChange={(event) => dispatch(setStatesSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_STATES"),
                "data-testid": "states-search",
              }}
            />
          </Paper>
          <Button
            component={Link}
            to={`${statesPath(filters.shippingCompanyIdFilter, filters.countryIdFilter)}/new`}
            variant="contained"
            color="secondary"
            startIcon={<FuseSvgIcon>material-twotone:add</FuseSvgIcon>}
          >
            {t("ADD_STATE")}
          </Button>
        </div>
      </div>
      {companies.isError && (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => companies.refetch()}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("LOOKUP_ERROR")}
        </Alert>
      )}
    </div>
  );
}
