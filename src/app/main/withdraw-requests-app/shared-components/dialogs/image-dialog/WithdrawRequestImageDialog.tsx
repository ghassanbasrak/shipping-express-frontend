import { useState } from "react";
import { Alert, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import CustomDialog from "app/shared-components/custom-dialog/CustomDialog";
export default function WithdrawRequestImageDialog({
  id,
  url,
  reference,
  onClose,
}: {
  id: string;
  url: string;
  reference?: string;
  onClose: () => void;
}) {
  const { t } = useTranslation("withdrawRequestsApp");
  const [loading, setLoading] = useState(false),
    [failed, setFailed] = useState(false),
    [imageFailed, setImageFailed] = useState(false),
    [retry, setRetry] = useState(0);
  async function download() {
    if (loading) return;
    setLoading(true);
    setFailed(false);
    let objectUrl: string | undefined;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");
      objectUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${id}.jpg`;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      setFailed(true);
    } finally {
      if (objectUrl) {
        const downloadUrl = objectUrl;
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      }
      setLoading(false);
    }
  }
  return (
    <CustomDialog
      title={
        <span id="withdraw-request-image-title">{t("TRANSACTION_IMAGE")}</span>
      }
      closeIcon
      customCloseAction={onClose}
      message={
        <div className="w-full min-w-0" data-testid="withdraw-request-image">
          {failed && (
            <Alert severity="error">
              {t("SOMETHING_WENT_WRONG_WHEN_DOWNLOAD_TRANSACTION_IMAGE")}
            </Alert>
          )}
          {imageFailed && (
            <Alert
              severity="error"
              action={
                <Button
                  color="primary"
                  variant="outlined"
                  onClick={() => {
                    setImageFailed(false);
                    setRetry((value) => value + 1);
                  }}
                >
                  {t("RETRY")}
                </Button>
              }
            >
              {t("IMAGE_LOAD_ERROR")}
            </Alert>
          )}
          <img
            key={retry}
            className="w-full h-auto"
            src={url}
            alt={reference || t("TRANSACTION_IMAGE")}
            onError={() => setImageFailed(true)}
          />
        </div>
      }
      cancelButtonTitle={t("CANCEL")}
      submitButtonTitle={t("DOWNLOAD")}
      submitButtonLoadingTitle={t("DOWNLOADING")}
      submitButtonLoading={loading}
      submitButtonProps={{ color: "secondary" }}
      disableCloseWhenSubmit
      onSubmit={download}
    />
  );
}
