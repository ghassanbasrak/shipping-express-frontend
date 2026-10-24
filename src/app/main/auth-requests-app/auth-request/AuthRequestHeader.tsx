import { Button, Chip, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import { useCreateAuthRequestMutation } from "../AuthRequestsApi";
import IAuthRequest from "../models/IAuthRequest";
export default function AuthRequestHeader({
  uploading = false,
}: {
  uploading?: boolean;
}) {
  const { t } = useTranslation("authRequestsApp"),
    theme = useTheme(),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    auth = useJwtAuth(),
    navigate = useNavigate();
  const { authRequestId } = useParams(),
    isNew = authRequestId === "new";
  const { handleSubmit } = useFormContext<IAuthRequest>();
  const [createRequest, creating] = useCreateAuthRequestMutation();
  const canCreate =
    isNew &&
    user.role === "user" &&
    !user.isAuthorized &&
    hasOperationPermission("auth-requests", "create", user);
  const submit = handleSubmit(async (values) => {
    if (!canCreate || uploading || creating.isLoading) return;
    try {
      await createRequest({
        description: values.description,
        fileUrl: values.fileUrl,
        userId: user.id,
      }).unwrap();
    } catch {
      dispatch(
        showMessage({
          message: t("SOMETHING_WENT_WRONG_WHEN_SEND_AUTH_REQUEST"),
          variant: "error",
        }),
      );
      return;
    }
    dispatch(
      showMessage({
        message: t("AUTH_REQUEST_SENT_SUCCESSFULLY"),
        variant: "success",
      }),
    );
    // A failed account refresh must not turn an accepted request into a retryable create.
    navigate("/auth-requests/all");
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
          to="/auth-requests/all"
          color="inherit"
          className="flex items-center mb-12"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "ltr"
              ? "heroicons-outline:arrow-sm-left"
              : "heroicons-outline:arrow-sm-right"}
          </FuseSvgIcon>
          <span className="mx-4 font-medium">{t("AUTH_REQUESTS")}</span>
        </Typography>
        <Typography className="text-20 font-semibold">
          {t("ACCOUNT_AUTHORIZATION")}
        </Typography>
      </div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-wrap justify-end gap-8"
      >
        <Chip
          label={t(user.isAuthorized ? "AUTHORIZED" : "UNAUTHORIZED")}
          color={user.isAuthorized ? "success" : "error"}
        />
        {canCreate && (
          <LoadingButton
            variant="contained"
            color="secondary"
            loading={creating.isLoading}
            disabled={uploading || creating.isLoading}
            onClick={() => submit()}
            data-testid="send-auth-request"
            startIcon={<FuseSvgIcon>material-outline:save</FuseSvgIcon>}
          >
            {t("SEND_AUTH_REQUEST")}
          </LoadingButton>
        )}
        <Button component={Link} to="/auth-requests/all">
          {t("CANCEL")}
        </Button>
      </motion.div>
    </div>
  );
}
