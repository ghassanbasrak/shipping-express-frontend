import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Button } from "@mui/material";
import CustomGrid from "app/shared-components/custom-grid/CustomGrid";
import AlertDialog from "app/shared-components/alert-dialog/AlertDialog";
import { openDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import {
  GetShipmentUsersApiArg,
  useGetShipmentUsersQuery,
  useRemoveShipmentUserMutation,
} from "../ShipmentUsersApi";
import {
  newShipmentUsersInstance,
  resetShipmentUsers,
  selectShipmentUsersFilters,
  setShipmentUsersPage,
  setShipmentUsersPageSize,
} from "../store/shipmentUsersSlice";
import IShipmentUser from "../models/IShipmentUser";
import { shipmentUsersPath, toShipmentUserTypeTitle } from "../Utils";
import ShipmentUserCard from "./ShipmentUserCard";

export default function ShipmentUsers({
  rightSidebarOpen = false,
}: {
  rightSidebarOpen?: boolean;
}) {
  const { type = "all", shipmentUserId } = useParams();
  const { t } = useTranslation("shipmentUsersApp"),
    dispatch = useAppDispatch(),
    navigate = useNavigate(),
    user = useAppSelector(selectUser);
  const filters = useSelector(
    selectShipmentUsersFilters,
  ) as GetShipmentUsersApiArg;
  const [ready, setReady] = useState<string>();
  useEffect(() => {
    dispatch(newShipmentUsersInstance({ typeFilter: type }));
    setReady(type);
  }, [dispatch, type]);
  useEffect(
    () => () => {
      dispatch(resetShipmentUsers(null));
    },
    [dispatch],
  );
  const { data, currentData, isFetching, isError, refetch } =
    useGetShipmentUsersQuery(filters, {
      skip: ready !== type,
      refetchOnMountOrArgChange: true,
    });
  const [removeShipmentUser, removing] = useRemoveShipmentUserMutation();
  useEffect(() => {
    if (!currentData || isFetching) return;
    const lastPage = Math.max(
      0,
      Math.ceil(currentData.total / filters.pageSize) - 1,
    );
    if (filters.page > lastPage) dispatch(setShipmentUsersPage(lastPage));
  }, [currentData, isFetching, filters.page, filters.pageSize, dispatch]);
  function handleRemoveShipmentUser(row: IShipmentUser) {
    if (!hasOperationPermission("shipment-users", "delete", user)) return;
    const title = toShipmentUserTypeTitle(row.type);
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t(`REMOVE_${title}_TITLE`)}
            message={`${t(`REMOVE_${title}_MESSAGE`)} "${row.fullName}"`}
            onSubmit={async () => {
              try {
                await removeShipmentUser(row.id).unwrap();
                dispatch(
                  showMessage({
                    message: t(`${title}_REMOVED_SUCCESSFULLY`),
                    variant: "success",
                  }),
                );
                if (shipmentUserId === row.id)
                  navigate(shipmentUsersPath(type));
              } catch {
                dispatch(
                  showMessage({
                    message: t(`SOMETHING_WENT_WRONG_WHEN_REMOVE_${title}`),
                    variant: "error",
                  }),
                );
              }
            }}
          />
        ),
      }),
    );
  }
  return (
    <div className="flex flex-col flex-1 w-full">
      {isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <CustomGrid<IShipmentUser>
        data={data?.results || []}
        total={data?.total || 0}
        page={filters.page}
        pageSize={filters.pageSize}
        gridMdColumns={rightSidebarOpen ? 2 : 3}
        gridLgColumns={rightSidebarOpen ? 3 : 4}
        status={
          isError
            ? FetchStatus.error
            : ready !== type || isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        noDataMessage={t("NO_SHIPMENT_USERS")}
        affectedMemoVars={[
          rightSidebarOpen,
          removing.isLoading,
          removing.originalArgs,
          user,
          t,
          type,
        ]}
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setShipmentUsersPageSize(pageSize));
          else dispatch(setShipmentUsersPage(page));
        }}
        renderGridItem={(row) => (
          <ShipmentUserCard
            shipmentUser={row}
            handleRemoveItem={handleRemoveShipmentUser}
            loadingRemove={
              removing.isLoading && removing.originalArgs === row.id
            }
          />
        )}
      />
    </div>
  );
}
