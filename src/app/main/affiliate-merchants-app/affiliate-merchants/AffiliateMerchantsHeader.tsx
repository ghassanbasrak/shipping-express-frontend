import { Button, Input, Paper, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import FilterIcon from "app/shared-components/filter-icon/FilterIcon";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch } from "app/store/hooks";
import { GetAffiliateMerchantsApiArg } from "../AffiliateMerchantsApi";
import {
  merchantLoyaltyTypes,
  toMerchantLoyaltyTypeTitle,
  merchantVerificationStatus,
  toMerchantVerificationStatusTitle,
  merchantBalanceTypeFilters,
  toMerchantBalanceTypeFilterTitle,
  merchantActiveStatus,
  toMerchantActiveStatusTitle,
} from "../../merchants-app/Utils";
import {
  selectAffiliateMerchantsFilters,
  newAffiliateMerchantsInstance,
  setAffiliateMerchantsSearchText,
  setAffiliateMerchantsTypeFilter,
  setAffiliateMerchantsBalanceTypeFilter,
  setAffiliateMerchantsStatusFilter,
  setAffiliateMerchantsVerificationStatusFilter,
  setAffiliateMerchantsDateFromFilter,
  setAffiliateMerchantsDateToFilter,
} from "../store/affiliateMerchantsSlice";
export default function AffiliateMerchantsHeader() {
  const { t } = useTranslation("affiliateMerchantsApp"),
    dispatch = useAppDispatch(),
    filters = useSelector(
      selectAffiliateMerchantsFilters,
    ) as GetAffiliateMerchantsApiArg;
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
            "data-testid": "affiliateMerchants-filters",
            "aria-label": t("FILTER_MERCHANTS"),
            children: <FuseSvgIcon>heroicons-outline:filter</FuseSvgIcon>,
          }}
          filters={[
            dropdown(
              "MERCHANT_TYPE",
              filters.typeFilter,
              setAffiliateMerchantsTypeFilter,
              merchantLoyaltyTypes,
              toMerchantLoyaltyTypeTitle,
            ),
            dropdown(
              "MERCHANT_BALANCE_TYPE",
              filters.balanceTypeFilter,
              setAffiliateMerchantsBalanceTypeFilter,
              merchantBalanceTypeFilters,
              toMerchantBalanceTypeFilterTitle,
            ),
            dropdown(
              "MERCHANT_STATUS",
              filters.statusFilter,
              setAffiliateMerchantsStatusFilter,
              merchantActiveStatus,
              toMerchantActiveStatusTitle,
            ),
            dropdown(
              "VERIFICATION_STATUS",
              filters.verificationStatusFilter,
              setAffiliateMerchantsVerificationStatusFilter,
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
              onChange: (value) =>
                dispatch(setAffiliateMerchantsDateFromFilter(value)),
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
                dispatch(setAffiliateMerchantsDateToFilter(value)),
              disableTime: true,
              closeOnChange: false,
            },
          ]}
        />
        <Button onClick={() => dispatch(newAffiliateMerchantsInstance(null))}>
          {t("RESET_FILTERS")}
        </Button>
        <Paper className="flex items-center w-full sm:max-w-256 gap-8 px-16 rounded-8 border-1 shadow-0">
          <FuseSvgIcon color="disabled">heroicons-solid:search</FuseSvgIcon>
          <Input
            disableUnderline
            fullWidth
            value={filters.searchText}
            placeholder={t("SEARCH_MERCHANTS")}
            onChange={(event) =>
              dispatch(setAffiliateMerchantsSearchText(event))
            }
            inputProps={{
              "data-testid": "affiliateMerchants-search",
              "aria-label": t("SEARCH_MERCHANTS"),
            }}
          />
        </Paper>
      </div>
    </div>
  );
}
