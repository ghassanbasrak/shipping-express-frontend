import { useEffect } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { CheckoutApiResponse } from "../TopupRequestsApi";
import { checkoutUrl } from "../Utils";
export default function CheckoutRedirectDialog({
  checkout,
  onClose,
  onRetry,
  busy = false,
}: {
  checkout?: CheckoutApiResponse;
  onClose: () => void;
  onRetry?: () => void;
  busy?: boolean;
}) {
  const { t } = useTranslation("topupRequestsApp"),
    url = checkoutUrl(checkout?.link);
  useEffect(() => {
    if (!checkout || !url) return;
    const timer = setTimeout(() => window.location.assign(url), 500);
    return () => clearTimeout(timer);
  }, [checkout, url]);
  return (
    <Dialog
      open={!!checkout}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="checkout-redirect-title"
    >
      <DialogTitle id="checkout-redirect-title">
        {t("PROCEED_TO_PAYMENT")}
      </DialogTitle>
      <DialogContent>
        {url ? (
          <div className="flex gap-16 items-center">
            <CircularProgress size={24} />
            {t("WAITING_PAY_ORDER_MESSAGE")}
          </div>
        ) : (
          <Alert severity="error">{t("CHECKOUT_LINK_ERROR")}</Alert>
        )}
      </DialogContent>
      <DialogActions>
        {url && (
          <Button color="primary" variant="outlined" component="a" href={url}>
            {t("PROCEED_TO_PAYMENT")}
          </Button>
        )}
        {!url && onRetry && (
          <Button
            color="primary"
            variant="outlined"
            disabled={busy}
            onClick={onRetry}
            data-testid="retry-checkout"
          >
            {t("RETRY")}
          </Button>
        )}
        <Button
          color="primary"
          variant="outlined"
          disabled={busy}
          onClick={onClose}
        >
          {t("CLOSE")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
