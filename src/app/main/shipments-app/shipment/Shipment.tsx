import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Tab, Tabs, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
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
import BasicInfoTab from "./tabs/BasicInfoTab";
import ReceiversTab from "./tabs/ReceiversTab";
import ParcelTab from "./tabs/ParcelTab";
import PaymentTab from "./tabs/PaymentTab";
import ReviewTab, { ShipmentQuote, ShipmentOutcome } from "./tabs/ReviewTab";
import ShipmentContactFields from "./components/ShipmentContactFields";
const stepFields = [
  ["shippingCompanyId", "method"],
  [
    "senderId",
    "senderName",
    "senderPhone",
    "senderCountryId",
    "senderStateId",
    "senderCityId",
    "senderStreet",
    "senderZipCode",
    "senderNationalAddress",
  ],
  [
    "receivers",
    "receiverId",
    "receiverName",
    "receiverPhone",
    "receiverCountryId",
    "receiverStateId",
    "receiverCityId",
    "receiverStreet",
    "receiverZipCode",
    "receiverNationalAddress",
  ],
  [
    "length",
    "width",
    "height",
    "weight",
    "packagesCount",
    "description",
    "products",
    "imageUrl",
    "acceptExtraWeightTerms",
  ],
  ["isCod", "codPrice", "couponCode"],
];
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
  const [step, setStep] = useState(0),
    [ready, setReady] = useState<string>(),
    initialized = useRef<string>(),
    [busy, setBusy] = useState(false),
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
    setStep(0);
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
    }
  }
  async function next() {
    if (await methods.trigger(stepFields[step] as never))
      setStep(Math.min(5, step + 1));
  }
  const invalid = (errors: typeof methods.formState.errors) => {
    setError(t("CHECK_REQUIRED_FIELDS"));
    if (!calculator) {
      const index = stepFields.findIndex((fields) =>
        fields.some((field) => field in errors),
      );
      if (index >= 0) setStep(index);
    }
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
  const labels = [
    "SHIPPING_COMPANY",
    "SENDER_DETAILS",
    "RECEIVER_DETAILS",
    "SHIPMENT_DETAILS",
    "PAYMENT_DETAILS",
    "PREVIEW_SHIPMENT",
  ];
  const content = calculator ? (
    <div className="space-y-24">
      <BasicInfoTab disabled={busy || uploading} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
        <ShipmentContactFields
          prefix="sender"
          calculator
          disabled={busy || uploading}
        />
        <ShipmentContactFields
          prefix="receiver"
          calculator
          disabled={busy || uploading}
        />
      </div>
      <ParcelTab
        calculator
        disabled={busy || uploading}
        onUploadBusy={setUploading}
      />
      <PaymentTab disabled={busy || uploading} />
      <ReviewTab
        form={form}
        quotes={quotes}
        outcomes={[]}
        stale={stale && quotes.length > 0}
        busy={busy || uploading}
        onReview={reviewNow}
      />
    </div>
  ) : (
    <>
      {step === 0 && <BasicInfoTab disabled={busy || uploading} />}
      {step === 1 && (
        <ShipmentContactFields prefix="sender" disabled={busy || uploading} />
      )}
      {step === 2 &&
        (mode === "return" ? (
          <ShipmentContactFields
            prefix="receiver"
            disabled={busy || uploading}
          />
        ) : (
          <ReceiversTab disabled={busy || uploading} completed={completed} />
        ))}
      {step === 3 && (
        <ParcelTab disabled={busy || uploading} onUploadBusy={setUploading} />
      )}{" "}
      {step === 4 && (
        <PaymentTab returned={mode === "return"} disabled={busy || uploading} />
      )}{" "}
      {step === 5 && (
        <ReviewTab
          form={form}
          quotes={quotes}
          outcomes={outcomes}
          stale={stale && quotes.length > 0}
          busy={busy || uploading}
          onReview={reviewNow}
        />
      )}
    </>
  );
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={
          <ShipmentHeader calculator={calculator} returned={!!returnId} />
        }
        content={
          <>
            {!calculator && (
              <Tabs
                value={step}
                onChange={(_, value) => {
                  if (busy || uploading) return;
                  if (value <= step) setStep(value);
                  else next();
                }}
                variant="scrollable"
                scrollButtons="auto"
                indicatorColor="secondary"
                textColor="secondary"
                classes={{ root: "w-full h-64 border-b-1" }}
              >
                {labels.map((label, index) => (
                  <Tab
                    key={label}
                    className="h-64"
                    label={`${index + 1}. ${t(label)}`}
                    disabled={busy || uploading}
                  />
                ))}
              </Tabs>
            )}
            <div
              className="w-full min-w-0 p-16 sm:p-24 max-w-6xl space-y-24"
              data-testid="shipment-editor"
            >
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
              {content}
              {!calculator && (
                <div className="flex flex-wrap justify-between gap-16">
                  <Button
                    disabled={busy || uploading || step === 0}
                    onClick={() => setStep(step - 1)}
                    data-testid="shipment-back"
                  >
                    {t("BACK")}
                  </Button>
                  {step < 5 ? (
                    <Button
                      variant="contained"
                      disabled={busy || uploading}
                      onClick={next}
                      data-testid="shipment-next"
                    >
                      {t("NEXT")}
                    </Button>
                  ) : (
                    <LoadingButton
                      variant="contained"
                      loading={busy}
                      disabled={
                        uploading ||
                        stale ||
                        !accountReady ||
                        !quotes.length ||
                        quotes.some((item) => !!item.error)
                      }
                      onClick={createNow}
                      data-testid="create-shipments"
                    >
                      {t("CREATE_SHIPMENT")}
                    </LoadingButton>
                  )}
                </div>
              )}
            </div>
          </>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
