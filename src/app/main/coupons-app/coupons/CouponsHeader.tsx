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
    <div className="flex flex-col gap-12 flex-1 w-full p-24 sm:p-32">
      <div className="flex flex-wrap items-center justify-between gap-16">
        <motion.div
          initial={{ x: -20 }}
          animate={{ x: 0, transition: { delay: 0.3 } }}
        >
          <Typography className="text-24 md:text-32 font-bold">
            {filters.shippingCompanyIdFilter !== "all" &&
            companies.data?.results.find(
              (company) => company.id === filters.shippingCompanyIdFilter,
            )
              ? `${t("COUPONS_OF_COMPANY")} "${companies.data.results.find((company) => company.id === filters.shippingCompanyIdFilter).name}"`
              : t("COUPONS")}
          </Typography>
        </motion.div>
        <div className="flex flex-wrap items-center justify-end gap-8">
          <FilterIcon
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
          <Paper className="flex items-center w-full sm:max-w-256 gap-8 px-16 rounded-8 border-1 shadow-0">
            <FuseSvgIcon color="disabled">heroicons-solid:search</FuseSvgIcon>
            <Input
              disableUnderline
              fullWidth
              value={filters.searchText}
              placeholder={t("SEARCH_COUPONS")}
              onChange={(event) => dispatch(setCouponsSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_COUPONS"),
                "data-testid": "coupons-search",
              }}
            />
          </Paper>
          {hasOperationPermission("coupons", "create", user) && (
            <Button
              component={Link}
              to={`${couponsPath(filters.shippingCompanyIdFilter, filters.userIdFilter)}/new`}
              variant="contained"
              color="secondary"
              startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
              data-testid="add-coupon"
            >
              {t("ADD_COUPON")}
            </Button>
          )}
        </div>
      </div>
      {companies.isError && (
        <Alert
          severity="error"
          action={
            <Button onClick={() => companies.refetch()}>{t("RETRY")}</Button>
          }
        >
          {t("LOOKUP_ERROR")}
        </Alert>
      )}
    </div>
  );
}
