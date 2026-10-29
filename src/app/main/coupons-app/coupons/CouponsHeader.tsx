import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
  FeatureHeaderToolbar,
  FeatureHeaderFilter,
} from "app/shared-components/feature-header/FeatureHeader";
import { Alert, Button, Input } from "@mui/material";

import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";

import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { GetCouponsApiArg } from "../CouponsApi";
import {
  selectCouponsFilters,
  setCouponsSearchText,
  setCouponsDateFromFilter,
  setCouponsDateToFilter,
  newCouponsInstance,
  setCouponsShippingCompanyIdFilter,
} from "../store/couponsSlice";
import { useGetShippingCompaniesQuery } from "../../shipping-companies-app/ShippingCompaniesApi";
import { couponsPath } from "../Utils";
export default function CouponsHeader() {
  const { t } = useTranslation("couponsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser);
  const filters = useSelector(selectCouponsFilters) as GetCouponsApiArg;
  const { shippingCompanyId = "all", userId = "all" } = useParams();
  const companies = useGetShippingCompaniesQuery({ page: 0, pageSize: 1000 });
  return (
    <FeatureHeader>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="coupons-app">
            {filters.shippingCompanyIdFilter !== "all" &&
            companies.data?.results.find(
              (company) => company.id === filters.shippingCompanyIdFilter,
            )
              ? `${t("COUPONS_OF_COMPANY")} "${companies.data.results.find((company) => company.id === filters.shippingCompanyIdFilter).name}"`
              : t("COUPONS")}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          {hasOperationPermission("coupons", "create", user) && (
            <>
              <Button
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                component={Link}
                to={`${couponsPath(filters.shippingCompanyIdFilter, filters.userIdFilter)}/new`}
                variant="contained"
                color="secondary"
                startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
                data-testid="add-coupon"
              >
                {t("ADD_COUPON")}
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
              placeholder={t("SEARCH_COUPONS")}
              onChange={(event) => dispatch(setCouponsSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_COUPONS"),
                "data-testid": "coupons-search",
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
                dispatch(setCouponsShippingCompanyIdFilter(value)),
              items: [
                { label: t("ALL"), value: "all" },
                ...(companies.data?.results || []).map((company) => ({
                  label: company.name,
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
              onChange: (value) => dispatch(setCouponsDateFromFilter(value)),
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
              onChange: (value) => dispatch(setCouponsDateToFilter(value)),
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
          onClick={() =>
            dispatch(
              newCouponsInstance({
                shippingCompanyIdFilter: shippingCompanyId,
                userIdFilter: userId,
              }),
            )
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
