import { Alert, Button, Input, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import FilterIcon from "app/shared-components/filter-icon/FilterIcon";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import {
  GetCancelShipmentRequestsApiArg,
  useGetCancelShipmentRequestsUserQuery,
} from "../CancelShipmentRequestsApi";
import {
  cancelShipmentRequestStatus,
  toCancelShipmentRequestStatusTitle,
  toCancelShipmentRequestStatusColor,
} from "../Utils";
import {
  selectCancelShipmentRequestsFilters,
  setCancelShipmentRequestsSearchText,
  setCancelShipmentRequestsUserIdFilter,
  setCancelShipmentRequestsStatusFilter,
  setCancelShipmentRequestsDateFromFilter,
  setCancelShipmentRequestsDateToFilter,
  newCancelShipmentRequestsInstance,
  setCancelShipmentRequestsUpdatedByIdFilter,
} from "../store/cancelShipmentRequestsSlice";
export default function CancelShipmentRequestsHeader() {
  const { t } = useTranslation("cancelShipmentRequestsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser);
  const { userId = "all" } = useParams(),
    location = useLocation();
  const filters = useSelector(
    selectCancelShipmentRequestsFilters,
  ) as GetCancelShipmentRequestsApiArg;
  const canView = hasOperationPermission(
    "cancel-shipment-requests",
    "view",
    user,
  );
  const selectedUser = useGetCancelShipmentRequestsUserQuery(
    filters.userIdFilter,
    {
      skip:
        !canView ||
        user.role === "user" ||
        !filters.userIdFilter ||
        filters.userIdFilter === "all",
    },
  );
  const label = (option) =>
    option
      ? `${option.firstName || ""} ${option.lastName || ""} ${option.email || ""}`.trim()
      : "";
  return (
    <div className="flex flex-col gap-12 flex-1 w-full p-24 sm:p-32">
      <div className="flex flex-wrap items-center justify-between gap-16">
        <Typography
          component={motion.div}
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          className="text-24 md:text-32 font-bold"
        >
          {selectedUser.currentData
            ? `${t("CANCEL_SHIPMENT_REQUESTS_OF_MERCHANT")} "${label(selectedUser.currentData)}"`
            : t("CANCEL_SHIPMENT_REQUESTS")}
        </Typography>
        <div className="flex flex-wrap items-center justify-end gap-8">
          <FilterIcon
            componentProps={{
              color: "primary",
              "aria-label": t("FILTER_REQUESTS"),
              "data-testid": "cancel-shipment-requests-filters",
              children: <FuseSvgIcon>heroicons-outline:filter</FuseSvgIcon>,
            }}
            filters={[
              ...(user.role !== "user"
                ? [
                    {
                      type: FilterTypes.autocomplete as const,
                      title: t("MERCHANT"),
                      placeholder: t("SELECT_SINGLE_MERCHANT"),
                      value:
                        filters.userIdFilter === "all"
                          ? null
                          : filters.userIdFilter,
                      onChange: (value) =>
                        dispatch(setCancelShipmentRequestsUserIdFilter(value)),
                      getItemUrl: "v1/users",
                      getItemsUrl: "v1/users?type=user",
                      getOptionLabel: label,
                      closeOnChange: false,
                    },
                  ]
                : []),
              ...(user.role === "admin"
                ? [
                    {
                      type: FilterTypes.autocomplete as const,
                      title: t("UPDATED_BY"),
                      placeholder: t("SELECT_SINGLE_EMPLOYEE"),
                      value: filters.updatedByIdFilter || null,
                      onChange: (value) =>
                        dispatch(
                          setCancelShipmentRequestsUpdatedByIdFilter(value),
                        ),
                      getItemUrl: "v1/users",
                      getItemsUrl: "v1/users?role=admin&role=employee",
                      getOptionLabel: label,
                      closeOnChange: false,
                    },
                  ]
                : []),
              {
                type: FilterTypes.dropdown,
                title: t("STATUS"),
                value: filters.statusFilter,
                onChange: (value) =>
                  dispatch(setCancelShipmentRequestsStatusFilter(value)),
                items: [
                  { label: t("ALL"), value: "all" },
                  ...Object.values(cancelShipmentRequestStatus).map(
                    (value) => ({
                      label: t(toCancelShipmentRequestStatusTitle(value)),
                      value,
                    }),
                  ),
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
                onChange: (value) =>
                  dispatch(setCancelShipmentRequestsDateFromFilter(value)),
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
                  dispatch(setCancelShipmentRequestsDateToFilter(value)),
                disableTime: true,
                closeOnChange: false,
              },
            ]}
          />
          <Button
            color="primary"
            variant="outlined"
            onClick={() =>
              dispatch(
                newCancelShipmentRequestsInstance({
                  userIdFilter: user.role === "user" ? "all" : userId,
                  updatedByIdFilter:
                    new URLSearchParams(location.search).get("updatedById") ||
                    "",
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
              placeholder={t("SEARCH_CANCEL_SHIPMENT_REQUESTS")}
              onChange={(event) =>
                dispatch(setCancelShipmentRequestsSearchText(event))
              }
              inputProps={{
                "aria-label": t("SEARCH_CANCEL_SHIPMENT_REQUESTS"),
                "data-testid": "cancel-shipment-requests-search",
              }}
            />
          </Paper>
        </div>
      </div>
      {selectedUser.isError && (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => selectedUser.refetch()}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("USER_LOOKUP_ERROR")}
        </Alert>
      )}
    </div>
  );
}
