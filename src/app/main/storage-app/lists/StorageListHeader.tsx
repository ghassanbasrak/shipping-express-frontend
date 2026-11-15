import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { FeatureHeaderFilter } from "app/shared-components/feature-header/FeatureHeader";
import { FilterTypes } from "app/shared-components/filter-icon/Utils";
import { useGetWarehousesQuery } from "../StorageApi";
import { supplyStatuses, toSupplyStatusTitle } from "../Utils";
import { useSelector } from "react-redux";
import { Button, Input } from "@mui/material";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  selectStorageLists,
  setStorageFilter,
  resetStorageList,
} from "../store/storageSlice";
import { canManageStorage } from "../Utils";
import StorageHeader from "../shared/StorageHeader";
export type StorageListKind = "warehouses" | "plans" | "supplies" | "products";
export const listTitles = {
  warehouses: "WAREHOUSES",
  plans: "STORAGE_PLANS",
  supplies: "SUPPLY_REQUESTS",
  products: "STORAGE_PRODUCTS",
};
export const listPaths = {
  warehouses: "/storage/warehouses",
  plans: "/storage/plans",
  supplies: "/storage/supply-requests",
  products: "/storage/products",
};
export default function StorageListHeader({ kind }: { kind: StorageListKind }) {
  const { t } = useTranslation("storageApp"),
    user = useAppSelector(selectUser),
    dispatch = useAppDispatch(),
    filters = useSelector(selectStorageLists)[kind];
  const [params, setParams] = useSearchParams();
  const warehouses = useGetWarehousesQuery(
    { admin: user.role === "admin" },
    { skip: kind !== "products" && kind !== "supplies" },
  );
  const create =
    kind === "supplies"
      ? user.role === "user"
      : kind !== "products" && canManageStorage(user, "create");
  return (
    <StorageHeader
      title={t(listTitles[kind])}
      description={t(
        kind === "products"
          ? "INVENTORY_HINT"
          : kind === "supplies"
            ? "SUPPLIES_HINT"
            : "MANAGEMENT_HINT",
      )}
      actions={
        create && (
          <Button
            component={Link}
            to={listPaths[kind] + "/new"}
            color="primary"
            variant="contained"
            data-testid={"new-storage-" + kind}
          >
            {t("ADD_NEW")}
          </Button>
        )
      }
      search={
        <Input
          disableUnderline
          fullWidth
          className="text-12 min-h-36"
          placeholder={t("SEARCH")}
          inputProps={{
            "aria-label": t("SEARCH"),
            "data-testid": "storage-search",
          }}
          value={filters.searchText}
          onChange={(event) =>
            dispatch(
              setStorageFilter({
                list: kind,
                field: "searchText",
                value: event.target.value,
              }),
            )
          }
        />
      }
      toolbar={
        kind === "products" || kind === "supplies" ? (
          <>
            <FeatureHeaderFilter
              changesCount={
                Number(!!filters.warehouseId) + Number(!!filters.status)
              }
              badgeColor="primary"
              componentProps={{
                "data-testid": "storage-filters",
                "aria-label": t("FILTERS"),
              }}
              filters={[
                {
                  type: FilterTypes.dropdown,
                  title: t("WAREHOUSE"),
                  value: filters.warehouseId || "all",
                  items: [
                    { label: t("ALL"), value: "all" },
                    ...(warehouses.currentData || []).map((w) => ({
                      label: w.name,
                      value: w.id,
                    })),
                  ],
                  onChange: (event) => {
                    const selected = event?.target?.value ?? event;
                    const value = selected === "all" ? "" : selected;
                    const next = new URLSearchParams(params);
                    if (value) next.set("warehouseId", value);
                    else next.delete("warehouseId");
                    setParams(next);
                    dispatch(
                      setStorageFilter({
                        list: kind,
                        field: "warehouseId",
                        value,
                      }),
                    );
                  },
                  closeOnChange: false,
                },
                ...(kind === "supplies"
                  ? [
                      {
                        type: FilterTypes.dropdown as const,
                        title: t("STATUS"),
                        value: filters.status || "all",
                        items: [
                          { label: t("ALL"), value: "all" },
                          ...Object.values(supplyStatuses).map((value) => ({
                            label: t(toSupplyStatusTitle(value)),
                            value,
                          })),
                        ],
                        onChange: (event) =>
                          dispatch(
                            setStorageFilter({
                              list: kind,
                              field: "status",
                              value:
                                (event?.target?.value ?? event) === "all"
                                  ? ""
                                  : event?.target?.value ?? event,
                            }),
                          ),
                        closeOnChange: false,
                      },
                    ]
                  : []),
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
              data-testid="storage-reset-filters"
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete("warehouseId");
                next.delete("productId");
                setParams(next);
                dispatch(resetStorageList(kind));
              }}
            >
              {t("RESET_FILTERS")}
            </Button>
            {warehouses.isError && (
              <Button onClick={() => warehouses.refetch()}>{t("RETRY")}</Button>
            )}
          </>
        ) : undefined
      }
    />
  );
}
