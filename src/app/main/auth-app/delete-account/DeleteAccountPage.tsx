import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import AuthLayout from "../AuthLayout";
export default function DeleteAccountPage() {
  const { t } = useTranslation("ashamcoAuth");
  return (
    <AuthLayout
      title={t("DELETE_ACCOUNT")}
      description={t("DELETE_CONTACT")}
      product
    >
      <div className="space-y-24">
        <Box
          className="rounded-12 border p-16"
          sx={{ borderColor: "divider", bgcolor: "action.hover" }}
        >
          <Typography variant="caption" color="text.secondary">
            {t("EMAIL")}
          </Typography>
          <Typography dir="ltr" className="mt-4 break-all font-semibold">
            info@ashamcoex.com
          </Typography>
        </Box>
        <Button
          component="a"
          href="mailto:info@ashamcoex.com"
          variant="contained"
          color="primary"
          fullWidth
          className="min-h-52 rounded-8"
        >
          {t("SUPPORT")}
        </Button>
        <Typography
          color="text.secondary"
          variant="body2"
          className="text-center"
        >
          <Link to="/sign-in">{t("BACK_TO_SIGN_IN")}</Link>
        </Typography>
      </div>
    </AuthLayout>
  );
}
