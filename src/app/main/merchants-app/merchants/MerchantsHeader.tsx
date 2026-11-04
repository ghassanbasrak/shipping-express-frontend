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
    <FeatureHeader>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="merchants-app">
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
              onChange={(event) => dispatch(setMerchantsSearchText(event))}
              inputProps={{
                "data-testid": "merchants-search",
                "aria-label": t("SEARCH_MERCHANTS"),
              }}
            />
          </>
        }
      >
        <FeatureHeaderFilter
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
        <Button
          startIcon={
            <FuseSvgIcon size={16}>heroicons-outline:refresh</FuseSvgIcon>
          }
          size="small"
          className="rounded-8 min-h-36 px-12 text-12 flex-1 sm:flex-initial whitespace-nowrap"
          color="primary"
          variant="outlined"
          onClick={() => dispatch(newMerchantsInstance(null))}
        >
          {t("RESET_FILTERS")}
        </Button>
      </FeatureHeaderToolbar>
    </FeatureHeader>
  );
}
