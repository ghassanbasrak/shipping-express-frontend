import { useSelector } from "react-redux";
import { useState } from "react";
import { Alert, Button, Chip, Input, Paper, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector, useAppDispatch } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import StorageHeader from "../../storage-app/shared/StorageHeader";
import { hasActiveStorageSubscription } from "../../storage-app/Utils";
import { useGetStorageSubscriptionQuery } from "../StorageSubscriptionsApi";
import {
  selectSubscriptionFilters,
  setSubscriptionFilter,
  resetSubscriptionFilters,
} from "../store/storageSubscriptionsSlice";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { FeatureHeaderFilter } from "app/shared-components/feature-header/FeatureHeader";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import {
  storageSubscriptionOperation,
  storageSubscriptionStatus,
  toStorageSubscriptionStatusTitle,
} from "../Utils";
import AdminSubscriptionDialog from "./AdminSubscriptionDialog";
import Currency from "../../utils/currencyFormatter";
export default function StorageSubscriptionsHeader() {
  const user = useAppSelector(selectUser),
    filters = useSelector(selectSubscriptionFilters),
    dispatch = useAppDispatch(),
    { t } = useTranslation("storageApp"),
    [create, setCreate] = useState(false);
  const current = useGetStorageSubscriptionQuery(user.id, {
    skip: user.role !== "user",
    refetchOnMountOrArgChange: true,
  });
  const row = current.currentData,
    active = hasActiveStorageSubscription(row, user.id);
  return (
    <div className="w-full flex flex-col">
      <StorageHeader
        title={t("STORAGE_SUBSCRIPTIONS")}
        description={t("SUBSCRIPTIONS_HINT")}
        back={false}
        actions={
          user.role === "admin" ? (
            <Button
              color="primary"
              variant="contained"
              onClick={() => setCreate(true)}
            >
              {t("CREATE_SUBSCRIPTION")}
            </Button>
          ) : (
            <div className="flex gap-8 flex-wrap">
              {active ? (
                <>
                  <Button
                    component={Link}
                    to={
                      "/storage/subscribe?operation=" +
                      storageSubscriptionOperation.renew
                    }
                    color="primary"
                    variant="outlined"
                  >
                    {t("RENEW")}
                  </Button>
                  <Button
                    component={Link}
                    to={
                      "/storage/subscribe?operation=" +
                      storageSubscriptionOperation.upgrade
                    }
                    color="primary"
                    variant="contained"
                  >
                    {t("UPGRADE")}
                  </Button>
                </>
              ) : (
                <Button
                  component={Link}
                  to="/storage/subscribe"
                  color="primary"
                  variant="contained"
                >
                  {t("SUBSCRIBE_STORAGE")}
                </Button>
              )}
            </div>
          )
        }
        search={
          <Input
            disableUnderline
            fullWidth
            className="text-12 min-h-36"
            value={filters.searchText}
            placeholder={t("SEARCH")}
            inputProps={{
              "aria-label": t("SEARCH"),
              "data-testid": "storage-subscriptions-search",
            }}
            onChange={(e) =>
              dispatch(
                setSubscriptionFilter({
                  field: "searchText",
                  value: e.target.value,
                }),
              )
            }
          />
        }
        toolbar={
          <>
            <FeatureHeaderFilter
              badgeColor="primary"
              componentProps={{
                "data-testid": "storage-subscriptions-filters",
                "aria-label": t("FILTERS"),
              }}
              changesCount={filters.status ? 1 : 0}
              filters={[
                {
                  type: FilterTypes.dropdown,
                  title: t("STATUS"),
                  value: filters.status || "all",
                  onChange: (event) =>
                    dispatch(
                      setSubscriptionFilter({
                        field: "status",
                        value:
                          (event?.target?.value ?? event) === "all"
                            ? ""
                            : event?.target?.value ?? event,
                      }),
                    ),
                  items: [
                    { label: t("ALL"), value: "all" },
                    ...Object.values(storageSubscriptionStatus).map(
                      (value) => ({
                        value,
                        label: t(toStorageSubscriptionStatusTitle(value)),
                      }),
                    ),
                  ],
                },
              ]}
            />
            <Button
              color="primary"
              variant="outlined"
              size="small"
              startIcon={
                <FuseSvgIcon size={16}>heroicons-outline:refresh</FuseSvgIcon>
              }
              className="rounded-8 min-h-36 px-12 text-12 flex-1 sm:flex-initial whitespace-nowrap"
              data-testid="storage-subscriptions-reset-filters"
              onClick={() => dispatch(resetSubscriptionFilters())}
            >
              {t("RESET_FILTERS")}
            </Button>
          </>
        }
      />
      {user.role === "user" && (
        <div className="px-16 pb-16">
          {current.isError ? (
            <Alert
              severity="error"
              action={
                <Button onClick={() => current.refetch()}>{t("RETRY")}</Button>
              }
            >
              {t("LOAD_ERROR")}
            </Alert>
          ) : (
            active && (
              <Paper
                variant="outlined"
                className="rounded-16 p-20 flex flex-wrap items-center justify-between gap-20"
                sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}
              >
                <div>
                  <Typography className="text-12 opacity-80">
                    {t("CURRENT_SUBSCRIPTION")}
                  </Typography>
                  <Typography className="text-24 font-bold">
                    {row.plan.name}
                  </Typography>
                </div>
                <Chip color="success" label={t("SUBSCRIPTION_ACTIVE")} />
                <div>
                  <Typography className="text-12 opacity-80">
                    {t("STARTS_AT")}
                  </Typography>
                  <Typography>
                    {new Date(row.startsAt).toLocaleDateString()}
                  </Typography>
                </div>
                <div>
                  <Typography className="text-12 opacity-80">
                    {t("EXPIRES_AT")}
                  </Typography>
                  <Typography>
                    {new Date(row.endsAt).toLocaleDateString()}
                  </Typography>
                </div>
                <div>
                  <Typography className="text-12 opacity-80">
                    {t("PRICE")}
                  </Typography>
                  <Typography className="font-bold">
                    {Currency(row.price)}
                  </Typography>
                </div>
              </Paper>
            )
          )}
        </div>
      )}
      {create && <AdminSubscriptionDialog onClose={() => setCreate(false)} />}
    </div>
  );
}
