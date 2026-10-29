import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button } from "@mui/material";
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
  useGetShipmentQuery,
  useGetShipmentAccountQuery,
  useReviewShipmentMutation,
  useCreateShipmentMutation,
  CreateShipmentApiArg,
} from "../ShipmentsApi";
import {
  canCreateShipment,
  canViewShipments,
  canGenerateReturnedShipment,
  compressShipment,
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
import PaymentSection from "./sections/PaymentSection";
import ShipmentSummary, {
  ShipmentQuote,
  ShipmentOutcome,
} from "./sections/ShipmentSummary";
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
  const schema = useMemo(() => shipmentSchema(t, mode), [t, mode]);
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
    [quotes, setQuotes] = useState<ShipmentQuote[]>([]),
    [quoteSignature, setQuoteSignature] = useState<string>(),
    [outcomes, setOutcomes] = useState<ShipmentOutcome[]>([]);
  const [quote] = useReviewShipmentMutation(),
    [create] = useCreateShipmentMutation(),
    [saveContact] = useCreateShipmentUserMutation();
  const completed = outcomes
    .filter((item) => item.success)
    .map((item) => item.key);
  useEffect(() => {
    if (!isNew || initialized.current === key || (returnId && !existing))
      return;
    const values = ShipmentModel(
      returnId
        ? generateReturnedShipment(existing)
        : {
            shippingCompanyId:
              shippingCompanyId === "all" ? "" : shippingCompanyId,
            method: ["local", "international"].includes(shippingType)
              ? shippingType
              : "local",
          },
    );
    if (calculator) {
      values.senderNamePrefix = "Store";
      values.senderName = "Test Test";
      values.senderEmail = "test@test.com";
      values.senderPhone = "123456789";
      values.receiverName = "Test Test";
      values.receiverEmail = "test@test.com";
      values.receiverPhone = "123456789";
      values.description = "test";
      values.acceptExtraWeightTerms = true;
    }
    methods.reset(values);
    initialized.current = key;
    setReady(key);
    setQuotes([]);
    setOutcomes([]);
    setQuoteSignature(undefined);
    setError(undefined);
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
        payload: compressShipment(item.data),
      }));
  }
  const signature = JSON.stringify(
      inputs(form).map((item) => ({ key: item.key, payload: item.payload })),
    ),
    stale = signature !== quoteSignature;
  const accountReady =
    !!account.currentData && !account.isFetching && !account.isError;
  async function review(values: ShipmentFormValues) {
    if (busyRef.current || uploading || !permitted) return;
    busyRef.current = true;
    setBusy(true);
    setAction("review");
    setError(undefined);
    const snapshot = structuredClone(inputs(values)),
      fingerprint = JSON.stringify(
        snapshot.map((item) => ({ key: item.key, payload: item.payload })),
      ),
      result: ShipmentQuote[] = [];
    try {
      if (
        values.shippingCompany?.isAuthorizationRequired &&
        !account.currentData?.isAuthorized
      )
        throw new Error(t("SHIPPING_COMPANY_REQUIRED_AUTHORIZATION"));
      for (const item of snapshot) {
        try {
          const price = await quote({
            ...item.payload,
            userId: user.id,
          }).unwrap();
          if (typeof price.total !== "number" || !Number.isFinite(price.total))
            throw new Error(t("QUOTE_ERROR"));
          result.push({ key: item.key, cost: price });
        } catch (failure) {
          result.push({
            key: item.key,
            error: shipmentErrorMessage(failure, t("QUOTE_ERROR")),
          });
        }
      }
      setQuotes(result);
      setQuoteSignature(fingerprint);
    } catch (failure) {
      setError(shipmentErrorMessage(failure, t("QUOTE_ERROR")));
    } finally {
      busyRef.current = false;
      setBusy(false);
      setAction(undefined);
    }
  }
  async function submit(values: ShipmentFormValues) {
    if (busyRef.current || uploading || !permitted || !accountReady) return;
    const pending = inputs(values),
      fingerprint = JSON.stringify(
        pending.map((item) => ({ key: item.key, payload: item.payload })),
      );
    if (
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
    const results = [...outcomes.filter((item) => item.success)];
    try {
      const fresh = await account.refetch().unwrap();
      if (
        values.shippingCompany?.isAuthorizationRequired &&
        !fresh.isAuthorized
      )
        throw new Error(t("SHIPPING_COMPANY_REQUIRED_AUTHORIZATION"));
      const total = quotes
        .filter((item) => pending.some((input) => input.key === item.key))
        .reduce((sum, item) => sum + (item.cost?.total || 0), 0);
      if (total > (fresh.balance ?? 0))
        throw new Error(t("NOT_ENOUGH_BALANCE"));
      let senderId = values.senderId;
      for (let index = 0; index < pending.length; index++) {
        const item = pending[index];
        try {
          if (mode === "create") {
            if (!senderId || senderId === "new") {
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
            item.payload.senderId = senderId;
            item.payload.receiverId = receiverId;
          }
          if (index) await new Promise((resolve) => setTimeout(resolve, 3000));
          const response = await create(item.payload).unwrap();
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
          results.push({
            key: item.key,
            success: false,
            message: shipmentErrorMessage(failure, t("CREATE_ERROR")),
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
    if (first) goToSection(first);
  };
  const reviewNow = methods.handleSubmit(review, invalid),
    createNow = methods.handleSubmit(submit, invalid);
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
  const checklist = (["sender", "receiver", "carrier", "parcel"] as const).map(
      (id) => ({
        id,
        label: t(
          {
            sender: "SENDER_DETAILS",
            receiver: "RECEIVER_DETAILS",
            carrier: "SHIPPING_COMPANY",
            parcel: "SHIPMENT_DETAILS",
          }[id],
        ),
        status: statusOf(id),
      }),
    ),
    quotesReady =
      !!quotes.length && !stale && quotes.every((item) => !item.error);
  const sectionNumber = (id: ShipmentSectionId) =>
    shipmentSectionIds.indexOf(id);
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
      canCreate={!uploading && !busy && accountReady && quotesReady}
      onReview={reviewNow}
      onCreate={createNow}
      onGoTo={goToSection}
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
            data-testid="shipment-editor"
            sx={(theme) => ({
              width: "100%",
              minWidth: 0,
              p: { xs: 2, sm: 3, lg: 4 },
              background: theme.palette.background.default,
              "& .MuiOutlinedInput-root": { borderRadius: "12px" },
            })}
          >
            <div className="mx-auto w-full max-w-7xl space-y-16">
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
              <div className="grid grid-cols-1 items-start gap-24 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-24">
                  <ShipmentSection
                    id="type"
                    index={1}
                    icon="heroicons-outline:globe-alt"
                    title={t("SHIPPING_TYPE")}
                    subtitle={t("SHIPPING_TYPE_SECTION_HINT")}
                  >
                    <ShippingTypeSection disabled={busyOrUploading} />
                  </ShipmentSection>
                  <ShipmentSection
                    id="sender"
                    index={sectionNumber("sender") + 1}
                    icon="heroicons-outline:upload"
                    title={t(calculator ? "SHIPPING_FROM" : "SENDER_DETAILS")}
                    subtitle={t("SENDER_SECTION_HINT")}
                    status={statusOf("sender")}
                  >
                    <ShipmentContactFields
                      prefix="sender"
                      calculator={calculator}
                      disabled={busyOrUploading}
                    />
                  </ShipmentSection>
                  <ShipmentSection
                    id="receiver"
                    index={sectionNumber("receiver") + 1}
                    icon="heroicons-outline:download"
                    title={t(calculator ? "SHIPPING_TO" : "RECEIVER_DETAILS")}
                    subtitle={t("RECEIVER_SECTION_HINT")}
                    status={statusOf("receiver")}
                  >
                    {calculator || mode === "return" ? (
                      <ShipmentContactFields
                        prefix="receiver"
                        calculator={calculator}
                        disabled={busyOrUploading}
                      />
                    ) : (
                      <ReceiversSection
                        disabled={busyOrUploading}
                        completed={completed}
                      />
                    )}
                  </ShipmentSection>
                  <ShipmentSection
                    id="carrier"
                    index={sectionNumber("carrier") + 1}
                    icon="heroicons-outline:truck"
                    title={t("SHIPPING_COMPANY")}
                    subtitle={t("CARRIER_SECTION_HINT")}
                    status={statusOf("carrier")}
                  >
                    <CarrierSection disabled={busyOrUploading} />
                  </ShipmentSection>
                  <ShipmentSection
                    id="parcel"
                    index={sectionNumber("parcel") + 1}
                    icon="heroicons-outline:cube"
                    title={t("SHIPMENT_DETAILS")}
                    subtitle={t("PARCEL_SECTION_HINT")}
                    status={statusOf("parcel")}
                  >
                    <ParcelSection
                      calculator={calculator}
                      disabled={busyOrUploading}
                      onUploadBusy={setUploading}
                    />
                  </ShipmentSection>
                  <ShipmentSection
                    id="payment"
                    index={sectionNumber("payment") + 1}
                    icon="heroicons-outline:credit-card"
                    title={t("PAYMENT_DETAILS")}
                    subtitle={t("PAYMENT_SECTION_HINT")}
                    optional
                  >
                    <PaymentSection
                      returned={mode === "return"}
                      disabled={busyOrUploading}
                    />
                  </ShipmentSection>
                </div>
                <aside className="min-w-0 lg:sticky lg:top-16">{summary}</aside>
              </div>
            </div>
          </Box>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
