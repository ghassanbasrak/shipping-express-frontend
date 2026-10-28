import { Button, Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import Currency from "../../utils/currencyFormatter";
export default function TopupRequestHeader() {
  const { t } = useTranslation("topupRequestsApp"),
    user = useAppSelector(selectUser),
    isNew = useParams().topupRequestId === "new";
  return (
    <div className="flex flex-wrap justify-between items-center gap-16 w-full p-24 sm:p-32">
      <div>
        <Button component={Link} to="/topup-requests/all">
          {t("TOPUP_REQUESTS")}
        </Button>
        <Typography className="text-24 font-bold">
          {t(isNew ? "TOPUP_WALLET_BALANCE" : "TOPUP_REQUEST_DETAILS")}
        </Typography>
      </div>
      <Typography className="font-semibold">
        {t("CURRENT_BALANCE")}: {Currency(user.balance || 0)}
      </Typography>
    </div>
  );
}
