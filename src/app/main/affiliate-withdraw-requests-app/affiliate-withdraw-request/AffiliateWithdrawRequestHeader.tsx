import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
  FeatureHeaderMeta,
} from "app/shared-components/feature-header/FeatureHeader";
import { useRef } from "react";
import { Button, Chip, Typography } from "@mui/material";
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
import { useCreateAffiliateWithdrawRequestMutation } from "../AffiliateWithdrawRequestsApi";
import { AffiliateWithdrawRequestForm } from "../models/AffiliateWithdrawRequestSchema";
import {
  toAffiliateWithdrawRequestStatusTitle,
  toAffiliateWithdrawRequestStatusColor,
} from "../Utils";
export default function AffiliateWithdrawRequestHeader({
  blocked,
  balance,
}: {
  blocked: boolean;
  balance?: number;
}) {
  const { t } = useTranslation("affiliateWithdrawRequestsApp"),
    theme = useTheme(),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    auth = useJwtAuth(),
    navigate = useNavigate();
  const { affiliateWithdrawRequestId } = useParams(),
    isNew = affiliateWithdrawRequestId === "new";
  const { handleSubmit, watch, setValue } =
      useFormContext<AffiliateWithdrawRequestForm>(),
    [createRequest, creating] = useCreateAffiliateWithdrawRequestMutation(),
    sent = useRef(false);
  const canCreate = isNew && user.role === "user" && user.isAffiliate;
  const submit = handleSubmit(async (values) => {
    if (!canCreate || blocked || sent.current || creating.isLoading) return;
    sent.current = true;
    try {
      await createRequest({
        amount: values.amount,
        description: values.description,
        userId: user.id,
      }).unwrap();
    } catch {
      sent.current = false;
      dispatch(
        showMessage({
          message: t("CREATE_ERROR"),
          variant: "error",
        }),
      );
      return;
    }
    dispatch(
      showMessage({
        message: t("WITHDRAW_REQUEST_SAVED_SUCCESSFULLY"),
        variant: "success",
      }),
    );
    // Return to the migrated affiliate profile withdrawal tab.
    navigate("/affiliate-profile/withdraw-requests");
    try {
      await auth.getUser();
    } catch {
      dispatch(
        showMessage({ message: t("REFRESH_ACCOUNT_ERROR"), variant: "error" }),
      );
    }
  });
  return (
    <FeatureHeader>
      <div className="flex items-center justify-between gap-8 min-w-0">
        <Typography
          component={Link}
          to="/affiliate-profile/withdraw-requests"
          color="inherit"
          className="flex items-center self-start gap-4 text-12 font-medium hover:underline"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "ltr"
              ? "heroicons-outline:arrow-sm-left"
              : "heroicons-outline:arrow-sm-right"}
          </FuseSvgIcon>
          <span className="mx-4 font-medium">{t("WITHDRAW_REQUESTS")}</span>
        </Typography>
      </div>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="affiliate-withdraw-requests-app">
            {t(isNew ? "ADD_NEW_WITHDRAW_REQUEST" : "WITHDRAW_REQUEST_DETAILS")}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          {balance !== undefined && (
            <>
              <FeatureHeaderMeta>
                <Typography
                  className="font-semibold"
                  data-testid="affiliate-balance"
                >
                  {t("CURRENT_AFFILIATE_BALANCE")}: {Currency(balance)}
                </Typography>
              </FeatureHeaderMeta>
            </>
          )}
          {!isNew && (
            <>
              <Chip
                label={t(
                  toAffiliateWithdrawRequestStatusTitle(watch("status")),
                )}
                className={
                  toAffiliateWithdrawRequestStatusColor(watch("status")) +
                  " text-white"
                }
              />
            </>
          )}
          {canCreate && (
            <>
              <LoadingButton
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                variant="contained"
                color="secondary"
                loading={creating.isLoading}
                disabled={blocked || creating.isLoading}
                onClick={() => {
                  // Validate against the latest recovered balance, preserving the editable draft.
                  setValue("availableBalance", balance ?? 0, {
                    shouldDirty: false,
                  });
                  submit();
                }}
                data-testid="send-affiliate-withdraw-request"
                startIcon={<FuseSvgIcon>material-outline:save</FuseSvgIcon>}
              >
                {t("SAVE_WITHDRAW_REQUEST")}
              </LoadingButton>
            </>
          )}
          <Button
            className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
            color="primary"
            variant="outlined"
            component={Link}
            to="/affiliate-profile/withdraw-requests"
          >
            {t("CANCEL")}
          </Button>
        </FeatureHeaderActions>
      </FeatureHeaderRow>
    </FeatureHeader>
  );
}
