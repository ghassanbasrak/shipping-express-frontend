import { useSelector } from "react-redux";
import { Button, InputBase } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { selectStorageLists, setStorageFilter } from "../store/storageSlice";
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
      toolbar={
        <InputBase
          className="w-full px-8"
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
    />
  );
}
