import { useTranslation } from "react-i18next";
import AuthLayout from "../AuthLayout";
export default function DeleteAccountPage() {
  const { t } = useTranslation("ashamcoAuth");
  return (
    <AuthLayout title={t("DELETE_ACCOUNT")}>
      <p>{t("DELETE_CONTACT")}</p>
      <a href="mailto:info@ashamcoex.com">info@ashamcoex.com</a>
    </AuthLayout>
  );
}
