import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthLayout from "../AuthLayout";
export default function MaintenancePage() {
  const { t } = useTranslation("ashamcoAuth");
  return (
    <AuthLayout title={t("TITLE")}>
      <p>{t("MAINTENANCE")}</p>
      <Link to="/sign-in">{t("SIGN_IN")}</Link>
    </AuthLayout>
  );
}
