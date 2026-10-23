import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link, Navigate, useParams } from "react-router-dom";
import { Alert, Button, Tab, Tabs } from "@mui/material";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import FusePageCarded from "@fuse/core/FusePageCarded";
import FuseLoading from "@fuse/core/FuseLoading";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import {
  useGetPackageRequestQuery,
  useGetPackagingSuppliesQuery,
  useGetPackageRequestsUserQuery,
} from "../PackageRequestsApi";
import PackageRequestModel from "../models/PackageRequestModel";
import {
  packageRequestSchema,
  PackageRequestFormValues,
} from "../models/PackageRequestSchema";
import { toPackageRequestFormValues, packagingTotal } from "../Utils";
import PackageRequestHeader from "./PackageRequestHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
import PackageRequestSummary from "../shared-components/PackageRequestSummary";
export default function PackageRequest() {
  const { packageRequestId } = useParams(),
    user = useAppSelector(selectUser),
    { t } = useTranslation("packageRequestsApp");
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg")),
    isNew = packageRequestId === "new";
  const permitted =
    hasOperationPermission("package-requests", "view", user) &&
    (!isNew || user.role === "user");
  const {
    currentData: request,
    isError,
    refetch,
  } = useGetPackageRequestQuery(packageRequestId, {
    skip: isNew || !packageRequestId || !permitted,
    refetchOnMountOrArgChange: true,
  });
  const supplies = useGetPackagingSuppliesQuery(undefined, {
    skip: !isNew || !permitted,
    refetchOnMountOrArgChange: true,
  });
  const account = useGetPackageRequestsUserQuery(user.id, {
    skip: !isNew || !permitted,
    refetchOnMountOrArgChange: true,
  });
  const balance = account.currentData?.balance ?? 0;
  const methods = useForm<PackageRequestFormValues>({
    mode: "onChange",
    defaultValues: toPackageRequestFormValues(PackageRequestModel()),
    resolver: zodResolver(packageRequestSchema(t, balance)),
  });
  const initialized = useRef<string>(),
    [ready, setReady] = useState<string>(),
    [tabValue, setTabValue] = useState(0);
  const owned =
    request?.type === "bags" &&
    (user.role !== "user" ||
      request.userId === user.id ||
      request.user?.id === user.id);
  useEffect(() => {
    if (
      initialized.current === packageRequestId ||
      (!isNew && (!request || !owned))
    )
      return;
    methods.reset(
      toPackageRequestFormValues(
        PackageRequestModel(
          isNew
            ? {
                userId: user.id,
                fullName: [user.firstName, user.lastName]
                  .filter(Boolean)
                  .join(" "),
                phone: user.phone,
                shippingAddress: {
                  ...user.address,
                  countryId:
                    user.address?.countryId ||
                    import.meta.env.VITE_DEFAULT_COUNTRY_ID ||
                    "65fd1a1c1fdbc094e3369b29",
                },
              }
            : request,
        ),
      ),
    );
    initialized.current = packageRequestId;
    setReady(packageRequestId);
    setTabValue(0);
  }, [packageRequestId, isNew, request, owned, methods.reset, user.id]);
  const selectedIds = methods.watch("productIds");
  const amount = supplies.currentData
    ? packagingTotal(selectedIds, supplies.currentData.results)
    : undefined;
  useEffect(() => {
    if (isNew && amount !== undefined)
      methods.setValue("amount", amount, { shouldValidate: true });
  }, [isNew, amount, methods.setValue]);
  const blocked =
    supplies.isFetching ||
    supplies.isError ||
    !supplies.currentData ||
    amount === undefined ||
    account.isFetching ||
    account.isError ||
    !account.currentData;
  if (!permitted) return <Navigate to="/package-requests/all" replace />;
  if (isError || (!isNew && request && !owned))
    return (
      <div className="flex flex-col items-center justify-center h-full gap-16">
        <Alert severity="error">{t("NO_SUCH_PACKAGE_REQUEST")}</Alert>
        {isError && <Button onClick={() => refetch()}>{t("RETRY")}</Button>}
        <Button component={Link} to="/package-requests/all">
          {t("GO_TO_PACKAGE_REQUESTS")}
        </Button>
      </div>
    );
  if (ready !== packageRequestId) return <FuseLoading />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={
          <PackageRequestHeader
            blocked={blocked}
            supplies={supplies.currentData?.results || []}
            balance={isNew ? account.currentData?.balance : undefined}
          />
        }
        content={
          <>
            <Tabs
              value={tabValue}
              onChange={(_, value) => setTabValue(value)}
              indicatorColor="secondary"
              textColor="secondary"
              variant="scrollable"
              scrollButtons="auto"
              classes={{ root: "w-full h-64 border-b-1" }}
            >
              <Tab className="h-64" label={t("BASIC_INFO")} />
            </Tabs>
            <div className="p-16 sm:p-24 max-w-6xl mx-auto w-full space-y-16">
              {isNew ? (
                <>
                  {account.isError && (
                    <Alert
                      severity="error"
                      action={
                        <Button onClick={() => account.refetch()}>
                          {t("RETRY")}
                        </Button>
                      }
                    >
                      {t("BALANCE_LOAD_ERROR")}
                    </Alert>
                  )}
                  {supplies.isError && (
                    <Alert
                      severity="error"
                      action={
                        <Button onClick={() => supplies.refetch()}>
                          {t("RETRY")}
                        </Button>
                      }
                    >
                      {t("CATALOG_LOAD_ERROR")}
                    </Alert>
                  )}
                  {supplies.currentData && amount === undefined && (
                    <Alert severity="error">{t("SUPPLY_UNAVAILABLE")}</Alert>
                  )}
                  <BasicInfoTab
                    supplies={supplies.currentData?.results || []}
                    loading={supplies.isFetching}
                  />
                </>
              ) : (
                <>
                  <Alert severity="info">{t("READ_ONLY_REQUEST")}</Alert>
                  <PackageRequestSummary request={request} />
                </>
              )}
            </div>
          </>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
