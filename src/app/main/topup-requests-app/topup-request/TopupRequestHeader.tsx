import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useTheme } from "@mui/material/styles";
import { Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import {
  TopupBalanceCard,
  TopupHeaderHeading,
  TopupHeaderLayout,
} from "../shared-components/TopupHeaderLayout";
export default function TopupRequestHeader() {
  const theme = useTheme();
  const { t } = useTranslation("topupRequestsApp"),
    user = useAppSelector(selectUser),
    isNew = useParams().topupRequestId === "new";
  return (
    <TopupHeaderLayout testId="topup-detail-header">
      <Typography
        className="flex items-center self-start gap-4 text-12 font-medium hover:underline"
        component={Link}
        role="button"
        to="/topup-requests/all"
        color="inherit"
      >
        <FuseSvgIcon size={20}>
          {theme.direction === "ltr"
            ? "heroicons-outline:arrow-sm-left"
            : "heroicons-outline:arrow-sm-right"}
        </FuseSvgIcon>
        <span className="flex mx-4 font-medium">{t("TOPUP_REQUESTS")}</span>
      </Typography>
      <div className="flex flex-col sm:flex-row items-start justify-between gap-24">
        <TopupHeaderHeading
          title={t(isNew ? "TOPUP_WALLET_BALANCE" : "TOPUP_REQUEST_DETAILS")}
          description={t(
            isNew ? "TOPUP_CREATE_DESCRIPTION" : "TOPUP_DETAIL_DESCRIPTION",
          )}
        />
        <TopupBalanceCard label={t("CURRENT_BALANCE")} balance={user.balance} />
      </div>
    </TopupHeaderLayout>
  );
}
