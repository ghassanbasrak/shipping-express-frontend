import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderToolbar,
  FeatureHeaderFilter,
} from "app/shared-components/feature-header/FeatureHeader";
import { Alert, Button, Input } from "@mui/material";

import { useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";

import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import {
  GetBankTransfersApiArg,
  useGetBankTransfersUserQuery,
} from "../BankTransfersApi";
import { bankTransferStatus, toBankTransferStatusTitle } from "../Utils";
import {
  selectBankTransfersFilters,
  setBankTransfersSearchText,
  setBankTransfersUserIdFilter,
  setBankTransfersStatusFilter,
  setBankTransfersDateFromFilter,
  setBankTransfersDateToFilter,
  newBankTransfersInstance,
  setBankTransfersUpdatedByIdFilter,
} from "../store/bankTransfersSlice";
export default function BankTransfersHeader() {
  const { t } = useTranslation("bankTransfersApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser);
  const { userId = "all" } = useParams(),
    location = useLocation();
  const filters = useSelector(
    selectBankTransfersFilters,
  ) as GetBankTransfersApiArg;
  const canView = hasOperationPermission("bank-transfers", "view", user);
  const selectedUser = useGetBankTransfersUserQuery(filters.userIdFilter, {
    skip:
      !canView ||
      user.role === "user" ||
      !filters.userIdFilter ||
      filters.userIdFilter === "all",
  });
  const label = (option) =>
    option
      ? `${option.firstName || ""} ${option.lastName || ""} ${option.email || ""}`.trim()
      : "";
  return (
    <FeatureHeader>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="bank-transfers-app">
            {selectedUser.currentData
              ? `${t("BANK_TRANSFERS_OF_MERCHANT")} "${label(selectedUser.currentData)}"`
              : t("BANK_TRANSFERS")}
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
              placeholder={t("SEARCH_BANK_TRANSFERS")}
              onChange={(event) => dispatch(setBankTransfersSearchText(event))}
              inputProps={{
                "aria-label": t("SEARCH_BANK_TRANSFERS"),
                "data-testid": "bank-transfers-search",
              }}
            />
          </>
        }
      >
        <FeatureHeaderFilter
          componentProps={{
            color: "primary",
            "aria-label": t("FILTER_REQUESTS"),
            "data-testid": "bank-transfers-filters",
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
                      dispatch(setBankTransfersUserIdFilter(value)),
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
                      dispatch(setBankTransfersUpdatedByIdFilter(value)),
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
                dispatch(setBankTransfersStatusFilter(value)),
              items: [
                { label: t("ALL"), value: "all" },
                ...Object.values(bankTransferStatus).map((value) => ({
                  label: t(toBankTransferStatusTitle(value)),
                  value,
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
              onChange: (value) =>
                dispatch(setBankTransfersDateFromFilter(value)),
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
                dispatch(setBankTransfersDateToFilter(value)),
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
              newBankTransfersInstance({
                userIdFilter: user.role === "user" ? "all" : userId,
                updatedByIdFilter:
                  new URLSearchParams(location.search).get("updatedById") || "",
              }),
            )
          }
        >
          {t("RESET_FILTERS")}
        </Button>
      </FeatureHeaderToolbar>
      {selectedUser.isError && (
        <>
          <Alert
            severity="error"
            action={
              <Button onClick={() => selectedUser.refetch()}>
                {t("RETRY")}
              </Button>
            }
          >
            {t("USER_LOOKUP_ERROR")}
          </Alert>
        </>
      )}
    </FeatureHeader>
  );
}
