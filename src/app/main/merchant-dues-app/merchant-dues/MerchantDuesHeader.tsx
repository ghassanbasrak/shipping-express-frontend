import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
  FeatureHeaderToolbar,
  FeatureHeaderFilter,
} from "app/shared-components/feature-header/FeatureHeader";
import {
  useGetShippingCompaniesQuery,
  useGetShippingCompanyQuery,
} from "../../shipping-companies-app/ShippingCompaniesApi";
import { Alert, Button, Chip, Input } from "@mui/material";

import { useLocation, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";

import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import Currency from "src/app/main/utils/currencyFormatter";
import {
  GetMerchantDuesApiArg,
  useGetMerchantDuesUserQuery,
  useGetMerchantDuesSummaryQuery,
} from "../MerchantDuesApi";
import {
  canViewMerchantDues,
  shipmentStatus,
  shipmentPaymentStatus,
  toShipmentStatusTitle,
  toShipmentPaymentStatusTitle,
} from "../Utils";
import {
  selectMerchantDuesFilters,
  newMerchantDuesInstance,
  setMerchantDuesSearchText,
  setMerchantDuesShippingCompanyIdFilter,
  setMerchantDuesUserIdFilter,
  setMerchantDuesUpdatedByIdFilter,
  setMerchantDuesShipmentReceiverIdFilter,
  setMerchantDuesShipmentStatusFilters,
  setMerchantDuesShipmentPaymentStatusFilter,
  setMerchantDuesDateFromFilter,
  setMerchantDuesDateToFilter,
} from "../store/merchantDuesSlice";
export default function MerchantDuesHeader({
  fixedUserId,
}: { fixedUserId?: string } = {}) {
  const { t } = useTranslation("merchantDuesApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    { shippingCompanyId = "all", userId = fixedUserId || "all" } = useParams(),
    location = useLocation(),
    filters = useSelector(selectMerchantDuesFilters) as GetMerchantDuesApiArg;
  const key = `${shippingCompanyId}/${userId}/${user.id}/${user.role}/${location.search}`,
    canView = canViewMerchantDues(user),
    label = (option) =>
      option
        ? `${option.firstName || ""} ${option.lastName || ""} ${option.email || ""}`.trim()
        : "";
  const carrierList = useGetShippingCompaniesQuery(
    { page: 0, pageSize: 50 },
    { skip: !canView },
  );
  const carrierItem = useGetShippingCompanyQuery(
    filters.shippingCompanyIdFilter,
    {
      skip:
        !canView ||
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
  const selected = useGetMerchantDuesUserQuery(filters.userIdFilter, {
    skip:
      !canView ||
      user.role === "user" ||
      !filters.userIdFilter ||
      filters.userIdFilter === "all",
  });
  const summary = useGetMerchantDuesSummaryQuery(
    {
      shippingCompanyIdFilter: filters.shippingCompanyIdFilter,
      userIdFilter:
        user.role === "user" ? "all" : fixedUserId || filters.userIdFilter,
      shipmentReceiverIdFilter:
        user.role === "user" ? filters.shipmentReceiverIdFilter : "",
    },
    {
      skip: !canView || filters.instanceKey !== key,
      refetchOnMountOrArgChange: true,
    },
  );
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
  return (
    <FeatureHeader>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="merchant-dues-app">
            {selected.currentData
              ? `${t("MERCHANT_DUES_OF_MERCHANT")} "${label(selected.currentData)}"`
              : t("MERCHANT_DUES")}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          {summary.isError ? (
            <Alert
              severity="error"
              action={
                <Button onClick={() => summary.refetch()}>{t("RETRY")}</Button>
              }
            >
              {t("SUMMARY_LOAD_ERROR")}
            </Alert>
          ) : summary.currentData ? (
            <div
              className="flex flex-wrap gap-8"
              data-testid="merchant-dues-summary"
            >
              {(
                [
                  ["canceledDues", "CANCELED_DUES", "error"],
                  ["pendingDues", "PENDING_DUES", "secondary"],
                  ["settledDues", "SETTLED_DUES", "success"],
                ] as const
              ).map(([field, title, color]) => (
                <Chip
                  key={field}
                  label={`${t(title)}: ${Currency(summary.currentData[field] ?? 0)}`}
                  color={color}
                />
              ))}
            </div>
          ) : null}
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
              placeholder={t("SEARCH_MERCHANT_DUES")}
              onChange={(event) => dispatch(setMerchantDuesSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_MERCHANT_DUES"),
                "data-testid": "merchant-dues-search",
              }}
            />
          </>
        }
      >
        <FeatureHeaderFilter
          componentProps={{
            "aria-label": t("FILTER_DUES"),
            "data-testid": "merchant-dues-filters",
            children: <FuseSvgIcon>heroicons-outline:filter</FuseSvgIcon>,
          }}
          filters={[
            {
              type: FilterTypes.dropdown,
              title: t("SHIPPING_COMPANY"),
              value: filters.shippingCompanyIdFilter,
              onChange: (value) =>
                dispatch(setMerchantDuesShippingCompanyIdFilter(value)),
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
                          filters.userIdFilter,
                          setMerchantDuesUserIdFilter,
                          "v1/users?type=user",
                        ),
                      ]),
                ]
              : [
                  account(
                    "RECEIVER",
                    filters.shipmentReceiverIdFilter,
                    setMerchantDuesShipmentReceiverIdFilter,
                    "v1/shipping-users?type=receiver",
                    (option) => option.fullName || "",
                  ),
                ]),
            ...(user.role === "admin"
              ? [
                  account(
                    "UPDATED_BY",
                    filters.updatedByIdFilter,
                    setMerchantDuesUpdatedByIdFilter,
                    "v1/users?role=admin&role=employee",
                  ),
                ]
              : []),
            {
              type: FilterTypes.multiChoice,
              title: t("SHIPMENT_STATUS"),
              value: filters.shipmentStatusFilters,
              onChange: (value) =>
                dispatch(setMerchantDuesShipmentStatusFilters(value)),
              items: Object.values(shipmentStatus).map((value) => ({
                value,
                label: t(toShipmentStatusTitle(value)),
              })),
              closeOnChange: false,
            },
            {
              type: FilterTypes.multiChoice,
              title: t("PAYMENT_STATUS"),
              value: filters.shipmentPaymentStatusFilter,
              onChange: (value) =>
                dispatch(setMerchantDuesShipmentPaymentStatusFilter(value)),
              items: Object.values(shipmentPaymentStatus).map((value) => ({
                value,
                label: t(toShipmentPaymentStatusTitle(value)),
              })),
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
              onChange: (value) =>
                dispatch(setMerchantDuesDateFromFilter(value)),
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
              onChange: (value) => dispatch(setMerchantDuesDateToFilter(value)),
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
              newMerchantDuesInstance({
                instanceKey: key,
                shippingCompanyIdFilter: shippingCompanyId,
                userIdFilter: user.role === "user" ? "all" : userId,
                updatedByIdFilter:
                  user.role === "admin"
                    ? new URLSearchParams(location.search).get("updatedById") ||
                      ""
                    : "",
              }),
            )
          }
        >
          {t("RESET_FILTERS")}
        </Button>
      </FeatureHeaderToolbar>
      {selected.isError && (
        <>
          <Alert
            severity="error"
            action={
              <Button onClick={() => selected.refetch()}>{t("RETRY")}</Button>
            }
          >
            {t("USER_LOOKUP_ERROR")}
          </Alert>
        </>
      )}
      {(carrierList.isError || carrierItem.isError) && (
        <>
          <Alert
            severity="error"
            action={
              <Button
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
        </>
      )}
    </FeatureHeader>
  );
}
