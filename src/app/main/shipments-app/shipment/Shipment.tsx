import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Divider, Typography } from "@mui/material";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import FusePageCarded from "@fuse/core/FusePageCarded";
import FuseLoading from "@fuse/core/FuseLoading";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { useCreateShipmentUserMutation } from "src/app/main/shipment-users-app/ShipmentUsersApi";
import {
  useLazyGetStorageSubscriptionQuery,
  useLazyGetStorageProductsQuery,
  useLazyGetWarehousesQuery,
} from "../../storage-app/StorageApi";
import { hasActiveStorageSubscription } from "../../storage-app/Utils";
import {
  useGetShipmentQuery,
  useGetShipmentAccountQuery,
  useReviewShipmentCompaniesMutation,
  useCreateShipmentMutation,
} from "../ShipmentsApi";
import {
  canCreateShipment,
  canViewShipments,
  canGenerateReturnedShipment,
  shipmentCompaniesReviewValues,
  shipmentCarrierChoices,
  isShipmentCompaniesReview,
  shipmentVolumetricWeight,
  type ReceiverCarrierReview,
  decompressShipment,
  generateReturnedShipment,
  shipmentContactValues,
  shipmentErrorMessage,
  shipmentPath,
} from "../Utils";
import ShipmentModel from "../models/ShipmentModel";
import { ShipmentFormValues, shipmentSchema } from "../models/ShipmentSchema";
import ShipmentHeader from "./ShipmentHeader";
import ShipmentView from "./ShipmentView";
import ShipmentSection, {
  ShipmentSectionStatus,
} from "./components/ShipmentSection";
import ShipmentContactFields from "./components/ShipmentContactFields";
import ShippingTypeSection from "./sections/ShippingTypeSection";
import ReceiversSection from "./sections/ReceiversSection";
import CarrierSection from "./sections/CarrierSection";
import ParcelSection from "./sections/ParcelSection";
import WarehouseFulfillment from "./sections/WarehouseFulfillment";
import ShipmentGeoField from "./components/ShipmentGeoField";
import PaymentSection from "./sections/PaymentSection";
import ShipmentSummary, { ShipmentOutcome } from "./sections/ShipmentSummary";
import {
  ShipmentSectionId,
  sectionOfField,
  shipmentSectionIds,
} from "./sectionUtils";
export default function Shipment({
  calculator = false,
}: {
  calculator?: boolean;
}) {
  const { t } = useTranslation("shipmentsApp"),
    user = useAppSelector(selectUser),
    navigate = useNavigate(),
    location = useLocation(),
    {
      shipmentId = "new",
      shippingCompanyId = "all",
      shippingType = "all",
    } = useParams();
  const returnId = new URLSearchParams(location.search).get("returnFrom"),
    isNew = calculator || shipmentId === "new",
    mode = calculator ? "calculator" : returnId ? "return" : "create",
    key = `${shipmentId}/${shippingCompanyId}/${shippingType}/${returnId}/${calculator}`;
  const permitted = calculator
      ? !!user
      : isNew
        ? canCreateShipment(user)
        : canViewShipments(user),
    readId = returnId || shipmentId;
  const record = useGetShipmentQuery(readId, {
    skip: !permitted || (isNew && !returnId),
    refetchOnMountOrArgChange: true,
  });
  const existing = useMemo(
    () => (record.currentData ? decompressShipment(record.currentData) : null),
    [record.currentData],
  );
  const account = useGetShipmentAccountQuery("me", {
    skip: !permitted || !isNew,
    refetchOnMountOrArgChange: true,
  });
  const [stage, setStage] = useState<"details" | "review">("details");
  const schema = useMemo(() => shipmentSchema(t, mode, "details"), [t, mode]);
  const reviewSchema = useMemo(() => shipmentSchema(t, mode), [t, mode]);
  const lastReviewed = useRef<string>();
  const methods = useForm<ShipmentFormValues>({
      mode: "onChange",
      defaultValues: ShipmentModel(),
      resolver: zodResolver(schema),
    }),
    form = methods.watch();
  const [ready, setReady] = useState<string>(),
    initialized = useRef<string>(),
    [busy, setBusy] = useState(false),
    [action, setAction] = useState<"review" | "create">(),
    busyRef = useRef(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState<string>(),
    [comparisons, setComparisons] = useState<ReceiverCarrierReview[]>([]),
    [quoteSignature, setQuoteSignature] = useState<string>(),
    [outcomes, setOutcomes] = useState<ShipmentOutcome[]>([]);
  const [warehouseLocked, setWarehouseLocked] = useState(false);
  const [readStorageSubscription] = useLazyGetStorageSubscriptionQuery();
  const [readStorageProducts] = useLazyGetStorageProductsQuery();
  const [readWarehouses] = useLazyGetWarehousesQuery();
  const [quote] = useReviewShipmentCompaniesMutation(),
    [create] = useCreateShipmentMutation(),
    [saveContact] = useCreateShipmentUserMutation();
  const completed = outcomes
    .filter((item) => item.success || item.uncertain)
    .map((item) => item.key);
  useEffect(() => {
    if (!isNew || initialized.current === key || (returnId && !existing))
      return;
    const values = ShipmentModel(
      returnId
        ? generateReturnedShipment(existing)
        : {
            shippingCompanyId: "",
            method: ["local", "international"].includes(shippingType)
              ? shippingType
              : "local",
          },
    );
    if (calculator) {
      values.senderName = "Test Test";
      values.senderEmail = "test@test.com";
      values.senderPhone = "123456789";
      values.receiverName = "Test Test";
      values.receiverEmail = "test@test.com";
      values.receiverPhone = "123456789";
      values.description = "test";
    }
    methods.reset(values);
    initialized.current = key;
    reviewSequence.current++;
    busyRef.current = false;
    setBusy(false);
    setAction(undefined);
    setReady(key);
    setComparisons([]);
    setOutcomes([]);
    setQuoteSignature(undefined);
    setError(undefined);
    setWarehouseLocked(false);
    setStage("details");
    lastReviewed.current = undefined;
  }, [key, isNew, returnId, existing, calculator, methods.reset]);
  function inputs(values: ShipmentFormValues) {
    const contacts =
      mode === "create"
        ? values.receivers.map((item) => ({
            key: item.key,
            data: { ...values, ...item },
          }))
        : [{ key: "single", data: values }];
    return contacts
      .filter((item) => !completed.includes(item.key))
      .map((item) => ({
        key: item.key,
        data: item.data,
        payload: shipmentCompaniesReviewValues(item.data),
      }));
  }
  const signature = JSON.stringify(
      inputs(form).map((item) => ({ key: item.key, payload: item.payload })),
    ),
    stale = signature !== quoteSignature;
  const choices = shipmentCarrierChoices(comparisons, !calculator).map(
    (choice) => {
      const company = choice.shippingCompany;
      const restriction =
        form.coupon?.shippingCompanyId &&
        form.coupon.shippingCompanyId !== company.id
          ? t("COUPON_NOT_AVILABLE_SHIPPING_COMPANY")
          : company.isAuthorizationRequired &&
              !account.currentData?.isAuthorized
            ? t("SHIPPING_COMPANY_REQUIRED_AUTHORIZATION")
            : form.isCod &&
                company.shippingMethods &&
                !company.shippingMethods.includes("cashOnDelivery")
              ? t("SHIPPING_COMPANY_DOESNT_SUPPORT_COD")
              : form.weight <
                  shipmentVolumetricWeight({
                    ...form,
                    shippingCompany: company,
                  })
                ? `${t("MUST_BE_MORE_THAN_OR_EQUAL")} ${shipmentVolumetricWeight({ ...form, shippingCompany: company })} ${t("KG")}`
                : undefined;
      return restriction
        ? {
            ...choice,
            eligible: false,
            reasons: [...choice.reasons, { key: "", message: restriction }],
          }
        : choice;
    },
  );
  const selectedChoice = choices.find(
    (choice) =>
      choice.shippingCompany.id === form.shippingCompanyId && choice.eligible,
  );
  const quotes = selectedChoice
    ? comparisons.map((review) => {
        const offer = review.response?.suitableCompanies.find(
          (row) => row.shippingCompany.id === form.shippingCompanyId,
        );
        return {
          key: review.key,
          cost: offer?.calculation,
          quoteId: offer?.quoteId,
          error: review.error,
        };
      })
    : [];
  const reviewSequence = useRef(0);
  const accountReady =
    !!account.currentData && !account.isFetching && !account.isError;
  async function checkStock(pending: ReturnType<typeof inputs>) {
    const products =
      pending[0]?.payload.products?.filter((item) => item.warehouseProductId) ||
      [];
    if (!products.length) return;
    const warehouseId = pending[0].data.warehouseId;
    const [subscription, inventory, warehouses] = await Promise.all([
      readStorageSubscription(user.id, false).unwrap(),
      readStorageProducts({ warehouseId, userId: user.id }, false).unwrap(),
      readWarehouses({}, false).unwrap(),
    ]);
    const warehouse = warehouses.find((row) => row.id === warehouseId);
    if (
      !warehouse?.pickup ||
      warehouse.name !== pending[0].data.warehouse?.name ||
      JSON.stringify(warehouse.pickup) !==
        JSON.stringify(pending[0].data.warehouse?.pickup)
    )
      throw new Error(t("STORAGE_PICKUP_CHANGED"));
    if (
      user.role !== "user" ||
      !hasActiveStorageSubscription(subscription, user.id) ||
      !Array.isArray(inventory) ||
      products.some(
        (item) =>
          !inventory.some(
            (row) =>
              row.id === item.warehouseProductId &&
              row.userId === user.id &&
              row.warehouseId === warehouseId &&
              row.quantity >= item.quantity * pending.length,
          ),
      )
    )
      throw new Error(t("STORAGE_STOCK_UNAVAILABLE"));
  }

  async function review(values: ShipmentFormValues) {
    if (busyRef.current || uploading || !permitted) return;
    const sequence = ++reviewSequence.current;
    busyRef.current = true;
    setBusy(true);
    setAction("review");
    setError(undefined);
    setQuoteSignature(undefined);
    const snapshot = structuredClone(inputs(values)),
      fingerprint = JSON.stringify(
        snapshot.map((item) => ({ key: item.key, payload: item.payload })),
      ),
      result: ReceiverCarrierReview[] = [];
    lastReviewed.current = fingerprint;
    try {
      await checkStock(snapshot);
      for (const item of snapshot) {
        try {
          const response = await quote(item.payload).unwrap();
          if (!isShipmentCompaniesReview(response))
            throw new Error(t("QUOTE_ERROR"));
          result.push({ key: item.key, response });
        } catch (failure) {
          result.push({
            key: item.key,
            error: shipmentErrorMessage(failure, t("QUOTE_ERROR")),
          });
        }
        if (sequence !== reviewSequence.current) return;
      }
      setComparisons(result);
      setQuoteSignature(fingerprint);
      const selectedId = methods.getValues("shippingCompanyId");
      if (
        selectedId &&
        !shipmentCarrierChoices(result, !calculator).some(
          (choice) =>
            choice.eligible && choice.shippingCompany.id === selectedId,
        )
      ) {
        methods.setValue("shippingCompanyId", "");
        methods.setValue("shippingCompany", null);
      }
    } catch (failure) {
      if (sequence === reviewSequence.current)
        setError(shipmentErrorMessage(failure, t("QUOTE_ERROR")));
    } finally {
      if (sequence === reviewSequence.current) {
        busyRef.current = false;
        setBusy(false);
        setAction(undefined);
      }
    }
  }
  async function submit(values: ShipmentFormValues) {
    if (busyRef.current || uploading || !permitted || !accountReady) return;
    const pending = inputs(values),
      fingerprint = JSON.stringify(
        pending.map((item) => ({ key: item.key, payload: item.payload })),
      );
    if (
      !selectedChoice ||
      fingerprint !== quoteSignature ||
      pending.some(
        (item) => !quotes.some((q) => q.key === item.key && q.cost && !q.error),
      )
    ) {
      setError(t("QUOTE_CHANGED"));
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setAction("create");
    setError(undefined);
    const results = [
      ...outcomes.filter((item) => item.success || item.uncertain),
    ];
    try {
      const fresh = await account.refetch().unwrap();
      if (
        values.shippingCompany?.isAuthorizationRequired &&
        !fresh.isAuthorized
      )
        throw new Error(t("SHIPPING_COMPANY_REQUIRED_AUTHORIZATION"));
      await checkStock(pending);
      const total = quotes
        .filter((item) => pending.some((input) => input.key === item.key))
        .reduce((sum, item) => sum + (item.cost?.total || 0), 0);
      if (total > (fresh.balance ?? 0))
        throw new Error(t("NOT_ENOUGH_BALANCE"));
      let senderId = values.senderId;
      for (let index = 0; index < pending.length; index++) {
        const item = pending[index];
        let attempted = false;
        const reviewedPayload = JSON.stringify(item.payload);
        try {
          if (mode === "create") {
            if (
              values.fulfillmentSource !== "warehouse" &&
              (!senderId || senderId === "new")
            ) {
              const sender = await saveContact(
                shipmentContactValues(item.data, "sender"),
              ).unwrap();
              if (!sender.id) throw new Error(t("CONTACT_SAVE_ERROR"));
              senderId = sender.id;
              methods.setValue("senderId", senderId);
            }
            let receiverId = item.data.receiverId;
            if (!receiverId || receiverId === "new") {
              const receiver = await saveContact(
                shipmentContactValues(item.data, "receiver"),
              ).unwrap();
              if (!receiver.id) throw new Error(t("CONTACT_SAVE_ERROR"));
              receiverId = receiver.id;
              const receiverIndex = methods
                .getValues("receivers")
                .findIndex((receiver) => receiver.key === item.key);
              if (receiverIndex >= 0)
                methods.setValue(
                  `receivers.${receiverIndex}.receiverId`,
                  receiverId,
                );
            }
            if (values.fulfillmentSource !== "warehouse")
              item.payload.senderId = senderId;
            item.payload.receiverId = receiverId;
          }
          let quoteId = quotes.find((row) => row.key === item.key)?.quoteId;
          if (reviewedPayload !== JSON.stringify(item.payload)) {
            // Receiver/sender contact IDs change the fingerprint: renew the same carrier's offer.
            const renewed = await quote(item.payload).unwrap();
            if (!isShipmentCompaniesReview(renewed))
              throw new Error(t("QUOTE_ERROR"));
            const offer = renewed.suitableCompanies?.find(
              (row) => row.shippingCompany.id === values.shippingCompanyId,
            );
            if (
              !offer?.quoteId ||
              offer.calculation.total !==
                quotes.find((row) => row.key === item.key)?.cost?.total
            )
              throw new Error(t("QUOTE_CHANGED"));
            quoteId = offer.quoteId;
          }
          if (!quoteId) throw new Error(t("STORAGE_QUOTE_REQUIRED"));
          const payload = {
            ...item.payload,
            shippingCompanyId: values.shippingCompanyId,
            quoteId,
          };
          if (index) await new Promise((resolve) => setTimeout(resolve, 3000));
          attempted = true;
          const response = await create(payload).unwrap();
          const entity =
            "message" in response && !("id" in response)
              ? null
              : decompressShipment(response as never);
          if (!entity?.id && !("message" in response))
            throw new Error(t("CREATE_ERROR"));
          results.push({
            key: item.key,
            success: true,
            id: entity?.id,
            message: "message" in response ? response.message : undefined,
          });
        } catch (failure) {
          const status = (failure as { status?: number | string }).status;
          const uncertain =
            values.fulfillmentSource === "warehouse" &&
            attempted &&
            (status === "NETWORK_ERROR" ||
              (typeof status === "number" && status >= 500) ||
              status === undefined);
          results.push({
            key: item.key,
            success: false,
            uncertain,
            message: uncertain
              ? t("STORAGE_RESULT_UNKNOWN")
              : shipmentErrorMessage(failure, t("CREATE_ERROR")),
          });
        }
        setOutcomes([...results]);
      }
      if (
        results.every((item) => item.success) &&
        pending.every((item) =>
          results.some((result) => result.key === item.key && result.success),
        )
      )
        navigate(shipmentPath(shippingCompanyId, shippingType), {
          replace: true,
          state: { shipmentCreated: true },
        });
    } catch (failure) {
      setError(shipmentErrorMessage(failure, t("CREATE_ERROR")));
    } finally {
      setWarehouseLocked(
        results.some((item) => item.success || item.uncertain),
      );
      busyRef.current = false;
      setBusy(false);
      setAction(undefined);
    }
  }
  function goToSection(id: string) {
    document
      .getElementById(`shipment-section-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const invalid = (errors: typeof methods.formState.errors) => {
    setError(t("CHECK_REQUIRED_FIELDS"));
    const first = shipmentSectionIds.find((id) =>
      Object.keys(errors).some((field) => sectionOfField(field) === id),
    );
    if (first && first !== "carrier") setStage("details");
    if (
      Object.keys(errors).some((field) =>
        ["fulfillmentSource", "warehouseId", "warehouseItems"].includes(field),
      )
    )
      requestAnimationFrame(() => goToSection("fulfillment"));
    else if (first) requestAnimationFrame(() => goToSection(first));
  };
  const continueNow = methods.handleSubmit(() => {
    setStage("review");
    setError(undefined);
    methods.clearErrors();
    requestAnimationFrame(() => goToSection("carrier"));
  }, invalid);
  const reviewNow = methods.handleSubmit(review, invalid),
    createNow = methods.handleSubmit((values) => {
      const result = reviewSchema.safeParse(values);
      if (result.success === false) {
        for (const issue of result.error.issues)
          methods.setError(issue.path.join(".") as never, {
            type: "validate",
            message: issue.message,
          });
        invalid(methods.formState.errors);
        return;
      }
      return submit(values);
    }, invalid);
  const reviewValidation = reviewSchema.safeParse(form);
  const detailsValid = schema.safeParse(form).success;
  useEffect(() => {
    if (
      !isNew ||
      ready !== key ||
      stage !== "review" ||
      !detailsValid ||
      !accountReady ||
      busy ||
      uploading ||
      lastReviewed.current === signature
    )
      return;
    // Let canonical geography finish hydrating before comparing each receiver.
    const timer = setTimeout(() => {
      const values = methods.getValues();
      if (schema.safeParse(values).success) void review(values);
    }, 250);
    return () => clearTimeout(timer);
  }, [
    isNew,
    ready,
    key,
    stage,
    signature,
    detailsValid,
    accountReady,
    busy,
    uploading,
  ]);
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  if (!permitted) return <Navigate to="/home" replace />;
  if (record.isError && (!isNew || returnId))
    return (
      <div className="p-24">
        <Alert severity="error">{t("LOAD_ERROR")}</Alert>
        <Button onClick={() => record.refetch()}>{t("RETRY")}</Button>
      </div>
    );
  if (!isNew) {
    if (!existing) return <FuseLoading />;
    if (user.role === "user" && existing.userId !== user.id)
      return <Navigate to="/home" replace />;
    return <ShipmentView shipment={existing} />;
  }
  if (returnId && existing && !canGenerateReturnedShipment(user, existing))
    return <Navigate to="/home" replace />;
  if (ready !== key) return <FuseLoading />;
  const busyOrUploading = busy || uploading,
    issues = schema.safeParse(form),
    failing = new Set(
      issues.success === false
        ? issues.error.issues.map((issue) =>
            sectionOfField(String(issue.path[0] ?? "")),
          )
        : [],
    ),
    shown = new Set(
      Object.keys(methods.formState.errors).map((field) =>
        sectionOfField(field),
      ),
    ),
    statusOf = (id: ShipmentSectionId): ShipmentSectionStatus =>
      shown.has(id) ? "error" : failing.has(id) ? "pending" : "complete";
  const checklist = (["route", "parcel"] as const).map((id) => ({
      id,
      label: t(
        {
          route: "ROUTE_AND_CONTACTS",
          parcel: "PARCEL_AND_PAYMENT",
        }[id],
      ),
      status: statusOf(id),
    })),
    quotesReady =
      !!quotes.length && !stale && quotes.every((item) => !item.error);
  const summary = (
    <ShipmentSummary
      form={form}
      quotes={quotes}
      outcomes={calculator ? [] : outcomes}
      stale={stale}
      busy={busyOrUploading}
      action={action}
      checklist={checklist}
      calculator={calculator}
      stage={stage}
      detailsLocked={warehouseLocked}
      canCreate={
        !uploading &&
        !busy &&
        accountReady &&
        inputs(form).length > 0 &&
        quotesReady &&
        reviewValidation.success
      }
      onContinue={continueNow}
      onEdit={() => {
        setStage("details");
        setError(undefined);
      }}
      onReview={reviewNow}
      onCreate={createNow}
      onGoTo={(id) => {
        setStage("details");
        requestAnimationFrame(() => goToSection(id));
      }}
    />
  );
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={
          <ShipmentHeader calculator={calculator} returned={!!returnId} />
        }
        content={
          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              if (stage === "details") void continueNow();
            }}
            data-testid="shipment-editor"
            className="w-full min-w-0 p-16 sm:p-24"
            sx={{
              bgcolor: "background.default",
              "& .MuiOutlinedInput-root": { borderRadius: "10px" },
            }}
          >
            <div className="mx-auto w-full max-w-7xl space-y-20">
              <Box
                className="grid grid-cols-2 gap-12 rounded-16 border-1 p-12 sm:p-16"
                sx={{ bgcolor: "background.paper", borderColor: "divider" }}
                aria-label={t("SHIPMENT_PROGRESS")}
              >
                {(["details", "review"] as const).map((step, index) => (
                  <div
                    key={step}
                    className="flex min-w-0 items-center gap-12"
                    aria-current={stage === step ? "step" : undefined}
                  >
                    <Box
                      className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full text-14 font-bold"
                      sx={{
                        bgcolor:
                          stage === step ? "primary.main" : "action.hover",
                        color:
                          stage === step
                            ? "primary.contrastText"
                            : "text.secondary",
                      }}
                    >
                      {stage === "review" && step === "details" ? (
                        <FuseSvgIcon size={20}>
                          heroicons-outline:check
                        </FuseSvgIcon>
                      ) : (
                        index + 1
                      )}
                    </Box>
                    <div className="min-w-0">
                      <Typography className="text-13 sm:text-14 font-semibold">
                        {t(
                          step === "details"
                            ? "SHIPMENT_DETAILS_STEP"
                            : "CARRIER_REVIEW_STEP",
                        )}
                      </Typography>
                      <Typography
                        className="hidden sm:block text-12"
                        color="text.secondary"
                      >
                        {t(
                          step === "details"
                            ? "DETAILS_STEP_HINT"
                            : "REVIEW_STEP_HINT",
                        )}
                      </Typography>
                    </div>
                  </div>
                ))}
              </Box>
              {account.isError && (
                <Alert
                  severity="error"
                  action={
                    <Button onClick={() => account.refetch()}>
                      {t("RETRY")}
                    </Button>
                  }
                >
                  {t("ACCOUNT_LOAD_ERROR")}
                </Alert>
              )}
              {error && <Alert severity="error">{error}</Alert>}
              {warehouseLocked && (
                <Alert severity="info">{t("STORAGE_ATTEMPT_LOCK")}</Alert>
              )}
              {/* Keep canonical geography and saved contacts synchronized between steps. */}
              <div
                hidden={stage !== "details"}
                className="space-y-20"
                data-testid="shipment-details-step"
              >
                {mode === "create" && !calculator && (
                  <Box
                    id="shipment-section-fulfillment"
                    className="rounded-16 border-1 p-16 sm:p-24"
                    sx={{ bgcolor: "background.paper", borderColor: "divider" }}
                  >
                    <WarehouseFulfillment
                      disabled={
                        busyOrUploading ||
                        warehouseLocked ||
                        stage !== "details"
                      }
                      completed={completed}
                    />
                  </Box>
                )}
                <ShipmentSection
                  id="route"
                  index={1}
                  icon="heroicons-outline:location-marker"
                  title={t("ROUTE_AND_CONTACTS")}
                  subtitle={t("ROUTE_AND_CONTACTS_HINT")}
                  status={statusOf("route")}
                >
                  <ShippingTypeSection
                    disabled={busyOrUploading || warehouseLocked}
                  />
                  <Divider className="my-24" />
                  <div className="grid grid-cols-1 gap-24 lg:grid-cols-2">
                    <div
                      className="min-w-0 space-y-16"
                      id="shipment-section-sender"
                    >
                      <div>
                        <Typography className="text-16 font-semibold">
                          {t(calculator ? "SHIPPING_FROM" : "SENDER_DETAILS")}
                        </Typography>
                        <Typography
                          className="text-12 mt-4"
                          color="text.secondary"
                        >
                          {t("SENDER_SECTION_HINT")}
                        </Typography>
                      </div>
                      {form.fulfillmentSource === "warehouse" ? (
                        <div
                          className="rounded-12 border-1 p-16 space-y-12"
                          data-testid="warehouse-sender-summary"
                        >
                          <Typography className="font-semibold">
                            {form.warehouse?.name ||
                              t("STORAGE_SELECT_WAREHOUSE")}
                          </Typography>
                          <Typography color="text.secondary">
                            {form.warehouse?.address}
                          </Typography>
                          <Typography dir="ltr">
                            {form.warehouse?.pickup?.phone}
                          </Typography>
                          <Typography
                            className="text-13"
                            color="text.secondary"
                          >
                            {t("STORAGE_AUTOMATIC_SENDER")}
                          </Typography>
                          {!form.warehouse?.pickup && (
                            <Alert severity="warning">
                              {t("STORAGE_PICKUP_REQUIRED")}
                            </Alert>
                          )}
                          {Object.entries(methods.formState.errors)
                            .filter(
                              ([field, error]) =>
                                field.startsWith("sender") &&
                                typeof error?.message === "string",
                            )
                            .map(([field, error]) => (
                              <Alert key={field} severity="error">
                                {String(error.message)}
                              </Alert>
                            ))}
                          <div hidden aria-hidden="true">
                            <ShipmentGeoField
                              prefix="sender"
                              kind="country"
                              disabled
                            />
                            <ShipmentGeoField
                              prefix="sender"
                              kind="state"
                              disabled
                            />
                            <ShipmentGeoField
                              prefix="sender"
                              kind="city"
                              disabled
                            />
                          </div>
                        </div>
                      ) : (
                        <ShipmentContactFields
                          prefix="sender"
                          calculator={calculator}
                          disabled={
                            busyOrUploading ||
                            warehouseLocked ||
                            stage !== "details"
                          }
                        />
                      )}
                    </div>
                    <div
                      className="min-w-0 space-y-16"
                      id="shipment-section-receiver"
                    >
                      <div>
                        <Typography className="text-16 font-semibold">
                          {t(calculator ? "SHIPPING_TO" : "RECEIVER_DETAILS")}
                        </Typography>
                        <Typography
                          className="text-12 mt-4"
                          color="text.secondary"
                        >
                          {t("RECEIVER_SECTION_HINT")}
                        </Typography>
                      </div>
                      {calculator || mode === "return" ? (
                        <ShipmentContactFields
                          prefix="receiver"
                          calculator={calculator}
                          disabled={
                            busyOrUploading ||
                            warehouseLocked ||
                            stage !== "details"
                          }
                        />
                      ) : (
                        <ReceiversSection
                          disabled={
                            busyOrUploading ||
                            warehouseLocked ||
                            stage !== "details"
                          }
                          completed={completed}
                        />
                      )}
                    </div>
                  </div>
                </ShipmentSection>
                <ShipmentSection
                  id="parcel"
                  index={2}
                  icon="heroicons-outline:cube"
                  title={t(
                    calculator ? "SHIPMENT_DETAILS" : "PARCEL_AND_PAYMENT",
                  )}
                  subtitle={t("PARCEL_AND_PAYMENT_HINT")}
                  status={statusOf("parcel")}
                >
                  <ParcelSection
                    calculator={calculator}
                    disabled={
                      busyOrUploading || warehouseLocked || stage !== "details"
                    }
                    onUploadBusy={setUploading}
                  />
                  {!calculator && (
                    <div id="shipment-section-payment">
                      <Divider className="my-24" />
                      <PaymentSection
                        returned={mode === "return"}
                        disabled={
                          busyOrUploading ||
                          warehouseLocked ||
                          stage !== "details"
                        }
                      />
                    </div>
                  )}
                </ShipmentSection>
                {stage === "details" && summary}
              </div>
              {stage === "review" && (
                <div
                  className="grid grid-cols-1 items-start gap-20 lg:grid-cols-[minmax(0,1fr)_360px]"
                  data-testid="shipment-carrier-step"
                >
                  <div className="min-w-0 space-y-16">
                    <ShipmentSection
                      id="carrier"
                      icon="heroicons-outline:truck"
                      title={t("CHOOSE_CARRIER")}
                      subtitle={t("CHOOSE_CARRIER_HINT")}
                    >
                      <CarrierSection
                        choices={choices}
                        loading={busy && action === "review"}
                        stale={stale}
                        disabled={
                          busyOrUploading || warehouseLocked || !accountReady
                        }
                        receiverName={(key) =>
                          form.receivers.find(
                            (receiver) => receiver.key === key,
                          )?.receiverName ||
                          (key === "single" ? form.receiverName : "")
                        }
                        onChoose={() => {
                          setError(undefined);
                          methods.clearErrors();
                        }}
                      />
                      {comparisons
                        .filter((review) => review.error)
                        .map((review) => (
                          <Alert key={review.key} severity="error">
                            {
                              form.receivers.find(
                                (receiver) => receiver.key === review.key,
                              )?.receiverName
                            }
                            : {review.error}
                          </Alert>
                        ))}
                    </ShipmentSection>
                    {form.shippingCompanyId &&
                      reviewValidation.success === false && (
                        <Alert
                          severity="warning"
                          data-testid="carrier-validation"
                          action={
                            <Button
                              disabled={busyOrUploading}
                              onClick={() => setStage("details")}
                            >
                              {t("EDIT_DETAILS")}
                            </Button>
                          }
                        >
                          <Typography className="text-13 font-semibold">
                            {t("CARRIER_DETAILS_REQUIRED")}
                          </Typography>
                          <ul className="my-8 ps-20 list-disc text-13 space-y-4">
                            {[
                              ...new Set(
                                reviewValidation.error.issues.map(
                                  (issue) => issue.message,
                                ),
                              ),
                            ].map((message) => (
                              <li key={message}>{message}</li>
                            ))}
                          </ul>
                        </Alert>
                      )}
                    <Alert severity="info" icon={false}>
                      {t("FINAL_CONFIRMATION_HINT")}
                    </Alert>
                  </div>
                  <aside className="min-w-0 lg:sticky lg:top-16">
                    {summary}
                  </aside>
                </div>
              )}
            </div>
          </Box>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
