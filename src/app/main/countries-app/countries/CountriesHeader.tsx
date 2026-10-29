import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
  FeatureHeaderToolbar,
  FeatureHeaderFilter,
} from "app/shared-components/feature-header/FeatureHeader";

import { Alert, Button, Input } from "@mui/material";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "app/store/hooks";
import { useTranslation } from "react-i18next";

import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import {
  GetCountriesApiArg,
  useGetCountriesShippingCompaniesQuery,
} from "../CountriesApi";
import {
  newCountriesInstance,
  selectCountriesFilters,
  setCountriesSearchText,
  setCountriesShippingCompanyIdFilter,
  setCountriesDateFromFilter,
  setCountriesDateToFilter,
} from "../store/countriesSlice";
import { countriesPath, displayName } from "../Utils";
export default function CountriesHeader() {
  const { t } = useTranslation("countriesApp");
  const dispatch = useAppDispatch();
  const filters = useSelector(selectCountriesFilters) as GetCountriesApiArg;
  const companies = useGetCountriesShippingCompaniesQuery();
  return (
    <FeatureHeader data-testid="countries-header">
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="countries-app">
            {t("COUNTRIES")}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          <Button
            className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
            component={Link}
            to={`${countriesPath(filters.shippingCompanyIdFilter)}/new`}
            variant="contained"
            color="secondary"
            startIcon={<FuseSvgIcon>material-twotone:add</FuseSvgIcon>}
          >
            {t("ADD_COUNTRY")}
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
              placeholder={t("SEARCH_COUNTRIES")}
              value={filters.searchText}
              onChange={(event) => dispatch(setCountriesSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_COUNTRIES"),
                "data-testid": "countries-search",
              }}
            />
          </>
        }
      >
        <FeatureHeaderFilter
          filters={[
            {
              type: FilterTypes.dropdown,
              title: t("SHIPPING_COMPANY"),
              value: filters.shippingCompanyIdFilter,
              onChange: (value) =>
                dispatch(setCountriesShippingCompanyIdFilter(value)),
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
              onChange: (date) => dispatch(setCountriesDateFromFilter(date)),
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
              onChange: (date) => dispatch(setCountriesDateToFilter(date)),
              disableTime: true,
              closeOnChange: false,
            },
          ]}
          changesCount={
            [
              filters.shippingCompanyIdFilter !== "all",
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
            dispatch(newCountriesInstance({ shippingCompanyIdFilter: "all" }))
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
