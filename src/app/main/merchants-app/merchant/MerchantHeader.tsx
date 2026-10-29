import FeatureHeader, {
  FeatureHeaderRow,
  FeatureHeaderHeading,
  FeatureHeaderActions,
} from "app/shared-components/feature-header/FeatureHeader";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { useTheme } from "@mui/material/styles";
import { Avatar, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
export default function MerchantHeader({
  title,
  image,
  self,
  view,
  canSave,
  busy,
  onSave,
}: {
  title: string;
  image?: string;
  self: boolean;
  view: boolean;
  canSave: boolean;
  busy: boolean;
  onSave: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation("merchantsApp");
  return (
    <FeatureHeader>
      <div className="flex items-center justify-between gap-8 min-w-0">
        <Typography
          className="flex items-center self-start gap-4 text-12 font-medium hover:underline"
          component={Link}
          role="button"
          to={self ? "/profile" : "/merchants"}
          color="inherit"
        >
          <FuseSvgIcon size={20}>
            {theme.direction === "ltr"
              ? "heroicons-outline:arrow-sm-left"
              : "heroicons-outline:arrow-sm-right"}
          </FuseSvgIcon>
          <span className="flex mx-4 font-medium">
            {t(self ? "MY_ACCOUNT" : "MERCHANTS")}
          </span>
        </Typography>
      </div>
      <FeatureHeaderRow>
        <div className="flex-1 min-w-0">
          <FeatureHeaderHeading
            feature="merchants-app"
            leading={
              view && (
                <Avatar src={image} alt={title}>
                  {title?.[0]}
                </Avatar>
              )
            }
          >
            {title}
          </FeatureHeaderHeading>
        </div>
        <FeatureHeaderActions>
          {!view && canSave && (
            <>
              <LoadingButton
                className="rounded-[10px] shadow-none whitespace-nowrap min-h-44"
                color="primary"
                variant="contained"
                loading={busy}
                onClick={onSave}
                data-testid="save-merchant"
              >
                {t("SAVE")}
              </LoadingButton>
            </>
          )}
        </FeatureHeaderActions>
      </FeatureHeaderRow>
    </FeatureHeader>
  );
}
