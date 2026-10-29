import {
  useGetShippingCompaniesQuery,
  useGetShippingCompanyQuery,
} from "../../shipping-companies-app/ShippingCompaniesApi";
import { Link, useLocation, useParams } from "react-router-dom";
import { Alert, Button, Input, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import FilterIcon from "app/shared-components/filter-icon/FilterIcon";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { GetShipmentsApiArg } from "../ShipmentsApi";
import {
  canCreateShipment,
  canViewShipments,
  shipmentPath,
  shippingFilterTypes,
  shipmentTypes,
  shipmentStatus,
  shipmentPaymentStatus,
  toShippingFilterTypeTitle,
  toShipmentTypeTitle,
  toShipmentStatusTitle,
  toShipmentPaymentStatusTitle,
} from "../Utils";
import {
  selectShipmentsFilters,
  newShipmentsInstance,
  setShipmentsSearchText,
  setShipmentsViewType,
  setShipmentsShippingCompanyIdFilter,
  setShipmentsShippingTypeFilter,
  setShipmentsShipmentTypeFilter,
  setShipmentsIsReturnedFilter,
  setShipmentsStatusFilters,
  setShipmentsPaymentStatusFilter,
  setShipmentsMerchantIdFilter,
  setShipmentsUpdatedByIdFilter,
  setShipmentsSenderIdFilter,
  setShipmentsReceiverIdFilter,
  setShipmentsClosedInvoiceFilter,
  setShipmentsDateFromFilter,
  setShipmentsDateToFilter,
} from "../store/shipmentsSlice";
export default function ShipmentsHeader({
  fixedUserId,
}: { fixedUserId?: string } = {}) {
  const { t } = useTranslation("shipmentsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    location = useLocation(),
    { shippingCompanyId = "all", shippingType = "all" } = useParams(),
    filters = useSelector(selectShipmentsFilters) as GetShipmentsApiArg & {
      viewType: string;
    };
  const carrierList = useGetShippingCompaniesQuery(
    { page: 0, pageSize: 50 },
    { skip: !canViewShipments(user) },
  );
  const carrierItem = useGetShippingCompanyQuery(
    filters.shippingCompanyIdFilter,
    {
      skip:
        !canViewShipments(user) ||
        !filters.shippingCompanyIdFilter ||
        filters.shippingCompanyIdFilter === "all",
    },
  );
  const carrierChoices = [...(carrierList.currentData?.results || [])];
  if (
    carrierItem.currentData &&
    !carrierChoices.some((item) => item.id === carrierItem.currentData.id)
  )
    carrierChoices.push(carrierItem.currentData);
  const label = (option) =>
    option
      ? `${option.firstName || ""} ${option.lastName || ""} ${option.email || ""}`.trim()
      : "";
  const dropdown = (
    title: string,
    value: string,
    action,
    items: { label: string; value: string }[],
  ) => ({
    type: FilterTypes.dropdown as const,
    title: t(title),
    value,
    onChange: (value) => dispatch(action(value)),
    items: [{ label: t("ALL"), value: "all" }, ...items],
    closeOnChange: false,
  });
  const account = (
    title: string,
    value: string,
    action,
    url: string,
    getOptionLabel = label,
  ) => ({
    type: FilterTypes.autocomplete as const,
    title: t(title),
    value: value && value !== "all" ? value : null,
    onChange: (value) => dispatch(action(value)),
    getItemUrl: url.split("?")[0],
    getItemsUrl: url,
    getOptionLabel,
    closeOnChange: false,
  });
  const choices = (values, title) =>
    Object.values(values).map((value: string) => ({
      label: t(title(value)),
      value,
    }));
  return (
    <div className="flex flex-col gap-12 flex-1 w-full p-24 sm:p-32">
      <div className="flex flex-wrap items-center justify-between gap-16">
        <Typography
          component={motion.div}
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          className="text-24 md:text-32 font-bold"
        >
          {t("SHIPMENTS")}
        </Typography>
        <div className="flex items-center justify-end gap-8">
          {canCreateShipment(user) && (
            <Button
              className="whitespace-nowrap px-24"
              color="primary"
              component={Link}
              variant="contained"
              to={shipmentPath(
                filters.shippingCompanyIdFilter,
                filters.shippingTypeFilter,
                "new",
              )}
              data-testid="add-shipment"
              role="button"
              startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
            >
              {t("ADD_SHIPMENT")}
            </Button>
          )}
          {/* <Button
            color="primary"
            variant="outlined"
            onClick={() =>
              dispatch(
                setShipmentsViewType(
                  filters.viewType === "chart" ? "table" : "chart",
                ),
              )
            }
            data-testid="shipments-view-toggle"
          >
            {t(filters.viewType === "chart" ? "TABLE_VIEW" : "CHART_VIEW")}
          </Button> */}
          <FilterIcon
            componentProps={{
              "aria-label": t("FILTER_SHIPMENTS"),
              "data-testid": "shipments-filters",
              children: <FuseSvgIcon>heroicons-outline:filter</FuseSvgIcon>,
            }}
            filters={[
              {
                type: FilterTypes.dropdown,
                title: t("SHIPPING_COMPANY"),
                value: filters.shippingCompanyIdFilter,
                onChange: (value) =>
                  dispatch(setShipmentsShippingCompanyIdFilter(value)),
                items: [
                  { label: t("ALL"), value: "all" },
                  ...carrierChoices.map((item) => ({
                    label: item.name,
                    value: item.id,
                  })),
                ],
                closeOnChange: false,
              },
              ...(user.role !== "user"
                ? [
                    ...(fixedUserId
                      ? []
                      : [
                          account(
                            "MERCHANT",
                            filters.merchantIdFilter,
                            setShipmentsMerchantIdFilter,
                            "v1/users?type=user",
                          ),
                        ]),
                  ]
                : []),
              ...(user.role === "admin"
                ? [
                    account(
                      "UPDATED_BY",
                      filters.updatedByIdFilter,
                      setShipmentsUpdatedByIdFilter,
                      "v1/users?role=admin&role=employee",
                    ),
                  ]
                : []),
              account(
                "SENDER",
                filters.senderIdFilter,
                setShipmentsSenderIdFilter,
                "v1/shipping-users?type=sender",
                (option) => option.fullName || "",
              ),
              account(
                "RECEIVER",
                filters.receiverIdFilter,
                setShipmentsReceiverIdFilter,
                "v1/shipping-users?type=receiver",
                (option) => option.fullName || "",
              ),
              dropdown(
                "SHIPPING_TYPE",
                filters.shippingTypeFilter,
                setShipmentsShippingTypeFilter,
                choices(shippingFilterTypes, toShippingFilterTypeTitle),
              ),
              dropdown(
                "SHIPMENT_TYPE",
                filters.shipmentTypeFilter,
                setShipmentsShipmentTypeFilter,
                choices(shipmentTypes, toShipmentTypeTitle),
              ),
              {
                type: FilterTypes.multiChoice,
                title: t("STATUS"),
                value: filters.statusFilters,
                onChange: (value) => dispatch(setShipmentsStatusFilters(value)),
                items: choices(shipmentStatus, toShipmentStatusTitle),
                closeOnChange: false,
              },
              ...(user.role !== "user"
                ? [
                    {
                      type: FilterTypes.multiChoice as const,
                      title: t("PAYMENT_STATUS"),
                      value: filters.paymentStatusFilter,
                      onChange: (value) =>
                        dispatch(setShipmentsPaymentStatusFilter(value)),
                      items: choices(
                        shipmentPaymentStatus,
                        toShipmentPaymentStatusTitle,
                      ),
                      closeOnChange: false,
                    },
                    dropdown(
                      "CLOSED_INVOICE",
                      filters.closedInvoiceFilter,
                      setShipmentsClosedInvoiceFilter,
                      [
                        { label: t("YES"), value: "true" },
                        { label: t("NO"), value: "false" },
                      ],
                    ),
                  ]
                : []),
              dropdown(
                "RETURNED_SHIPMENT",
                filters.isReturnedFilter,
                setShipmentsIsReturnedFilter,
                [
                  { label: t("YES"), value: "true" },
                  { label: t("NO"), value: "false" },
                ],
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
                  dispatch(setShipmentsDateFromFilter(value)),
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
                onChange: (value) => dispatch(setShipmentsDateToFilter(value)),
                disableTime: true,
                closeOnChange: false,
              },
            ]}
          />
          {/* <Button
            color="primary"
            variant="outlined"
            onClick={() =>
              dispatch(
                newShipmentsInstance({
                  merchantIdFilter: fixedUserId || "",
                  shippingCompanyIdFilter: shippingCompanyId,
                  shippingTypeFilter: shippingType,
                  updatedByIdFilter:
                    user.role === "admin"
                      ? new URLSearchParams(location.search).get(
                          "updatedById",
                        ) || ""
                      : "",
                  statusFilters: new URLSearchParams(location.search).getAll(
                    "status",
                  ),
                  isReturnedFilter:
                    new URLSearchParams(location.search).get("isReturned") ||
                    "all",
                }),
              )
            }
          >
            {t("RESET_FILTERS")}
          </Button> */}
          <Paper className="flex items-center w-full sm:max-w-256 gap-8 px-16 rounded-8 border-1 shadow-0">
            <FuseSvgIcon color="disabled">heroicons-solid:search</FuseSvgIcon>
            <Input
              disableUnderline
              fullWidth
              value={filters.searchText}
              placeholder={t("SEARCH_SHIPMENTS")}
              onChange={(event) => dispatch(setShipmentsSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_SHIPMENTS"),
                "data-testid": "shipments-search",
              }}
            />
          </Paper>
        </div>
      </div>
      {(carrierList.isError || carrierItem.isError) && (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => {
                if (carrierList.isError) carrierList.refetch();
                if (carrierItem.isError) carrierItem.refetch();
              }}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("CARRIERS_LOAD_ERROR")}
        </Alert>
      )}
    </div>
  );
}
