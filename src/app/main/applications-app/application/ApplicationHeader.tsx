import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LoadingButton } from "@mui/lab";
import { Button } from "@mui/material";
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
import { displayName } from "../../countries-app/Utils";
import { toApplicationSaveValues } from "../Utils";
import IApplication from "../models/IApplication";
import {
  useCreateApplicationMutation,
  useUpdateApplicationMutation,
  useRemoveApplicationMutation,
} from "../ApplicationsApi";
import ApplicationApiDetails from "../shared-components/ApplicationApiDetails";
export default function ApplicationHeader() {
  const { t } = useTranslation("applicationsApp"),
    theme = useTheme(),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    navigate = useNavigate();
  const { watch, handleSubmit, formState } = useFormContext<IApplication>(),
    values = watch(),
    { id, name, apiKey } = values;
  const [createApplication, creating] = useCreateApplicationMutation(),
    [updateApplication, updating] = useUpdateApplicationMutation(),
    [removeApplication, removing] = useRemoveApplicationMutation();
  const canView = hasOperationPermission("applications", "view", user),
    canEdit =
      canView &&
      hasOperationPermission("applications", id ? "update" : "create", user),
    busy = creating.isLoading || updating.isLoading || removing.isLoading;
  const submit = handleSubmit(async (data) => {
    if (!canEdit || busy) return;
    try {
      const input = toApplicationSaveValues(data);
      await (id ? updateApplication(input) : createApplication(input)).unwrap();
      dispatch(
        showMessage({
          message: t(
            id
              ? "APPLICATION_UPDATED_SUCCESSFULLY"
              : "APPLICATION_CREATED_SUCCESSFULLY",
          ),
          variant: "success",
        }),
      );
      navigate("/applications");
    } catch {
      dispatch(
        showMessage({
          message: t(
            id
              ? "SOMETHING_WENT_WRONG_WHEN_UPDATE_APPLICATION"
              : "SOMETHING_WENT_WRONG_WHEN_CREATE_APPLICATION",
          ),
          variant: "error",
        }),
      );
    }
  });
  function remove() {
    if (
      !id ||
      !canView ||
      !hasOperationPermission("applications", "delete", user) ||
      busy
    )
      return;
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t("REMOVE_APPLICATION_TITLE")}
            message={`${t("REMOVE_APPLICATION_MESSAGE")} "${displayName(name)}"`}
            onSubmit={async () => {
              try {
                await removeApplication(id).unwrap();
                dispatch(
                  showMessage({
                    message: t("APPLICATION_REMOVED_SUCCESSFULLY"),
                    variant: "success",
                  }),
                );
                navigate("/applications");
              } catch {
                dispatch(
                  showMessage({
                    message: t("SOMETHING_WENT_WRONG_WHEN_REMOVE_APPLICATION"),
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
    <div className="flex flex-col sm:flex-row gap-16 flex-1 w-full items-center justify-between py-24 sm:py-32 px-24 md:px-32">
      <div className="flex flex-col items-start gap-8 min-w-0">
        <Typography
          component={Link}
          to="/applications"
          color="inherit"
          className="flex items-center"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "ltr"
              ? "heroicons-outline:arrow-sm-left"
              : "heroicons-outline:arrow-sm-right"}
          </FuseSvgIcon>
          <span className="mx-4 font-medium">{t("APPLICATIONS")}</span>
        </Typography>
        <Typography className="text-20 font-semibold">
          {t(id ? "EDIT_APPLICATION" : "ADD_NEW_APPLICATION")}
        </Typography>
        <Typography variant="caption">{displayName(name)}</Typography>
      </div>
      <motion.div
        className="flex flex-wrap justify-end gap-8"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {id &&
          canView &&
          hasOperationPermission("applications", "delete", user) && (
            <LoadingButton
              variant="outlined"
              color="error"
              onClick={remove}
              loading={removing.isLoading}
              disabled={busy}
              data-testid="remove-application"
            >
              {t("REMOVE")}
            </LoadingButton>
          )}
        {id && apiKey && canView && (
          <Button
            variant="contained"
            color="info"
            data-testid="application-api-key"
            onClick={() =>
              dispatch(
                openDialog({
                  maxWidth: "md",
                  fullWidth: true,
                  children: <ApplicationApiDetails apiKey={apiKey} />,
                }),
              )
            }
          >
            {t("API_KEY")}
          </Button>
        )}
        {canEdit && (
          <LoadingButton
            variant="contained"
            color="secondary"
            loading={creating.isLoading || updating.isLoading}
            disabled={busy || Boolean(id && !formState.isDirty)}
            onClick={() => submit()}
            data-testid="save-application"
            startIcon={<FuseSvgIcon>material-outline:save</FuseSvgIcon>}
          >
            {t(id ? "SAVE_APPLICATION" : "ADD_APPLICATION")}
          </LoadingButton>
        )}
      </motion.div>
    </div>
  );
}
