import { useEffect, useRef, useState } from "react";
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
import { Link, Navigate, useSearchParams, useNavigate } from "react-router-dom";
import {
  storageSubscriptionOperation,
  toStorageSubscriptionOperationTitle,
} from "./Utils";
import { useTranslation } from "react-i18next";
import FusePageCarded from "@fuse/core/FusePageCarded";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import Currency from "../utils/currencyFormatter";
import {
  useGetStoragePlansQuery,
  useLazyGetStoragePlanQuery,
} from "../storage-app/StorageApi";
import {
  useGetStorageSubscriptionQuery,
  useSubscribeStorageMutation,
  type StorageCheckoutResponse,
} from "./StorageSubscriptionsApi";
import {
  canManageStorage,
  toStorageTypeTitle,
  hasActiveStorageSubscription,
  storageError,
  storagePlanPrice,
} from "../storage-app/Utils";
import type IStoragePlan from "../storage-app/models/IStoragePlan";
import StorageGate from "../storage-app/shared/StorageGate";
import StorageHeader from "../storage-app/shared/StorageHeader";
import {
  getHostedCheckoutUrl,
  ownsPayment,
  paymentType,
  paymentMethodType,
  paymentStatus,
} from "../payments-app/Utils";
import { isDemoMode } from "src/app/demo/demoMode";
type Pending = StorageCheckoutResponse;
function StorageWorkspace() {
  const user = useAppSelector(selectUser),
    { t } = useTranslation("storageApp"),
    admin = canManageStorage(user),
    [params] = useSearchParams(),
    navigate = useNavigate();
  const requested = params.get("operation"),
    operation =
      requested === storageSubscriptionOperation.renew ||
      requested === storageSubscriptionOperation.upgrade
        ? requested
        : storageSubscriptionOperation.subscribe;
  const [page, setPage] = useState(0),
    [selected, setSelected] = useState<IStoragePlan>(),
    [error, setError] = useState(""),
    [pending, setPending] = useState<Pending>(),
    [dialog, setDialog] = useState(false),
    [accepted, setAccepted] = useState(false),
    [success, setSuccess] = useState(false);
  const busy = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
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
  const eligiblePlans = (
    Array.isArray(plans.currentData) ? plans.currentData : []
  ).filter(
    (plan) =>
      plan.isActive &&
      (operation !== storageSubscriptionOperation.renew ||
        plan.id === subscription.currentData?.planId) &&
      (operation !== storageSubscriptionOperation.upgrade ||
        plan.id !== subscription.currentData?.planId),
  );
  async function confirm() {
    if (
      busy.current ||
      !selected ||
      !available ||
      (active && operation === storageSubscriptionOperation.subscribe) ||
      pending ||
      success ||
      accepted
    )
      return;
    busy.current = true;
    setChecking(true);
    setError("");
    let posted = false;
    try {
      const [current, currentSubscription] = await Promise.all([
        readPlan(selected.id, false).unwrap(),
        subscription.refetch().unwrap(),
      ]);
      if (
        operation === storageSubscriptionOperation.subscribe &&
        hasActiveStorageSubscription(currentSubscription, user.id)
      )
        throw new Error(t("ALREADY_SUBSCRIBED"));
      if (!mounted.current) return;
      if (
        operation !== storageSubscriptionOperation.subscribe &&
        (!hasActiveStorageSubscription(currentSubscription, user.id) ||
          (operation === storageSubscriptionOperation.renew &&
            currentSubscription.planId !== current.id) ||
          (operation === storageSubscriptionOperation.upgrade &&
            currentSubscription.planId === current.id))
      )
        throw new Error(t("PLAN_CHANGED"));
      if (!current.isActive) throw new Error(t("PLAN_UNAVAILABLE"));
      if (
        JSON.stringify([
          current.price,
          current.discountPrice,
          current.durationDays,
          current.features,
          current.storageTypes,
        ]) !==
        JSON.stringify([
          selected.price,
          selected.discountPrice,
          selected.durationDays,
          selected.features,
          selected.storageTypes,
        ])
      ) {
        setSelected(structuredClone(current));
        throw new Error(t("PLAN_CHANGED"));
      }
      posted = true;
      const result = await subscribe({
        planId: current.id,
        operation,
      }).unwrap();
      if (!mounted.current) return;
      setAccepted(true);
      if (
        !ownsPayment(user, result.payment) ||
        !result.payment.id ||
        result.payment.type !== paymentType.storageSubscription ||
        result.payment.storagePlanId !== current.id
      )
        throw new Error(t("PAYMENT_INVALID"));
      // Lock this creation before optional reads/navigation; neither can cause another charge.
      setPending(result);
      setSelected(undefined);
      if (result.payment.paymentMethodType === paymentMethodType.free) {
        if (
          result.payment.amount !== 0 ||
          result.payment.total !== 0 ||
          result.payment.status !== paymentStatus.confirmed
        )
          throw new Error(t("PAYMENT_INVALID"));
        const fresh = await subscription.refetch().unwrap();
        if (
          !hasActiveStorageSubscription(fresh, user.id) ||
          fresh.paymentId !== result.payment.id
        )
          throw new Error(t("SUBSCRIPTION_REFRESH"));
        setSuccess(true);
        navigate("/storage/subscriptions", { replace: true });
        setDialog(false);
      } else {
        const url = getHostedCheckoutUrl(
          result.checkoutUrl,
          isDemoMode ? window.location.origin : undefined,
        );
        if (!url) throw new Error(t("HOSTED_CHECKOUT_UNAVAILABLE"));
        window.location.assign(url);
      }
    } catch (e) {
      const status = (e as { status?: string | number }).status;
      if (posted && (status === "NETWORK_ERROR" || Number(status) >= 500)) {
        setAccepted(true);
        setError(t("CHECK_SUBSCRIPTION_HISTORY"));
      } else setError(storageError(e, t("SAVE_ERROR")));
    } finally {
      busy.current = false;
      setChecking(false);
    }
  }
  if (admin) return <Navigate to="/storage/subscriptions" replace />;
  if (active && operation === storageSubscriptionOperation.subscribe)
    return <Navigate to="/storage/subscriptions" replace />;
  if (
    !active &&
    operation !== storageSubscriptionOperation.subscribe &&
    !subscription.isFetching &&
    !subscription.isError
  )
    return <Navigate to="/storage/subscribe" replace />;
  return (
    <FusePageCarded
      header={
        <StorageHeader
          title={t(
            operation === storageSubscriptionOperation.subscribe
              ? "SUBSCRIBE_STORAGE"
              : toStorageSubscriptionOperationTitle(operation),
          )}
          description={t("STORAGE_INTRO")}
          back="/storage/subscriptions"
        />
      }
      content={
        <div className="p-16 sm:p-24 space-y-20" data-testid="storage-home">
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
            <Paper
              elevation={0}
              className="rounded-24 p-24 sm:p-40"
              sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
            >
              <Typography className="text-28 sm:text-36 font-bold">
                {t("CHOOSE_PLAN")}
              </Typography>
              <Typography
                color="inherit"
                className="mt-12 opacity-90 leading-relaxed"
              >
                {t("NATIVE_SUBSCRIBE_HINT")}
              </Typography>
            </Paper>
            {plans.isError && (
              <Alert
                severity="error"
                action={
                  <Button onClick={() => plans.refetch()}>{t("RETRY")}</Button>
                }
              >
                {t("LOAD_ERROR")}
              </Alert>
            )}
            <div
              className={
                eligiblePlans.length === 1
                  ? "grid grid-cols-1 max-w-xl mx-auto gap-20"
                  : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-20"
              }
            >
              {eligiblePlans.slice(page * 12, (page + 1) * 12).map((plan) => (
                <Paper
                  key={plan.id}
                  variant="outlined"
                  className="rounded-24 p-24 sm:p-32 flex flex-col gap-20 transition-shadow hover:shadow-lg"
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
                    <Typography className="text-24 font-bold" color="primary">
                      {Currency(storagePlanPrice(plan))}
                    </Typography>
                    <Typography className="text-12" color="text.secondary">
                      {t("DAYS", { count: plan.durationDays })} ·{" "}
                      {t("EXCLUDES_TAX")}
                    </Typography>
                  </div>
                  <div className="flex flex-wrap gap-8">
                    {(plan.storageTypes || []).map((value) => (
                      <Chip
                        key={value}
                        size="small"
                        color="primary"
                        variant="outlined"
                        label={t(toStorageTypeTitle(value))}
                      />
                    ))}
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
                      (active &&
                        operation === storageSubscriptionOperation.subscribe) ||
                      !!pending ||
                      success ||
                      accepted ||
                      checking
                    }
                    onClick={() => {
                      setError("");
                      setSelected(structuredClone(plan));
                      setDialog(true);
                    }}
                    data-testid={"subscribe-" + plan.id}
                  >
                    {t(toStorageSubscriptionOperationTitle(operation))}
                  </Button>
                </Paper>
              ))}
            </div>
            {!plans.isFetching && !plans.isError && !eligiblePlans.length && (
              <Alert severity="info">{t("NO_PLANS")}</Alert>
            )}
            <TablePagination
              component="div"
              rowsPerPageOptions={[12]}
              count={eligiblePlans.length}
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
                    {getHostedCheckoutUrl(
                      pending.checkoutUrl,
                      isDemoMode ? window.location.origin : undefined,
                    ) && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() =>
                          window.location.assign(
                            getHostedCheckoutUrl(
                              pending.checkoutUrl,
                              isDemoMode ? window.location.origin : undefined,
                            ),
                          )
                        }
                      >
                        {t("CONTINUE_PAYMENT")}
                      </Button>
                    )}
                    <Button
                      component={Link}
                      to={
                        "/storage/payment-result?paymentId=" +
                        encodeURIComponent(pending.payment.id)
                      }
                      color="primary"
                      variant="outlined"
                    >
                      {t("RETRY_VERIFICATION")}
                    </Button>
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
                    disabled={!available || accepted}
                    onClick={confirm}
                    data-testid="confirm-storage-subscription"
                  >
                    {t("CONTINUE_PAYMENT")}
                  </LoadingButton>
                )}
              </DialogActions>
            </Dialog>
          </>
        </div>
      }
      scroll="normal"
    />
  );
}
export default function SubscribeStorage() {
  const [params] = useSearchParams(),
    user = useAppSelector(selectUser);
  return (
    <StorageGate>
      <StorageWorkspace
        key={
          user.id +
          ":" +
          (params.get("operation") || storageSubscriptionOperation.subscribe)
        }
      />
    </StorageGate>
  );
}
