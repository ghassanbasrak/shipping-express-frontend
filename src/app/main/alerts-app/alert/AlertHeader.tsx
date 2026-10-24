import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LoadingButton } from "@mui/lab";
import { motion } from "framer-motion";
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
    <div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between space-y-8 sm:space-y-0 py-24 sm:py-32 px-24 md:px-32">
      <div className="flex flex-col items-start space-y-8 sm:space-y-0 w-full min-w-0">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1, transition: { delay: 0.3 } }}
        >
          <Typography
            className="flex items-center sm:mb-12"
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
        </motion.div>
        <motion.div
          className="flex flex-col min-w-0 mx-8 sm:mx-16"
          initial={{ x: -20 }}
          animate={{ x: 0, transition: { delay: 0.3 } }}
        >
          <Typography className="text-16 sm:text-20 truncate font-semibold">
            {t(id ? "EDIT_ALERT" : "ADD_NEW_ALERT")}
          </Typography>
          <Typography variant="caption">{title}</Typography>
        </motion.div>
      </div>
      <motion.div
        className="flex gap-8"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }}
      >
        {id && canRemove && (
          <LoadingButton
            className="whitespace-nowrap mx-4"
            variant="outlined"
            color="error"
            onClick={handleRemoveAlert}
            loading={removing.isLoading}
            disabled={busy}
            data-testid="remove-alert"
          >
            {t("REMOVE")}
          </LoadingButton>
        )}
        {canEdit && (
          <LoadingButton
            className="whitespace-nowrap mx-4"
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
        )}
      </motion.div>
    </div>
  );
}
