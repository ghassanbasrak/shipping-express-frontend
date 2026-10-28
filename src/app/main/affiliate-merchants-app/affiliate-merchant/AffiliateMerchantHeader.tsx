import { Avatar, Button, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import IAffiliateMerchant from "../models/IAffiliateMerchant";
export default function AffiliateMerchantHeader({
  affiliate,
  self,
}: {
  affiliate: IAffiliateMerchant;
  self: boolean;
}) {
  const { t } = useTranslation("affiliateMerchantsApp");
  return (
    <div className="flex flex-wrap items-center gap-16 p-24 sm:p-32 w-full">
      <Avatar src={affiliate.image || affiliate.avatarUrl}>
        {affiliate.firstName?.[0]}
      </Avatar>
      <div className="min-w-0">
        <Button
          component={Link}
          to={self ? "/profile" : "/affiliate-merchants"}
        >
          {t(self ? "VIEW_MAIN_PROFILE" : "MERCHANTS")}
        </Button>
        <Typography className="text-24 font-bold break-words">{`${affiliate.firstName || ""} ${affiliate.lastName || ""}`}</Typography>
        <Typography className="break-all">{affiliate.email}</Typography>
      </div>
    </div>
  );
}
