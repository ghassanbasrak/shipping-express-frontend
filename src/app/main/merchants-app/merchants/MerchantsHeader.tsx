import { Button, Input, Paper, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import FilterIcon from "app/shared-components/filter-icon/FilterIcon";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch } from "app/store/hooks";
import { GetMerchantsApiArg } from "../MerchantsApi";
import {
  merchantLoyaltyTypes,
  toMerchantLoyaltyTypeTitle,
  merchantVerificationStatus,
  toMerchantVerificationStatusTitle,
  merchantBalanceTypeFilters,
  toMerchantBalanceTypeFilterTitle,
  merchantActiveStatus,
  toMerchantActiveStatusTitle,
} from "../Utils";
import {
  selectMerchantsFilters,
  newMerchantsInstance,
  setMerchantsSearchText,
  setMerchantsTypeFilter,
  setMerchantsBalanceTypeFilter,
  setMerchantsStatusFilter,
  setMerchantsVerificationStatusFilter,
  setMerchantsDateFromFilter,
  setMerchantsDateToFilter,
} from "../store/merchantsSlice";
export default function MerchantsHeader() {
  const { t } = useTranslation("merchantsApp"),
    dispatch = useAppDispatch(),
    filters = useSelector(selectMerchantsFilters) as GetMerchantsApiArg;
  const dropdown = (
    label: string,
    value: string,
    action,
    values: object,
    title: (value: string) => string,
  ) => ({
    type: FilterTypes.dropdown as const,
    title: t(label),
    value,
    onChange: (value) => dispatch(action(value)),
    items: [
      { label: t("ALL"), value: "all" },
      ...Object.values(values).map((value) => ({
        label: t(title(value)),
        value,
      })),
    ],
    closeOnChange: false,
  });
  return (
    <div className="flex flex-wrap justify-between items-center gap-16 w-full p-24 sm:p-32">
      <Typography className="text-24 md:text-32 font-bold">
        {t("MERCHANTS")}
      </Typography>
      <div className="flex flex-wrap items-center gap-8">
        <FilterIcon
          componentProps={{
            "data-testid": "merchants-filters",
            "aria-label": t("FILTER_MERCHANTS"),
            children: <FuseSvgIcon>heroicons-outline:filter</FuseSvgIcon>,
          }}
          filters={[
            dropdown(
              "MERCHANT_TYPE",
              filters.typeFilter,
              setMerchantsTypeFilter,
              merchantLoyaltyTypes,
              toMerchantLoyaltyTypeTitle,
            ),
            dropdown(
              "MERCHANT_BALANCE_TYPE",
              filters.balanceTypeFilter,
              setMerchantsBalanceTypeFilter,
              merchantBalanceTypeFilters,
              toMerchantBalanceTypeFilterTitle,
            ),
            dropdown(
              "MERCHANT_STATUS",
              filters.statusFilter,
              setMerchantsStatusFilter,
              merchantActiveStatus,
              toMerchantActiveStatusTitle,
            ),
            dropdown(
              "VERIFICATION_STATUS",
              filters.verificationStatusFilter,
              setMerchantsVerificationStatusFilter,
              merchantVerificationStatus,
              toMerchantVerificationStatusTitle,
            ),
            {
              type: FilterTypes.dateTime,
              title: t("START_DATE"),
              value: filters.dateFromFilter
                ? new Date(filters.dateFromFilter)
                : null,
              maxDate: filters.dateToFilter
                ? new Date(filters.dateToFilter)
                : undefined,
              onChange: (value) => dispatch(setMerchantsDateFromFilter(value)),
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
              onChange: (value) => dispatch(setMerchantsDateToFilter(value)),
              disableTime: true,
              closeOnChange: false,
            },
          ]}
        />
        <Button onClick={() => dispatch(newMerchantsInstance(null))}>
          {t("RESET_FILTERS")}
        </Button>
        <Paper className="flex items-center w-full sm:max-w-256 gap-8 px-16 rounded-8 border-1 shadow-0">
          <FuseSvgIcon color="disabled">heroicons-solid:search</FuseSvgIcon>
          <Input
            disableUnderline
            fullWidth
            value={filters.searchText}
            placeholder={t("SEARCH_MERCHANTS")}
            onChange={(event) => dispatch(setMerchantsSearchText(event))}
            inputProps={{
              "data-testid": "merchants-search",
              "aria-label": t("SEARCH_MERCHANTS"),
            }}
          />
        </Paper>
      </div>
    </div>
  );
}
