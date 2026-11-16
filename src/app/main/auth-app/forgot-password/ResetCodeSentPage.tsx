import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Button, Typography } from "@mui/material";
import AuthLayout from "../AuthLayout";
export default function ResetCodeSentPage() {
  const { t } = useTranslation("ashamcoAuth");
  return (
    <AuthLayout
      title={t("RESET_EMAIL_TITLE")}
      description={t("RESET_SENT")}
      product
    >
      <div className="space-y-24">
        <Alert severity="info">{t("RESET_EMAIL_HELP")}</Alert>
        <Button
          component={Link}
          to="/sign-in"
          variant="contained"
          color="primary"
          fullWidth
          className="min-h-52 rounded-8"
        >
          {t("BACK_TO_SIGN_IN")}
        </Button>
        <Typography
          color="text.secondary"
          variant="body2"
          className="text-center"
        >
          <Link to="/forgot-password">{t("USE_ANOTHER_EMAIL")}</Link>
        </Typography>
      </div>
    </AuthLayout>
  );
}
