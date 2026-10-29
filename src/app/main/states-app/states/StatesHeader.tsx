import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
  FeatureHeaderToolbar,
  FeatureHeaderFilter,
} from "app/shared-components/feature-header/FeatureHeader";
import { useGetCountriesShippingCompaniesQuery } from "../../countries-app/CountriesApi";

import { Alert, Button, Input } from "@mui/material";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "app/store/hooks";
import { useTranslation } from "react-i18next";

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
    <FeatureHeader data-testid="states-header">
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="states-app">
            {t("STATES")}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          <Button
            className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
            component={Link}
            to={`${statesPath(filters.shippingCompanyIdFilter, filters.countryIdFilter)}/new`}
            variant="contained"
            color="secondary"
            startIcon={<FuseSvgIcon>material-twotone:add</FuseSvgIcon>}
          >
            {t("ADD_STATE")}
          </Button>
        </FeatureHeaderActions>
      </FeatureHeaderRow>
      <FeatureHeaderToolbar
        search={
          <>
            <Input
              className="text-12 min-h-36 flex-1"
              disableUnderline
              fullWidth={true}
              placeholder={t("SEARCH_STATES")}
              value={filters.searchText}
              onChange={(event) => dispatch(setStatesSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_STATES"),
                "data-testid": "states-search",
              }}
            />
          </>
        }
      >
        <FeatureHeaderFilter
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
          startIcon={
            <FuseSvgIcon size={16}>heroicons-outline:refresh</FuseSvgIcon>
          }
          size="small"
          className="rounded-8 min-h-36 px-12 text-12 flex-1 sm:flex-initial whitespace-nowrap"
          color="primary"
          variant="outlined"
          onClick={() =>
            dispatch(newStatesInstance({ shippingCompanyIdFilter: "all" }))
          }
        >
          {t("RESET_FILTERS")}
        </Button>
      </FeatureHeaderToolbar>
      {companies.isError && (
        <>
          <Alert
            severity="error"
            action={
              <Button onClick={() => companies.refetch()}>{t("RETRY")}</Button>
            }
          >
            {t("LOOKUP_ERROR")}
          </Alert>
        </>
      )}
    </FeatureHeader>
  );
}
