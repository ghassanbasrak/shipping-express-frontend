import { useRef } from "react";
import { Button, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useTheme } from "@mui/material/styles";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import Currency from "../../utils/currencyFormatter";
import { useCreatePackageRequestMutation } from "../PackageRequestsApi";
import { PackageRequestFormValues } from "../models/PackageRequestSchema";
import IPackagingSupply from "../models/IPackagingSupply";
import { packageRequestSaveValues, packagingTotal } from "../Utils";
export default function PackageRequestHeader({
  blocked,
  supplies,
  balance,
}: {
  blocked: boolean;
  supplies: IPackagingSupply[];
  balance?: number;
}) {
  const { t } = useTranslation("packageRequestsApp"),
    theme = useTheme(),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    auth = useJwtAuth(),
    navigate = useNavigate();
  const { packageRequestId } = useParams(),
    isNew = packageRequestId === "new";
  const { handleSubmit } = useFormContext<PackageRequestFormValues>(),
    [createRequest, creating] = useCreatePackageRequestMutation(),
    sent = useRef(false);
  const canCreate = isNew && user.role === "user";
  const submit = handleSubmit(async (values) => {
    const amount = packagingTotal(values.productIds, supplies);
    if (
      !canCreate ||
      blocked ||
      sent.current ||
      creating.isLoading ||
      amount === undefined ||
      amount <= 0 ||
      amount > (balance ?? 0)
    )
      return;
    sent.current = true;
    try {
      await createRequest({
        ...packageRequestSaveValues(values, amount),
        userId: user.id,
      }).unwrap();
    } catch {
      sent.current = false;
      dispatch(
        showMessage({
          message: t("SOMETHING_WENT_WRONG_WHEN_ADD_PACKAGE_REQUEST"),
          variant: "error",
        }),
      );
      return;
    }
    dispatch(
      showMessage({
        message: t("PACKAGE_REQUEST_SAVED_SUCCESSFULLY"),
        variant: "success",
      }),
    );
    navigate("/package-requests/all");
    try {
      await auth.getUser();
    } catch {
      dispatch(
        showMessage({ message: t("REFRESH_ACCOUNT_ERROR"), variant: "error" }),
      );
    }
  });
  return (
    <div className="flex flex-col sm:flex-row gap-16 flex-1 w-full items-center justify-between py-32 px-24 md:px-32">
      <div className="flex flex-col items-center sm:items-start min-w-0">
        <Typography
          component={Link}
          to="/package-requests/all"
          color="inherit"
          className="flex items-center mb-12"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "ltr"
              ? "heroicons-outline:arrow-sm-left"
              : "heroicons-outline:arrow-sm-right"}
          </FuseSvgIcon>
          <span className="mx-4 font-medium">{t("PACKAGE_REQUESTS")}</span>
        </Typography>
        <Typography className="text-20 font-semibold">
          {t(isNew ? "ADD_NEW_PACKAGE_REQUEST" : "PACKAGE_REQUEST_DETAILS")}
        </Typography>
      </div>
      <div className="flex flex-wrap justify-end items-center gap-8">
        {balance !== undefined && (
          <Typography
            className="font-semibold"
            data-testid="package-wallet-balance"
          >
            {t("CURRENT_BALANCE")}: {Currency(balance)}
          </Typography>
        )}
        {canCreate && (
          <LoadingButton
            variant="contained"
            color="secondary"
            loading={creating.isLoading}
            disabled={blocked || creating.isLoading}
            onClick={() => submit()}
            data-testid="send-package-request"
            startIcon={
              <FuseSvgIcon>heroicons-outline:shopping-bag</FuseSvgIcon>
            }
          >
            {t("ADD_PACKAGE_REQUEST")}
          </LoadingButton>
        )}
        <Button component={Link} to="/package-requests/all">
          {t("CANCEL")}
        </Button>
      </div>
    </div>
  );
}
