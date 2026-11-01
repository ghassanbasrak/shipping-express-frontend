import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
} from "app/shared-components/feature-header/FeatureHeader";
import { IconButton, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import { Link, useNavigate, useParams } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import AlertDialog from "app/shared-components/alert-dialog/AlertDialog";
import { openDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { ShipmentUserFormValues } from "../models/ShipmentUserSchema";
import {
  shipmentUsersPath,
  toShipmentUserTypeTitle,
  toShipmentUserSaveValues,
} from "../Utils";
import {
  useCreateShipmentUserMutation,
  useUpdateShipmentUserMutation,
  useRemoveShipmentUserMutation,
} from "../ShipmentUsersApi";

export default function ShipmentUserHeader() {
  const { t } = useTranslation("shipmentUsersApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    navigate = useNavigate();
  const { type: routeType = "all" } = useParams();
  const { watch, handleSubmit, formState } =
    useFormContext<ShipmentUserFormValues>();
  const { id, type, fullName } = watch(),
    title = toShipmentUserTypeTitle(type);
  const [createShipmentUser, creating] = useCreateShipmentUserMutation(),
    [updateShipmentUser, updating] = useUpdateShipmentUserMutation(),
    [removeShipmentUser, removing] = useRemoveShipmentUserMutation();
  const canEdit = hasOperationPermission(
      "shipment-users",
      id ? "update" : "create",
      user,
    ),
    busy = creating.isLoading || updating.isLoading || removing.isLoading;
  const handleSaveShipmentUser = handleSubmit(async (values) => {
    if (!canEdit) return;
    try {
      const input = toShipmentUserSaveValues(values);
      await (
        id ? updateShipmentUser(input) : createShipmentUser(input)
      ).unwrap();
      dispatch(
        showMessage({
          message: t(`${title}_SAVED_SUCCESSFULLY`),
          variant: "success",
        }),
      );
      navigate(shipmentUsersPath(routeType));
    } catch {
      dispatch(
        showMessage({
          message: t(
            `SOMETHING_WENT_WRONG_WHEN_${id ? "SAVE" : "ADD"}_${title}`,
          ),
          variant: "error",
        }),
      );
    }
  });
  function handleRemoveShipmentUser() {
    if (!id || !hasOperationPermission("shipment-users", "delete", user))
      return;
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t(`REMOVE_${title}_TITLE`)}
            message={`${t(`REMOVE_${title}_MESSAGE`)} "${fullName}"`}
            onSubmit={async () => {
              try {
                await removeShipmentUser(id).unwrap();
                dispatch(
                  showMessage({
                    message: t(`${title}_REMOVED_SUCCESSFULLY`),
                    variant: "success",
                  }),
                );
                navigate(shipmentUsersPath(routeType));
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
    <FeatureHeader>
      <div className="flex items-center justify-between gap-8 min-w-0">
        <IconButton
          color="primary"
          component={Link}
          to={shipmentUsersPath(routeType)}
          aria-label={t("CLOSE")}
          data-testid="close-shipment-user"
        >
          <FuseSvgIcon>heroicons-outline:x</FuseSvgIcon>
        </IconButton>
      </div>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="shipment-users-app">
            {t(`${id ? "EDIT" : "ADD_NEW"}_${title}`)}
          </FeatureHeaderHeading>
          <div className="flex flex-wrap items-center gap-8 mt-8 sm:ps-[72px]">
            <Typography
              color="text.secondary"
              variant="caption"
              className="text-13 leading-relaxed [overflow-wrap:anywhere]"
            >
              {fullName}
            </Typography>
          </div>
        </div>
        <FeatureHeaderActions>
          {id && hasOperationPermission("shipment-users", "delete", user) && (
            <>
              <LoadingButton
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                variant="outlined"
                color="error"
                onClick={handleRemoveShipmentUser}
                loading={removing.isLoading}
                disabled={busy}
                data-testid="remove-shipment-user"
              >
                {t(`REMOVE_${title}`)}
              </LoadingButton>
            </>
          )}
          {canEdit && (
            <>
              <LoadingButton
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                variant="contained"
                color="secondary"
                onClick={() => handleSaveShipmentUser()}
                loading={creating.isLoading || updating.isLoading}
                disabled={busy || Boolean(id && !formState.isDirty)}
                data-testid="save-shipment-user"
                startIcon={<FuseSvgIcon>material-outline:save</FuseSvgIcon>}
              >
                {t(`${id ? "SAVE" : "ADD"}_${title}`)}
              </LoadingButton>
            </>
          )}
        </FeatureHeaderActions>
      </FeatureHeaderRow>
    </FeatureHeader>
  );
}
