import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useTheme } from "@mui/material/styles";
import { Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  PaymentBalanceCard,
  PaymentHeaderHeading,
  PaymentHeaderLayout,
} from "../shared-components/PaymentHeaderLayout";
export default function PaymentHeader() {
  const theme = useTheme();
  const { t } = useTranslation("paymentsApp"),
    user = useAppSelector(selectUser),
    isNew = useParams().paymentId === "new";
  return (
    <PaymentHeaderLayout testId="payment-detail-header">
      <Typography
        className="flex items-center self-start gap-4 text-12 font-medium hover:underline"
        component={Link}
        role="button"
        to="/payments/all"
        color="inherit"
      >
        <FuseSvgIcon size={20}>
          {theme.direction === "ltr"
            ? "heroicons-outline:arrow-sm-left"
            : "heroicons-outline:arrow-sm-right"}
        </FuseSvgIcon>
        <span className="flex mx-4 font-medium">{t("PAYMENTS")}</span>
      </Typography>
      <div className="flex flex-col sm:flex-row items-start justify-between gap-24">
        <PaymentHeaderHeading
          title={t(isNew ? "ADD_NEW_PAYMENT" : "PAYMENT_DETAILS")}
          description={t(
            isNew ? "PAYMENT_CREATE_DESCRIPTION" : "PAYMENT_DETAIL_DESCRIPTION",
          )}
        />
        <PaymentBalanceCard
          label={t("CURRENT_BALANCE")}
          balance={user.balance}
        />
      </div>
    </PaymentHeaderLayout>
  );
}
