import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Tab, Tabs } from "@mui/material";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FusePageCarded from "@fuse/core/FusePageCarded";
import FuseLoading from "@fuse/core/FuseLoading";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import useJwtAuth from "src/app/auth/services/jwt/useJwtAuth";
import { hasOperationPermission } from "src/app/auth/permissions";
import {
  useGetMerchantQuery,
  useCreateMerchantMutation,
  useUpdateMerchantMutation,
} from "../MerchantsApi";
import {
  canViewMerchants,
  canUpdateMerchant,
  canCreateMerchant,
  merchantName,
} from "../Utils";
import {
  merchantFormValues,
  merchantSchema,
  merchantPayload,
  MerchantForm,
} from "../models/MerchantSchema";
import MerchantHeader from "./MerchantHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
import PricesTab from "./tabs/PricesTab";
import UserInfoTab from "./tabs/UserInfoTab";
import ContactsTab from "./tabs/ContactsTab";
import ShipmentsHeader from "../../shipments-app/shipments/ShipmentsHeader";
import ShipmentsTable from "../../shipments-app/shipments/ShipmentsTable";
import TransactionsHeader from "../../transactions-app/transactions/TransactionsHeader";
import TransactionsTable from "../../transactions-app/transactions/TransactionsTable";
import MerchantDuesHeader from "../../merchant-dues-app/merchant-dues/MerchantDuesHeader";
import MerchantDuesTable from "../../merchant-dues-app/merchant-dues/MerchantDuesTable";
export default function Merchant({ forView = false }: { forView?: boolean }) {
  const user = useAppSelector(selectUser),
    { merchantId } = useParams(),
    self = user.role === "user",
    id = self ? user.id : merchantId,
    isNew = id === "new",
    permitted = self || canViewMerchants(user),
    canSave =
      self || (isNew ? canCreateMerchant(user) : canUpdateMerchant(user)),
    { t } = useTranslation("merchantsApp"),
    mobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg")),
    auth = useJwtAuth(),
    navigate = useNavigate();
  const query = useGetMerchantQuery(self ? "me" : id, {
      skip: !permitted || isNew || !id,
      refetchOnMountOrArgChange: true,
    }),
    [create, creating] = useCreateMerchantMutation(),
    [update, updating] = useUpdateMerchantMutation();
  const methods = useForm<MerchantForm>({
      mode: "onChange",
      defaultValues: merchantFormValues({}),
      resolver: zodResolver(merchantSchema(t)),
    }),
    initialized = useRef<string>(),
    [ready, setReady] = useState<string>(),
    [tab, setTab] = useState("info"),
    [error, setError] = useState<string>(),
    lock = useRef(false),
    savedId = useRef<string>(),
    created = useRef(false);
  const merchant = query.currentData,
    key = `${id}/${forView}/${self}`;
  useEffect(() => {
    if (initialized.current === key || (!isNew && !merchant)) return;
    methods.reset(merchantFormValues(isNew ? {} : merchant));
    initialized.current = key;
    savedId.current = undefined;
    created.current = false;
    setReady(key);
    setTab("info");
    setError(undefined);
  }, [key, merchant]);
  const save = methods.handleSubmit(async (values) => {
    if (!canSave || lock.current || forView) return;
    if (isNew && created.current && !savedId.current) {
      navigate("/merchants", { replace: true });
      return;
    }
    lock.current = true;
    setError(undefined);
    try {
      const data = merchantPayload(values, !self);
      let result;
      if (self) {
        result = await auth.updateMe(data);
        query.refetch().catch(() => {});
      } else if (isNew && !savedId.current) {
        result = await create(data).unwrap();
        created.current = true;
        savedId.current = result?.id || result?._id;
      } else
        result = await update({ id: savedId.current || id, data }).unwrap();
      const destinationId =
        result?.id ||
        result?._id ||
        savedId.current ||
        (!isNew ? id : undefined);
      navigate(
        self
          ? "/profile"
          : destinationId
            ? `/merchants/${destinationId}/view`
            : "/merchants",
      );
    } catch {
      setError(t("SAVE_ERROR"));
    } finally {
      lock.current = false;
    }
  });
  if (!permitted || (isNew && !canCreateMerchant(user)))
    return <Navigate to="/home" replace />;
  if (query.isError || (!isNew && !query.isFetching && !merchant))
    return (
      <div className="p-24 space-y-16">
        <Alert severity="error">{t("NO_SUCH_MERCHANT")}</Alert>
        <Button
          color="primary"
          variant="outlined"
          onClick={() => query.refetch()}
        >
          {t("RETRY")}
        </Button>
        <Button
          color="primary"
          variant="outlined"
          component={Link}
          to={self ? "/home" : "/merchants"}
        >
          {t("BACK")}
        </Button>
      </div>
    );
  if (ready !== key) return <FuseLoading />;
  const tabs = forView
    ? [
        { id: "info", label: "USER_INFO" },
        ...[
          ["shipments", "SHIPMENTS"],
          ["transactions", "BALANCE"],
          ["cod-transactions", "COD_BALANCE"],
          ["merchant-dues", "DUES"],
          ["shipment-users", "SENDERS"],
          ["shipment-users", "RECEIVERS"],
        ]
          .filter(([feature]) => hasOperationPermission(feature, "view", user))
          .map(([feature, label]) => ({ id: label, label })),
      ]
    : [
        { id: "info", label: "BASIC_INFO" },
        ...(!self ? [{ id: "prices", label: "MERCHANT_TYPE" }] : []),
      ];
  const active = tabs.some((item) => item.id === tab) ? tab : "info";
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={
          <MerchantHeader
            title={
              isNew
                ? t("ADD_NEW_MERCHANT")
                : merchantName(merchant || methods.getValues())
            }
            image={merchant?.image || merchant?.avatarUrl}
            self={self}
            view={forView}
            canSave={canSave}
            busy={
              creating.isLoading ||
              updating.isLoading ||
              methods.formState.isSubmitting
            }
            onSave={() => save()}
          />
        }
        content={
          <>
            <Tabs
              value={active}
              onChange={(_, value) => setTab(value)}
              variant="scrollable"
              scrollButtons="auto"
              indicatorColor="secondary"
              textColor="secondary"
              classes={{ root: "w-full h-64 border-b-1" }}
            >
              {tabs.map((item) => (
                <Tab key={item.id} value={item.id} label={t(item.label)} />
              ))}
            </Tabs>
            <div className="p-16 sm:p-24 space-y-16">
              {error && <Alert severity="error">{error}</Alert>}
              {!forView ? (
                active === "prices" ? (
                  <PricesTab disabled={!canSave} />
                ) : (
                  <BasicInfoTab disabled={!canSave} />
                )
              ) : active === "info" ? (
                <UserInfoTab merchant={merchant} />
              ) : active === "SHIPMENTS" ? (
                <div className="min-h-512">
                  <ShipmentsHeader fixedUserId={id} />
                  <ShipmentsTable fixedUserId={id} />
                </div>
              ) : active === "BALANCE" || active === "COD_BALANCE" ? (
                <div className="min-h-512" key={active}>
                  <TransactionsHeader
                    fixedUserId={id}
                    fixedBalance={active === "COD_BALANCE" ? "cod" : "wallet"}
                  />
                  <TransactionsTable
                    fixedUserId={id}
                    fixedBalance={active === "COD_BALANCE" ? "cod" : "wallet"}
                  />
                </div>
              ) : active === "DUES" ? (
                <div className="min-h-512">
                  <MerchantDuesHeader fixedUserId={id} />
                  <MerchantDuesTable fixedUserId={id} />
                </div>
              ) : (
                <ContactsTab
                  key={active}
                  merchantId={id}
                  type={active === "SENDERS" ? "sender" : "receiver"}
                />
              )}
            </div>
          </>
        }
        scroll={mobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
