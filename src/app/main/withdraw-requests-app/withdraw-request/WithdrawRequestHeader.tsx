import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
  FeatureHeaderMeta,
} from "app/shared-components/feature-header/FeatureHeader";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useTheme } from "@mui/material/styles";
import { useRef, useState } from "react";
import { Button, Chip, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import Currency from "../../utils/currencyFormatter";
import {
  useCreateWithdrawRequestMutation,
  useLazyGetWithdrawBalanceQuery,
  useLazyGetWithdrawRequestShipmentsQuery,
} from "../WithdrawRequestsApi";
import { WithdrawRequestForm } from "../models/WithdrawRequestSchema";
import {
  selectedWithdrawalAmount,
  toWithdrawRequestStatusTitle,
  toWithdrawRequestStatusColor,
} from "../Utils";
import { decompressShipment } from "../../shipments-app/Utils";
export default function WithdrawRequestHeader({
  blocked,
  balance,
}: {
  blocked: boolean;
  balance?: number;
}) {
  const theme = useTheme();
  const { t } = useTranslation("withdrawRequestsApp"),
    dispatch = useAppDispatch(),
    user = useAppSelector(selectUser),
    navigate = useNavigate(),
    auth = useJwtAuth();
  const isNew = useParams().withdrawRequestId === "new",
    { handleSubmit, watch, setValue } = useFormContext<WithdrawRequestForm>();
  const [create, creating] = useCreateWithdrawRequestMutation(),
    [getBalance] = useLazyGetWithdrawBalanceQuery(),
    [getShipments] = useLazyGetWithdrawRequestShipmentsQuery();
  const sent = useRef(false),
    [checking, setChecking] = useState(false);
  const submit = (type: "withdrew" | "walletCharge") =>
    handleSubmit(async (values) => {
      if (!isNew || user.role !== "user" || blocked || sent.current) return;
      sent.current = true;
      setChecking(true);
      try {
        const [freshBalance, freshShipments] = await Promise.all([
          getBalance(user.id, false).unwrap(),
          getShipments(undefined, false).unwrap(),
        ]);
        const amount = selectedWithdrawalAmount(
          values.shipmentIds,
          freshShipments.results.map(decompressShipment),
        );
        setValue("availableBalance", freshBalance.amount, {
          shouldValidate: true,
        });
        if (
          amount === null ||
          amount <= 0 ||
          amount > freshBalance.amount ||
          Math.abs(amount - values.amount) > 0.001
        ) {
          throw new Error("stale");
        }
        await create({
          amount,
          shipmentIds: [...values.shipmentIds],
          description: values.description,
          userId: user.id,
          type,
        }).unwrap();
      } catch {
        sent.current = false;
        setChecking(false);
        dispatch(
          showMessage({
            message: t("CREATE_OR_ELIGIBILITY_ERROR"),
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
      navigate("/withdraw-requests/all");
      try {
        await auth.getUser();
      } catch {
        dispatch(
          showMessage({
            message: t("REFRESH_ACCOUNT_ERROR"),
            variant: "error",
          }),
        );
      }
    })();
  return (
    <FeatureHeader>
      <div className="flex items-center justify-between gap-8 min-w-0">
        <Typography
          className="flex items-center self-start gap-4 text-12 font-medium hover:underline"
          component={Link}
          role="button"
          to="/withdraw-requests/all"
          color="inherit"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "ltr"
              ? "heroicons-outline:arrow-sm-left"
              : "heroicons-outline:arrow-sm-right"}
          </FuseSvgIcon>
          <span className="flex mx-4 font-medium">
            {t("WITHDRAW_REQUESTS")}
          </span>
        </Typography>
      </div>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading feature="withdraw-requests-app">
            {t(isNew ? "ADD_NEW_WITHDRAW_REQUEST" : "WITHDRAW_REQUEST_DETAILS")}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          {balance !== undefined && (
            <>
              <FeatureHeaderMeta>
                <Typography data-testid="withdraw-balance">
                  {t("CURRENT_BALANCE")}: {Currency(balance)}
                </Typography>
              </FeatureHeaderMeta>
            </>
          )}
          {!isNew && (
            <>
              <Chip
                label={t(toWithdrawRequestStatusTitle(watch("status")))}
                className={
                  toWithdrawRequestStatusColor(watch("status")) + " text-white"
                }
              />
            </>
          )}
          {isNew && user.role === "user" && (
            <>
              {(["walletCharge", "withdrew"] as const).map((type) => (
                <LoadingButton
                  color="primary"
                  key={type}
                  variant="contained"
                  loading={checking || creating.isLoading}
                  disabled={blocked || checking || creating.isLoading}
                  onClick={() => submit(type)}
                  data-testid={"send-withdraw-" + type}
                >
                  {t(
                    type === "walletCharge"
                      ? "REQUEST_WITHDRAW_WALLET"
                      : "REQUEST_WITHDRAW_BANK",
                  )}
                </LoadingButton>
              ))}
            </>
          )}
          <Button
            className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
            color="primary"
            variant="outlined"
            component={Link}
            to="/withdraw-requests/all"
          >
            {t("CANCEL")}
          </Button>
        </FeatureHeaderActions>
      </FeatureHeaderRow>
    </FeatureHeader>
  );
}
