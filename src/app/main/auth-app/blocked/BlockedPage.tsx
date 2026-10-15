import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import AuthLayout from "../AuthLayout";
export default function BlockedPage() {
  const { t } = useTranslation("ashamcoAuth");
  const auth = useJwtAuth();
  return (
    <AuthLayout title={t("TITLE")}>
      <p>{t("BLOCKED")}</p>
      <a href="mailto:info@ashamcoex.com">{t("SUPPORT")}</a>
      <Button onClick={auth.signOut}>{t("SIGN_OUT")}</Button>
    </AuthLayout>
  );
}
