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
import Icon from "app/shared-components/Icon";
import AlertDialog from "app/shared-components/alert-dialog/AlertDialog";
import { openDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import IAdmin from "../models/IAdmin";
import {
  useSetAdminBlockedMutation,
  useUpdateAdminMutation,
} from "../AdminsApi";

function AdminHeader() {
  const { t } = useTranslation("adminsApp");
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const { watch, handleSubmit, setValue, formState } = useFormContext<IAdmin>();
  const { id, firstName, lastName, isBlocked } = watch();

  const [updateAdmin, updating] = useUpdateAdminMutation();
  const [changeActive, toggling] = useSetAdminBlockedMutation();
  const canEdit = hasOperationPermission(
    "admins",
    id ? "update" : "create",
    user,
  );
  const busy = updating.isLoading || toggling.isLoading;

  const handleSaveAdmin = handleSubmit(async (values) => {
    if (!canEdit) return;
    const input = { id, role: values.role, features: values.features };
    try {
      await updateAdmin(input).unwrap();
      dispatch(
        showMessage({
          message: t("ADMIN_SAVED_SUCCESSFULLY"),
          variant: "success",
        }),
      );
      navigate("/admins");
    } catch {
      dispatch(
        showMessage({
          message: t(
            id
              ? "SOMETHING_WENT_WRONG_WHEN_SAVE_ADMIN"
              : "SOMETHING_WENT_WRONG_WHEN_ADD_ADMIN",
          ),
          variant: "error",
        }),
      );
    }
  });

  function handleChangeActive() {
    if (!hasOperationPermission("admins", "delete", user)) return;
    const nextActive = isBlocked;
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t(`${nextActive ? "ACTIVATE" : "DEACTIVATE"}_ADMIN_TITLE`)}
            message={`${t(`${nextActive ? "ACTIVATE" : "DEACTIVATE"}_ADMIN_MESSAGE`)} "${firstName || ""} ${lastName || ""}"`}
            onSubmit={async () => {
              try {
                await changeActive({ id, isBlocked: !nextActive }).unwrap();
                setValue("isBlocked", !nextActive, { shouldDirty: false });
                dispatch(
                  showMessage({
                    message: t(
                      `ADMIN_${nextActive ? "ACTIVATED" : "DEACTIVATED"}_SUCCESSFULLY`,
                    ),
                    variant: "success",
                  }),
                );
              } catch {
                dispatch(
                  showMessage({
                    message: t(
                      `SOMETHING_WENT_WRONG_WHEN_${nextActive ? "ACTIVATE" : "DEACTIVATE"}_ADMIN`,
                    ),
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
          role="button"
          to="/admins"
          color="inherit"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "ltr"
              ? "heroicons-outline:arrow-sm-left"
              : "heroicons-outline:arrow-sm-right"}
          </FuseSvgIcon>
          <span className="flex mx-4 font-medium">{t("ADMINS")}</span>
        </Typography>
      </div>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="admins-app">
            {t(id ? "EDIT_ADMIN" : "ADD_NEW_ADMIN")}
          </FeatureHeaderHeading>
          <div className="flex flex-wrap items-center gap-8 mt-8 sm:ps-[72px]">
            <Typography
              color="text.secondary"
              variant="caption"
              className="text-13 leading-relaxed [overflow-wrap:anywhere]"
            >
              {`${firstName || ""} ${lastName || ""}`}
            </Typography>
          </div>
        </div>
        <FeatureHeaderActions>
          {id && hasOperationPermission("admins", "delete", user) && (
            <>
              <LoadingButton
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                variant="outlined"
                color={!isBlocked ? "error" : "success"}
                onClick={handleChangeActive}
                loading={toggling.isLoading}
                disabled={busy}
                startIcon={
                  <Icon
                    type="fa6"
                    name={!isBlocked ? "FaRegCircleXmark" : "FaRegCircleCheck"}
                    size="1em"
                  />
                }
                data-testid="toggle-admin"
              >
                {t(!isBlocked ? "DEACTIVATE" : "ACTIVATE")}
              </LoadingButton>
            </>
          )}
          {canEdit && (
            <>
              <LoadingButton
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                variant="contained"
                color="secondary"
                onClick={() => handleSaveAdmin()}
                loading={updating.isLoading}
                disabled={busy || Boolean(id && !formState.isDirty)}
                loadingPosition="start"
                startIcon={<Icon type="fa6" name="FaFloppyDisk" size="0.8em" />}
                data-testid="save-admin"
              >
                {t(id ? "SAVE_ADMIN" : "ADD_ADMIN")}
              </LoadingButton>
            </>
          )}
        </FeatureHeaderActions>
      </FeatureHeaderRow>
    </FeatureHeader>
  );
}
export default AdminHeader;
