import { Avatar, Button, Typography } from "@mui/material";
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
  const { t } = useTranslation("merchantsApp");
  return (
    <div className="flex flex-wrap items-center justify-between gap-16 p-24 sm:p-32 w-full">
      <div>
        <Button component={Link} to={self ? "/profile" : "/merchants"}>
          {t(self ? "MY_ACCOUNT" : "MERCHANTS")}
        </Button>
        <div className="flex items-center gap-12">
          {view && (
            <Avatar src={image} alt={title}>
              {title?.[0]}
            </Avatar>
          )}
          <Typography className="text-24 font-bold">{title}</Typography>
        </div>
      </div>
      {!view && canSave && (
        <LoadingButton
          variant="contained"
          loading={busy}
          onClick={onSave}
          data-testid="save-merchant"
        >
          {t("SAVE")}
        </LoadingButton>
      )}
    </div>
  );
}
