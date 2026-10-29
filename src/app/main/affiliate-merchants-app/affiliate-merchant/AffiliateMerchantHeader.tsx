import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useTheme } from "@mui/material/styles";
import { Avatar, Typography } from "@mui/material";
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
  const theme = useTheme();
  const { t } = useTranslation("affiliateMerchantsApp");
  return (
    <div className="flex flex-wrap items-center gap-16 p-24 sm:p-32 w-full">
      <Avatar src={affiliate.image || affiliate.avatarUrl}>
        {affiliate.firstName?.[0]}
      </Avatar>
      <div className="min-w-0">
        <Typography
          className="flex items-center sm:mb-12"
          component={Link}
          role="button"
          to={self ? "/profile" : "/affiliate-merchants"}
          color="inherit"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "ltr"
              ? "heroicons-outline:arrow-sm-left"
              : "heroicons-outline:arrow-sm-right"}
          </FuseSvgIcon>
          <span className="flex mx-4 font-medium">
            {t(self ? "VIEW_MAIN_PROFILE" : "MERCHANTS")}
          </span>
        </Typography>
        <Typography className="text-24 font-bold break-words">{`${affiliate.firstName || ""} ${affiliate.lastName || ""}`}</Typography>
        <Typography className="break-all">{affiliate.email}</Typography>
      </div>
    </div>
  );
}
