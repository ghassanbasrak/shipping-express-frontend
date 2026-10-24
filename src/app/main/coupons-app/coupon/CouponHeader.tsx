import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LoadingButton } from "@mui/lab";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { couponsPath, toCouponSaveValues } from "../Utils";
import ICoupon from "../models/ICoupon";
import {
  useCreateCouponMutation,
  useUpdateCouponMutation,
} from "../CouponsApi";

function CouponHeader() {
  const { t } = useTranslation("couponsApp");
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { shippingCompanyId = "all", userId = "all" } = useParams();
  const listPath = couponsPath(shippingCompanyId, userId);
  const user = useAppSelector(selectUser);
  const { watch, handleSubmit, setValue, formState } =
    useFormContext<ICoupon>();
  const { id, code, isActive } = watch();
  const [createCoupon, creating] = useCreateCouponMutation();
  const [updateCoupon, updating] = useUpdateCouponMutation();
  const [changeActive, toggling] = useUpdateCouponMutation();
  const canEdit = hasOperationPermission(
    "coupons",
    id ? "update" : "create",
    user,
  );
  const busy = creating.isLoading || updating.isLoading || toggling.isLoading;

  const handleSaveCoupon = handleSubmit(async (values) => {
    if (!canEdit) return;
    const input = toCouponSaveValues(values);
    try {
      await (id ? updateCoupon(input) : createCoupon(input)).unwrap();
      dispatch(
        showMessage({
          message: t("COUPON_SAVED_SUCCESSFULLY"),
          variant: "success",
        }),
      );
      navigate(listPath);
    } catch {
      dispatch(
        showMessage({
          message: t(
            id
              ? "SOMETHING_WENT_WRONG_WHEN_SAVE_COUPON"
              : "SOMETHING_WENT_WRONG_WHEN_ADD_COUPON",
          ),
          variant: "error",
        }),
      );
    }
  });

  function handleChangeActive() {
    if (!hasOperationPermission("coupons", "update", user)) return;
    const nextActive = !isActive;
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t(`${nextActive ? "ACTIVATE" : "DEACTIVATE"}_COUPON_TITLE`)}
            message={`${t(`${nextActive ? "ACTIVATE" : "DEACTIVATE"}_COUPON_MESSAGE`)} "${code}"`}
            onSubmit={async () => {
              try {
                await changeActive({ id, isActive: nextActive }).unwrap();
                setValue("isActive", nextActive, { shouldDirty: false });
                dispatch(
                  showMessage({
                    message: t(
                      `COUPON_${nextActive ? "ACTIVATED" : "DEACTIVATED"}_SUCCESSFULLY`,
                    ),
                    variant: "success",
                  }),
                );
              } catch {
                dispatch(
                  showMessage({
                    message: t(
                      `SOMETHING_WENT_WRONG_WHEN_${nextActive ? "ACTIVATE" : "DEACTIVATE"}_COUPON`,
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
    <div className="flex flex-col sm:flex-row flex-1 w-full items-center justify-between space-y-8 sm:space-y-0 py-24 sm:py-32 px-24 md:px-32">
      <div className="flex flex-col items-start space-y-8 sm:space-y-0 w-full sm:max-w-full min-w-0">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1, transition: { delay: 0.3 } }}
        >
          <Typography
            className="flex items-center sm:mb-12"
            component={Link}
            role="button"
            to={listPath}
            color="inherit"
          >
            <FuseSvgIcon size={20}>
              {theme.direction === "ltr"
                ? "heroicons-outline:arrow-sm-left"
                : "heroicons-outline:arrow-sm-right"}
            </FuseSvgIcon>
            <span className="flex mx-4 font-medium">{t("COUPONS")}</span>
          </Typography>
        </motion.div>
        <div className="flex items-center max-w-full">
          <motion.div
            className="flex flex-col min-w-0 mx-8 sm:mx-16"
            initial={{ x: -20 }}
            animate={{ x: 0, transition: { delay: 0.3 } }}
          >
            <Typography className="text-16 sm:text-20 truncate font-semibold">
              {t(id ? "EDIT_COUPON" : "ADD_NEW_COUPON")}
            </Typography>
            <Typography variant="caption" className="font-medium">
              {code}
            </Typography>
          </motion.div>
        </div>
      </div>
      {id && canEdit && (
        <motion.div
          className="flex flex-1 w-full"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }}
        >
          <LoadingButton
            className="whitespace-nowrap mx-4"
            variant="outlined"
            color={isActive ? "error" : "success"}
            onClick={handleChangeActive}
            loading={toggling.isLoading}
            disabled={busy}
            startIcon={
              <Icon
                type="fa6"
                name={isActive ? "FaRegCircleXmark" : "FaRegCircleCheck"}
                size="1em"
              />
            }
            data-testid="toggle-coupon"
          >
            {t(isActive ? "DEACTIVATE" : "ACTIVATE")}
          </LoadingButton>
        </motion.div>
      )}
      {canEdit && (
        <motion.div
          className="flex flex-1 w-full"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }}
        >
          <LoadingButton
            className="whitespace-nowrap mx-4"
            variant="contained"
            color="secondary"
            onClick={() => handleSaveCoupon()}
            loading={creating.isLoading || updating.isLoading}
            disabled={busy || Boolean(id && !formState.isDirty)}
            loadingPosition="start"
            startIcon={<Icon type="fa6" name="FaFloppyDisk" size="0.8em" />}
            data-testid="save-coupon"
          >
            {t(id ? "SAVE_COUPON" : "ADD_COUPON")}
          </LoadingButton>
        </motion.div>
      )}
    </div>
  );
}
export default CouponHeader;
