import { Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import AlertDialog from "app/shared-components/alert-dialog/AlertDialog";
import CopyableText from "app/shared-components/CopyableText";
import { API_BASE_URL } from "app/configs/apiConfig";
export default function ApplicationApiDetails({
  apiKey,
  docsPath = "/api-docs",
}: {
  apiKey?: string;
  docsPath?: string;
}) {
  const { t } = useTranslation("applicationsApp");
  return (
    <AlertDialog
      title={t("API_INTEGRATION_DETAILS")}
      closeIcon
      noActions
      message={
        <div
          className="w-full space-y-16"
          data-testid="application-api-details"
        >
          <CopyableText
            label={t("BASE_URL")}
            textLabel="baseUrl"
            text={API_BASE_URL}
            secondTextLabel="apiDocs"
            secondText={`${API_BASE_URL}${docsPath}`}
            double
            secondTextLink
            chip={
              <Chip
                label={t("API_LINKS")}
                size="small"
                sx={{ bgcolor: "white", color: "#0f1924" }}
              />
            }
            dir="ltr"
            className="break-all"
          />
          <CopyableText
            label={t("API_KEY")}
            textLabel="x-api-key"
            text={apiKey}
            chip={<Chip label={t("HEADER")} color="info" size="small" />}
            dir="ltr"
            className="break-all"
          />
        </div>
      }
    />
  );
}
