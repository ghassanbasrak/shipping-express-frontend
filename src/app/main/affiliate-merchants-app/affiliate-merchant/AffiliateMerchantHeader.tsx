import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
} from "app/shared-components/feature-header/FeatureHeader";
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
    <FeatureHeader>
      <div className="flex items-center justify-between gap-8 min-w-0">
        <Typography
          className="flex items-center self-start gap-4 text-12 font-medium hover:underline"
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
      </div>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading
            feature="affiliate-merchants-app"
            leading={
              <Avatar src={affiliate.image || affiliate.avatarUrl}>
                {affiliate.firstName?.[0]}
              </Avatar>
            }
          >{`${affiliate.firstName || ""} ${affiliate.lastName || ""}`}</FeatureHeaderHeading>
          <div className="flex flex-wrap items-center gap-8 mt-8 sm:ps-[72px]">
            <Typography
              color="text.secondary"
              className="text-13 leading-relaxed [overflow-wrap:anywhere]"
            >
              {affiliate.email}
            </Typography>
          </div>
        </div>
      </FeatureHeaderRow>
    </FeatureHeader>
  );
}
