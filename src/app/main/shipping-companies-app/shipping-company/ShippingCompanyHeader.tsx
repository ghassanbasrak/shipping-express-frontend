import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LoadingButton } from "@mui/lab";
import { motion } from "framer-motion";
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
import IShippingCompany from "../models/IShippingCompany";
import {
  useCreateShippingCompanyMutation,
  useUpdateShippingCompanyMutation,
} from "../ShippingCompaniesApi";

function ShippingCompanyHeader() {
  const { t } = useTranslation("shippingCompaniesApp");
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const { watch, handleSubmit, setValue, formState } =
    useFormContext<IShippingCompany>();
  const { id, name, isActive } = watch();
  const [createShippingCompany, creating] = useCreateShippingCompanyMutation();
  const [updateShippingCompany, updating] = useUpdateShippingCompanyMutation();
  const [changeActive, toggling] = useUpdateShippingCompanyMutation();
  const canEdit = hasOperationPermission(
    "shipping-companies",
    id ? "update" : "create",
    user,
  );
  const busy = creating.isLoading || updating.isLoading || toggling.isLoading;

  const handleSaveShippingCompany = handleSubmit(async (values) => {
    if (!canEdit) return;
    const input = { ...values };
    // The legacy backend treats an omitted fuel surcharge as its default.
    if (!input.fuelPercentage) delete input.fuelPercentage;
    try {
      await (
        id ? updateShippingCompany(input) : createShippingCompany(input)
      ).unwrap();
      dispatch(
        showMessage({
          message: t("SHIPPING_COMPANY_SAVED_SUCCESSFULLY"),
          variant: "success",
        }),
      );
      navigate("/shipping-companies");
    } catch {
      dispatch(
        showMessage({
          message: t(
            id
              ? "SOMETHING_WENT_WRONG_WHEN_SAVE_SHIPPING_COMPANY"
              : "SOMETHING_WENT_WRONG_WHEN_ADD_SHIPPING_COMPANY",
          ),
          variant: "error",
        }),
      );
    }
  });

  function handleChangeActive() {
    if (!hasOperationPermission("shipping-companies", "update", user)) return;
    const nextActive = !isActive;
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t(
              `${nextActive ? "ACTIVATE" : "DEACTIVATE"}_SHIPPING_COMPANY_TITLE`,
            )}
            message={`${t(`${nextActive ? "ACTIVATE" : "DEACTIVATE"}_SHIPPING_COMPANY_MESSAGE`)} "${name}"`}
            onSubmit={async () => {
              try {
                await changeActive({ id, isActive: nextActive }).unwrap();
                setValue("isActive", nextActive, { shouldDirty: false });
                dispatch(
                  showMessage({
                    message: t(
                      `SHIPPING_COMPANY_${nextActive ? "ACTIVATED" : "DEACTIVATED"}_SUCCESSFULLY`,
                    ),
                    variant: "success",
                  }),
                );
              } catch {
                dispatch(
                  showMessage({
                    message: t(
                      `SOMETHING_WENT_WRONG_WHEN_${nextActive ? "ACTIVATE" : "DEACTIVATE"}_SHIPPING_COMPANY`,
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
            to="/shipping-companies"
            color="inherit"
          >
            <FuseSvgIcon size={20}>
              {theme.direction === "ltr"
                ? "heroicons-outline:arrow-sm-left"
                : "heroicons-outline:arrow-sm-right"}
            </FuseSvgIcon>
            <span className="flex mx-4 font-medium">
              {t("SHIPPING_COMPANIES")}
            </span>
          </Typography>
        </motion.div>
        <div className="flex items-center max-w-full">
          <motion.div
            className="flex flex-col min-w-0 mx-8 sm:mx-16"
            initial={{ x: -20 }}
            animate={{ x: 0, transition: { delay: 0.3 } }}
          >
            <Typography className="text-16 sm:text-20 truncate font-semibold">
              {t(id ? "EDIT_SHIPPING_COMPANY" : "ADD_NEW_SHIPPING_COMPANY")}
            </Typography>
            <Typography variant="caption" className="font-medium">
              {name}
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
            data-testid="toggle-shipping-company"
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
            onClick={() => handleSaveShippingCompany()}
            loading={creating.isLoading || updating.isLoading}
            disabled={busy || Boolean(id && !formState.isDirty)}
            loadingPosition="start"
            startIcon={<Icon type="fa6" name="FaFloppyDisk" size="0.8em" />}
            data-testid="save-shipping-company"
          >
            {t(id ? "SAVE_SHIPPING_COMPANY" : "ADD_SHIPPING_COMPANY")}
          </LoadingButton>
        </motion.div>
      )}
    </div>
  );
}
export default ShippingCompanyHeader;
