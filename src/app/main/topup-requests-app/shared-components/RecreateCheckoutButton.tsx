import { useRef, useState } from "react";
import { Alert } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import ITopupRequest from "../models/ITopupRequest";
import {
  CheckoutApiResponse,
  useLazyGetTopupRequestQuery,
  useRecreateTopupCheckoutMutation,
} from "../TopupRequestsApi";
import { canRecreateTopup } from "../Utils";
import CheckoutRedirectDialog from "./CheckoutRedirectDialog";
export default function RecreateCheckoutButton({
  payment,
}: {
  payment: ITopupRequest;
}) {
  const { t } = useTranslation("topupRequestsApp"),
    user = useAppSelector(selectUser),
    [getPayment] = useLazyGetTopupRequestQuery(),
    [recreate, state] = useRecreateTopupCheckoutMutation(),
    [checkout, setCheckout] = useState<CheckoutApiResponse>(),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false),
    lock = useRef(false),
    issued = useRef(false);
  async function retry() {
    if (lock.current || !canRecreateTopup(user, payment)) return;
    lock.current = true;
    setBusy(true);
    setError(false);
    try {
      const fresh = await getPayment(payment.id, false).unwrap();
      if (!canRecreateTopup(user, fresh)) throw new Error("unavailable");
      const result = await recreate(payment.id).unwrap();
      issued.current = true;
      setCheckout({ ...result, id: result.id || payment.id });
    } catch {
      setError(true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (!canRecreateTopup(user, payment)) return null;
  return (
    <div className="space-y-8">
      {error && <Alert severity="error">{t("RECREATE_ERROR")}</Alert>}
      <LoadingButton
        color="primary"
        variant="outlined"
        size="small"
        loading={busy || state.isLoading}
        disabled={issued.current}
        onClick={retry}
        data-testid={"recreate-" + payment.id}
      >
        {t("RECREATE_THE_CHECKOUT_PROCESS")}
      </LoadingButton>
      <CheckoutRedirectDialog
        checkout={checkout}
        onClose={() => {
          setCheckout(undefined);
          issued.current = false;
        }}
        busy={busy}
        onRetry={retry}
      />
    </div>
  );
}
