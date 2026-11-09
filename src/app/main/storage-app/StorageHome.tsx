import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TablePagination,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FusePageCarded from "@fuse/core/FusePageCarded";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import Currency from "../utils/currencyFormatter";
import {
  useGetStoragePlansQuery,
  useGetStorageSubscriptionQuery,
  useLazyGetStoragePlanQuery,
  useSubscribeStorageMutation,
  type StorageCheckoutResponse,
} from "./StorageApi";
import {
  canManageStorage,
  hasActiveStorageSubscription,
  storageError,
  storagePlanPrice,
} from "./Utils";
import type IStoragePlan from "./models/IStoragePlan";
import StorageGate from "./shared/StorageGate";
import StorageHeader from "./shared/StorageHeader";
import MoyasarCheckout from "./shared/MoyasarCheckout";
type Pending = StorageCheckoutResponse & { gatewayId?: string };
function readPending(userId: string): Pending | undefined {
  try {
    const value = JSON.parse(
      sessionStorage.getItem("storage-checkout:" + userId),
    );
    return value?.payment?.userId === userId &&
      value.payment.id &&
      value.checkout?.publishable_api_key?.startsWith("pk_")
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}
function StorageWorkspace() {
  const user = useAppSelector(selectUser),
    { t } = useTranslation("storageApp"),
    admin = canManageStorage(user);
  const [page, setPage] = useState(0),
    [selected, setSelected] = useState<IStoragePlan>(),
    [error, setError] = useState(""),
    [pending, setPending] = useState<Pending>(() => readPending(user.id)),
    [dialog, setDialog] = useState(false),
    [success, setSuccess] = useState(false);
  const busy = useRef(false);
  const plans = useGetStoragePlansQuery(
    {},
    { skip: admin, refetchOnMountOrArgChange: true },
  );
  const subscription = useGetStorageSubscriptionQuery(user.id, {
    skip: admin,
    refetchOnMountOrArgChange: true,
  });
  const [readPlan] = useLazyGetStoragePlanQuery(),
    [subscribe, writing] = useSubscribeStorageMutation(),
    [checking, setChecking] = useState(false);
  const active = hasActiveStorageSubscription(
    subscription.currentData,
    user.id,
  );
  const available = !subscription.isError && !subscription.isFetching;
  function remember(value: Pending) {
    setPending(value);
    try {
      sessionStorage.setItem(
        "storage-checkout:" + user.id,
        JSON.stringify(value),
      );
    } catch {
      /* The open checkout remains in memory. */
    }
  }
  async function confirm() {
    if (busy.current || !selected || !available || active || pending || success)
      return;
    busy.current = true;
    setChecking(true);
    setError("");
    try {
      const [current, currentSubscription] = await Promise.all([
        readPlan(selected.id, false).unwrap(),
        subscription.refetch().unwrap(),
      ]);
      if (hasActiveStorageSubscription(currentSubscription, user.id))
        throw new Error(t("ALREADY_SUBSCRIBED"));
      if (!current.isActive) throw new Error(t("PLAN_UNAVAILABLE"));
      if (
        JSON.stringify([
          current.price,
          current.discountPrice,
          current.durationDays,
          current.features,
        ]) !==
        JSON.stringify([
          selected.price,
          selected.discountPrice,
          selected.durationDays,
          selected.features,
        ])
      ) {
        setSelected(structuredClone(current));
        throw new Error(t("PLAN_CHANGED"));
      }
      const result = await subscribe({ planId: current.id }).unwrap();
      if (
        result.payment?.userId !== user.id ||
        !result.payment.id ||
        result.payment.storagePlanId !== current.id
      )
        throw new Error(t("PAYMENT_INVALID"));
      if (!result.checkout) {
        // Free plans activate on the server. Confirm current entitlement before showing success.
        const fresh = await subscription.refetch().unwrap();
        if (!hasActiveStorageSubscription(fresh, user.id))
          throw new Error(t("SUBSCRIPTION_REFRESH"));
        setSuccess(true);
        setSelected(undefined);
        setDialog(false);
      } else {
        if (
          !result.checkout.publishable_api_key?.startsWith("pk_") ||
          !Number.isSafeInteger(result.checkout.amount) ||
          result.checkout.amount <= 0 ||
          result.checkout.currency !== "SAR" ||
          Math.round(result.payment.total * 100) !== result.checkout.amount
        )
          throw new Error(t("PAYMENT_INVALID"));
        const callback = new URL(result.checkout.callback_url);
        if (
          !["https:", "http:"].includes(callback.protocol) ||
          callback.searchParams.get("paymentId") !== result.payment.id
        )
          throw new Error(t("PAYMENT_INVALID"));
        remember(result);
        setSelected(undefined);
      }
    } catch (e) {
      setError(storageError(e, t("SAVE_ERROR")));
    } finally {
      busy.current = false;
      setChecking(false);
    }
  }
  return (
    <FusePageCarded
      header={
        <StorageHeader
          title={t("STORAGE")}
          description={t("STORAGE_INTRO")}
          back={false}
        />
      }
      content={
        <div className="p-16 sm:p-24 space-y-20" data-testid="storage-home">
          {admin ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {[
                ["/storage/warehouses", "WAREHOUSES", "WAREHOUSES_HINT"],
                ["/storage/plans", "STORAGE_PLANS", "PLANS_HINT"],
                [
                  "/storage/supply-requests",
                  "SUPPLY_REQUESTS",
                  "SUPPLIES_HINT",
                ],
              ].map(([path, title, hint]) => (
                <Paper
                  key={path}
                  variant="outlined"
                  className="p-24 rounded-16 space-y-16"
                >
                  <Typography className="text-18 font-semibold">
                    {t(title)}
                  </Typography>
                  <Typography color="text.secondary">{t(hint)}</Typography>
                  <Button
                    component={Link}
                    to={path}
                    variant="outlined"
                    color="primary"
                  >
                    {t("OPEN")}
                  </Button>
                </Paper>
              ))}
            </div>
          ) : (
            <>
              {error && !dialog && <Alert severity="error">{error}</Alert>}
              {success && (
                <Alert severity="success">{t("SUBSCRIPTION_SUCCESS")}</Alert>
              )}
              {subscription.isError && (
                <Alert
                  severity="error"
                  action={
                    <Button onClick={() => subscription.refetch()}>
                      {t("RETRY")}
                    </Button>
                  }
                >
                  {t("LOAD_ERROR")}
                </Alert>
              )}
              {active && (
                <Paper
                  variant="outlined"
                  className="p-24 rounded-16 space-y-16"
                  data-testid="active-storage-subscription"
                >
                  <div className="flex items-center justify-between flex-wrap gap-12">
                    <Typography className="text-20 font-bold">
                      {subscription.currentData.plan.name}
                    </Typography>
                    <Chip color="success" label={t("SUBSCRIPTION_ACTIVE")} />
                  </div>
                  <Typography color="text.secondary">
                    {t("EXPIRES_AT")}:{" "}
                    {new Date(
                      subscription.currentData.endsAt,
                    ).toLocaleDateString()}
                  </Typography>
                  <div className="flex flex-wrap gap-8">
                    {subscription.currentData.plan.features.map((type) => (
                      <Chip key={type} label={type} variant="outlined" />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-12">
                    <Button
                      component={Link}
                      to="/storage/supply-requests/new"
                      variant="contained"
                      color="primary"
                    >
                      {t("NEW_SUPPLY")}
                    </Button>
                    <Button
                      component={Link}
                      to="/storage/products"
                      variant="outlined"
                      color="primary"
                    >
                      {t("STORAGE_PRODUCTS")}
                    </Button>
                    <Button
                      component={Link}
                      to="/storage/supply-requests"
                      variant="outlined"
                      color="primary"
                    >
                      {t("SUPPLY_REQUESTS")}
                    </Button>
                  </div>
                </Paper>
              )}
              {pending && !active && (
                <Alert
                  severity="info"
                  action={
                    <Button onClick={() => setDialog(true)}>
                      {t("RESUME_CHECKOUT")}
                    </Button>
                  }
                >
                  {t("CHECKOUT_SAVED")}
                </Alert>
              )}
              <div>
                <Typography className="text-20 font-bold">
                  {t("CHOOSE_PLAN")}
                </Typography>
                <Typography color="text.secondary" className="mt-8">
                  {t("NATIVE_SUBSCRIBE_HINT")}
                </Typography>
              </div>
              {plans.isError && (
                <Alert
                  severity="error"
                  action={
                    <Button onClick={() => plans.refetch()}>
                      {t("RETRY")}
                    </Button>
                  }
                >
                  {t("LOAD_ERROR")}
                </Alert>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-20">
                {(Array.isArray(plans.currentData) ? plans.currentData : [])
                  .slice(page * 12, (page + 1) * 12)
                  .map((plan) => (
                    <Paper
                      key={plan.id}
                      variant="outlined"
                      className="rounded-16 p-24 flex flex-col gap-16"
                      data-testid={"storage-plan-" + plan.id}
                    >
                      <Typography className="text-18 font-bold">
                        {plan.name}
                      </Typography>
                      <div>
                        {plan.discountPrice != null &&
                          plan.discountPrice < plan.price && (
                            <Typography
                              className="line-through text-13"
                              color="text.secondary"
                            >
                              {Currency(plan.price)}
                            </Typography>
                          )}
                        <Typography
                          className="text-24 font-bold"
                          color="primary"
                        >
                          {Currency(storagePlanPrice(plan))}
                        </Typography>
                        <Typography className="text-12" color="text.secondary">
                          {t("DAYS", { count: plan.durationDays })} ·{" "}
                          {t("EXCLUDES_TAX")}
                        </Typography>
                      </div>
                      <ul className="ps-20 space-y-8 flex-1">
                        {plan.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={
                          !available ||
                          active ||
                          !!pending ||
                          success ||
                          checking
                        }
                        onClick={() => {
                          setError("");
                          setSelected(structuredClone(plan));
                          setDialog(true);
                        }}
                        data-testid={"subscribe-" + plan.id}
                      >
                        {t(active ? "ALREADY_SUBSCRIBED" : "SUBSCRIBE")}
                      </Button>
                    </Paper>
                  ))}
              </div>
              {!plans.isFetching &&
                !plans.isError &&
                !plans.currentData?.length && (
                  <Alert severity="info">{t("NO_PLANS")}</Alert>
                )}
              <TablePagination
                component="div"
                rowsPerPageOptions={[12]}
                count={plans.currentData?.length || 0}
                rowsPerPage={12}
                page={page}
                onPageChange={(_, next) => setPage(next)}
              />
              <Dialog
                open={dialog}
                fullWidth
                maxWidth="sm"
                onClose={() => {
                  if (!checking) setDialog(false);
                }}
              >
                <DialogTitle>
                  {t(pending ? "STORAGE_PAYMENT" : "CONFIRM_SUBSCRIPTION")}
                </DialogTitle>
                <DialogContent className="space-y-16">
                  {pending ? (
                    <>
                      <Typography>
                        {t("CHECKOUT_TOTAL")}: {Currency(pending.payment.total)}
                      </Typography>
                      <Typography color="text.secondary">
                        {t("TAX")}: {Currency(pending.payment.taxTotal)}
                      </Typography>
                      {!pending.gatewayId && (
                        <MoyasarCheckout
                          checkout={pending.checkout}
                          paymentId={pending.payment.id}
                          onPaymentCreated={(id) =>
                            remember({ ...pending, gatewayId: id })
                          }
                        />
                      )}
                      {pending.gatewayId && (
                        <Button
                          component={Link}
                          to={
                            "/storage/payment-result?paymentId=" +
                            encodeURIComponent(pending.payment.id) +
                            "&id=" +
                            encodeURIComponent(pending.gatewayId)
                          }
                          variant="outlined"
                          color="primary"
                        >
                          {t("RETRY_VERIFICATION")}
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography className="font-semibold text-18">
                        {selected?.name}
                      </Typography>
                      <Typography>
                        {t("PRICE")}:{" "}
                        {selected && Currency(storagePlanPrice(selected))}
                      </Typography>
                      <Typography color="text.secondary">
                        {t("NATIVE_SUBSCRIBE_HINT")}
                      </Typography>
                    </>
                  )}
                  {error && <Alert severity="error">{error}</Alert>}
                </DialogContent>
                <DialogActions>
                  <Button
                    variant="outlined"
                    color="primary"
                    disabled={checking}
                    onClick={() => setDialog(false)}
                  >
                    {t(pending ? "CLOSE" : "CANCEL")}
                  </Button>
                  {!pending && (
                    <LoadingButton
                      variant="contained"
                      color="primary"
                      loading={checking || writing.isLoading}
                      disabled={!available}
                      onClick={confirm}
                      data-testid="confirm-storage-subscription"
                    >
                      {t("CONTINUE_PAYMENT")}
                    </LoadingButton>
                  )}
                </DialogActions>
              </Dialog>
            </>
          )}
        </div>
      }
      scroll="normal"
    />
  );
}
export default function StorageHome() {
  return (
    <StorageGate>
      <StorageWorkspace />
    </StorageGate>
  );
}
