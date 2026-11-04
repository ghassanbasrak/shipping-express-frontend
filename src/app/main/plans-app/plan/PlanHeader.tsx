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
import { PlanFormValues } from "../models/PlanSchema";
import { planStatus, toPlanSaveValues } from "../Utils";
import { useCreatePlanMutation, useUpdatePlanMutation } from "../PlansApi";

function PlanHeader() {
  const { t } = useTranslation("plansApp");
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const { watch, handleSubmit, setValue, formState } =
    useFormContext<PlanFormValues>();
  const { id, name, status } = watch();
  const [createPlan, creating] = useCreatePlanMutation();
  const [updatePlan, updating] = useUpdatePlanMutation();
  const [changeActive, toggling] = useUpdatePlanMutation();
  const canEdit = hasOperationPermission(
    "plans",
    id ? "update" : "create",
    user,
  );
  const busy = creating.isLoading || updating.isLoading || toggling.isLoading;

  const handleSavePlan = handleSubmit(async (values) => {
    if (!canEdit) return;
    const input = toPlanSaveValues(values);
    try {
      await (id ? updatePlan(input) : createPlan(input)).unwrap();
      dispatch(
        showMessage({
          message: t("PLAN_SAVED_SUCCESSFULLY"),
          variant: "success",
        }),
      );
      navigate("/plans");
    } catch {
      dispatch(
        showMessage({
          message: t(
            id
              ? "SOMETHING_WENT_WRONG_WHEN_SAVE_PLAN"
              : "SOMETHING_WENT_WRONG_WHEN_ADD_PLAN",
          ),
          variant: "error",
        }),
      );
    }
  });

  function handleChangeActive() {
    if (!hasOperationPermission("plans", "update", user)) return;
    const nextActive = status !== planStatus.active;
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t(`${nextActive ? "ACTIVATE" : "DEACTIVATE"}_PLAN_TITLE`)}
            message={`${t(`${nextActive ? "ACTIVATE" : "DEACTIVATE"}_PLAN_MESSAGE`)} "${name}"`}
            onSubmit={async () => {
              try {
                await changeActive({
                  id,
                  status: nextActive ? planStatus.active : planStatus.disabled,
                }).unwrap();
                setValue(
                  "status",
                  nextActive ? planStatus.active : planStatus.disabled,
                  { shouldDirty: false },
                );
                dispatch(
                  showMessage({
                    message: t(
                      `PLAN_${nextActive ? "ACTIVATED" : "DEACTIVATED"}_SUCCESSFULLY`,
                    ),
                    variant: "success",
                  }),
                );
              } catch {
                dispatch(
                  showMessage({
                    message: t(
                      `SOMETHING_WENT_WRONG_WHEN_${nextActive ? "ACTIVATE" : "DEACTIVATE"}_PLAN`,
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
          to="/plans"
          color="inherit"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "ltr"
              ? "heroicons-outline:arrow-sm-left"
              : "heroicons-outline:arrow-sm-right"}
          </FuseSvgIcon>
          <span className="flex mx-4 font-medium">{t("PLANS")}</span>
        </Typography>
      </div>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="plans-app">
            {t(id ? "EDIT_PLAN" : "ADD_NEW_PLAN")}
          </FeatureHeaderHeading>
          <div className="flex flex-wrap items-center gap-8 mt-8 sm:ps-[72px]">
            <Typography
              color="text.secondary"
              variant="caption"
              className="text-13 leading-relaxed [overflow-wrap:anywhere]"
            >
              {name}
            </Typography>
          </div>
        </div>
        <FeatureHeaderActions>
          {id && canEdit && (
            <>
              <LoadingButton
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                variant="outlined"
                color={status === planStatus.active ? "error" : "success"}
                onClick={handleChangeActive}
                loading={toggling.isLoading}
                disabled={busy}
                startIcon={
                  <Icon
                    type="fa6"
                    name={
                      status === planStatus.active
                        ? "FaRegCircleXmark"
                        : "FaRegCircleCheck"
                    }
                    size="1em"
                  />
                }
                data-testid="toggle-plan"
              >
                {t(status === planStatus.active ? "DEACTIVATE" : "ACTIVATE")}
              </LoadingButton>
            </>
          )}
          {canEdit && (
            <>
              <LoadingButton
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                variant="contained"
                color="secondary"
                onClick={() => handleSavePlan()}
                loading={creating.isLoading || updating.isLoading}
                disabled={busy || Boolean(id && !formState.isDirty)}
                loadingPosition="start"
                startIcon={<Icon type="fa6" name="FaFloppyDisk" size="0.8em" />}
                data-testid="save-plan"
              >
                {t(id ? "SAVE_PLAN" : "ADD_PLAN")}
              </LoadingButton>
            </>
          )}
        </FeatureHeaderActions>
      </FeatureHeaderRow>
    </FeatureHeader>
  );
}
export default PlanHeader;
