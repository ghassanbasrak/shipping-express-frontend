import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import ServicePage from "./shared-components/ServicePage";
export default function StoreAuthentication() {
  const { t } = useTranslation("merchantServices");
  return (
    <ServicePage title="STORE_AUTHENTICATION" message="AUTHENTICATION_MESSAGE">
      <Button
        component="a"
        href="tel:00966501932466"
        dir="ltr"
        variant="outlined"
        aria-label={t("CONTACT_SUPPORT")}
      >
        00966501932466
      </Button>
    </ServicePage>
  );
}
