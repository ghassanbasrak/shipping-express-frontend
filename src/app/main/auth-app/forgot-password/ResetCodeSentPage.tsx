import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthLayout from "../AuthLayout";
export default function ResetCodeSentPage() {
  const { t } = useTranslation("ashamcoAuth");
  return (
    <AuthLayout title={t("RESET_PASSWORD")}>
      <p>{t("RESET_SENT")}</p>
      <Link to="/sign-in">{t("SIGN_IN")}</Link>
    </AuthLayout>
  );
}
