import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
} from "app/shared-components/feature-header/FeatureHeader";
import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LoadingButton } from "@mui/lab";

import { Link, useNavigate } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import AlertDialog from "app/shared-components/alert-dialog/AlertDialog";
import { openDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import IAlert from "../models/IAlert";
import { toAlertSaveValues } from "../Utils";
import {
  useCreateAlertMutation,
  useUpdateAlertMutation,
  useRemoveAlertMutation,
} from "../AlertsApi";

export default function AlertHeader() {
  const { t } = useTranslation("alertsApp"),
    theme = useTheme(),
    dispatch = useAppDispatch(),
    navigate = useNavigate(),
    user = useAppSelector(selectUser);
  const { watch, handleSubmit, formState } = useFormContext<IAlert>();
  const { id, title } = watch();
  const [createAlert, creating] = useCreateAlertMutation(),
    [updateAlert, updating] = useUpdateAlertMutation(),
    [removeAlert, removing] = useRemoveAlertMutation();
  const canEdit = hasOperationPermission(
      "alerts",
      id ? "update" : "create",
      user,
    ),
    canRemove = hasOperationPermission("alerts", "delete", user);
  const busy = creating.isLoading || updating.isLoading || removing.isLoading;
  const handleSaveAlert = handleSubmit(async (values) => {
    if (!canEdit) return;
    try {
      const input = toAlertSaveValues(values);
      await (id ? updateAlert(input) : createAlert(input)).unwrap();
      dispatch(
        showMessage({
          message: t(
            id ? "ALERT_UPDATED_SUCCESSFULLY" : "ALERT_CREATED_SUCCESSFULLY",
          ),
          variant: "success",
        }),
      );
      navigate("/alerts");
    } catch {
      dispatch(
        showMessage({
          message: t(
            id
              ? "SOMETHING_WENT_WRONG_WHEN_UPDATE_ALERT"
              : "SOMETHING_WENT_WRONG_WHEN_CREATE_ALERT",
          ),
          variant: "error",
        }),
      );
    }
  });
  function handleRemoveAlert() {
    if (!id || !canRemove) return;
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t("REMOVE_ALERT_TITLE")}
            message={t("REMOVE_ALERT_MESSAGE")}
            onSubmit={async () => {
              try {
                await removeAlert(id).unwrap();
                dispatch(
                  showMessage({
                    message: t("ALERT_REMOVED_SUCCESSFULLY"),
                    variant: "success",
                  }),
                );
                navigate("/alerts");
              } catch {
                dispatch(
                  showMessage({
                    message: t("SOMETHING_WENT_WRONG_WHEN_REMOVE_ALERT"),
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
        <Typography
          className="flex items-center self-start gap-4 text-12 font-medium hover:underline"
          component={Link}
          to="/alerts"
          color="inherit"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "ltr"
              ? "heroicons-outline:arrow-sm-left"
              : "heroicons-outline:arrow-sm-right"}
          </FuseSvgIcon>
          <span className="flex mx-4 font-medium">{t("ALERTS")}</span>
        </Typography>
      </div>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="alerts-app">
            {t(id ? "EDIT_ALERT" : "ADD_NEW_ALERT")}
          </FeatureHeaderHeading>
          <div className="flex flex-wrap items-center gap-8 mt-8 sm:ps-[72px]">
            <Typography
              color="text.secondary"
              className="text-13 leading-relaxed [overflow-wrap:anywhere]"
              variant="caption"
            >
              {title}
            </Typography>
          </div>
        </div>
        <FeatureHeaderActions>
          {id && canRemove && (
            <>
              <LoadingButton
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                variant="outlined"
                color="error"
                onClick={handleRemoveAlert}
                loading={removing.isLoading}
                disabled={busy}
                data-testid="remove-alert"
              >
                {t("REMOVE")}
              </LoadingButton>
            </>
          )}
          {canEdit && (
            <>
              <LoadingButton
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                variant="contained"
                color="secondary"
                onClick={() => handleSaveAlert()}
                loading={creating.isLoading || updating.isLoading}
                disabled={busy || Boolean(id && !formState.isDirty)}
                data-testid="save-alert"
                startIcon={<FuseSvgIcon>material-outline:save</FuseSvgIcon>}
              >
                {t(id ? "SAVE_ALERT" : "ADD_ALERT")}
              </LoadingButton>
            </>
          )}
        </FeatureHeaderActions>
      </FeatureHeaderRow>
    </FeatureHeader>
  );
}
