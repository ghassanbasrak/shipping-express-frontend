import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderToolbar,
  FeatureHeaderFilter,
} from "app/shared-components/feature-header/FeatureHeader";
import { Button, Input } from "@mui/material";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";

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
    <FeatureHeader>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="affiliate-merchants-app">
            {t("MERCHANTS")}
          </FeatureHeaderHeading>
        </div>
      </FeatureHeaderRow>
      <FeatureHeaderToolbar
        search={
          <>
            <Input
              className="text-12 min-h-36 flex-1"
              disableUnderline
              fullWidth={true}
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
          </>
        }
      >
        <FeatureHeaderFilter
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
        <Button
          startIcon={
            <FuseSvgIcon size={16}>heroicons-outline:refresh</FuseSvgIcon>
          }
          size="small"
          className="rounded-8 min-h-36 px-12 text-12 flex-1 sm:flex-initial whitespace-nowrap"
          color="primary"
          variant="outlined"
          onClick={() => dispatch(newAffiliateMerchantsInstance(null))}
        >
          {t("RESET_FILTERS")}
        </Button>
      </FeatureHeaderToolbar>
    </FeatureHeader>
  );
}
