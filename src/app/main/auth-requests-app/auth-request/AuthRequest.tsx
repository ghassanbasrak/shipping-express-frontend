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
import { useGetAuthRequestQuery } from "../AuthRequestsApi";
import AuthRequestModel, {
  authRequestDefaultValues,
} from "../models/AuthRequestModel";
import IAuthRequest from "../models/IAuthRequest";
import { authRequestSchema } from "../models/AuthRequestSchema";
import { authRequestTypes } from "../Utils";
import AuthRequestHeader from "./AuthRequestHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
export default function AuthRequest() {
  const { authRequestId } = useParams(),
    user = useAppSelector(selectUser),
    { t } = useTranslation("authRequestsApp");
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg")),
    isNew = authRequestId === "new";
  const permitted =
    user.role === "user" &&
    hasOperationPermission("auth-requests", isNew ? "create" : "view", user);
  const {
    currentData: request,
    isError,
    refetch,
  } = useGetAuthRequestQuery(authRequestId, {
    skip: isNew || !authRequestId || !permitted,
    refetchOnMountOrArgChange: true,
  });
  const methods = useForm<IAuthRequest>({
    mode: "onChange",
    defaultValues: AuthRequestModel(authRequestDefaultValues),
    resolver: zodResolver(authRequestSchema(t)),
  });
  const initialized = useRef<string>(),
    [ready, setReady] = useState<string>(),
    [uploading, setUploading] = useState(false),
    [tabValue, setTabValue] = useState(0);
  const { reset } = methods;
  const ownedRequest =
    request?.type === authRequestTypes.auth &&
    (!request.userId || request.userId === user.id);
  useEffect(() => {
    if (
      initialized.current === authRequestId ||
      (!isNew && (!request || !ownedRequest))
    )
      return;
    reset(AuthRequestModel(isNew ? { userId: user.id } : request));
    initialized.current = authRequestId;
    setReady(authRequestId);
    setTabValue(0);
  }, [authRequestId, isNew, request, ownedRequest, reset, user.id]);
  if (!permitted) return <Navigate to="/auth-requests/all" replace />;
  if (isNew && user.isAuthorized)
    return <Navigate to="/auth-requests/all" replace />;
  if (isError || (!isNew && request && !ownedRequest))
    return (
      <div className="flex flex-col items-center justify-center h-full gap-16">
        <Alert severity="error">{t("NO_SUCH_AUTH_REQUEST")}</Alert>
        {isError && (
          <Button color="primary" variant="outlined" onClick={() => refetch()}>
            {t("RETRY")}
          </Button>
        )}
        <Button
          color="primary"
          variant="outlined"
          component={Link}
          to="/auth-requests/all"
        >
          {t("GO_TO_AUTH_REQUESTS")}
        </Button>
      </div>
    );
  if (ready !== authRequestId) return <FuseLoading />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={<AuthRequestHeader uploading={uploading} />}
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
            <div className="p-16 sm:p-24 max-w-3xl mx-auto w-full">
              {!isNew && (
                <Alert severity="info" className="mb-16">
                  {t("READ_ONLY_REQUEST")}
                </Alert>
              )}
              <BasicInfoTab
                disabled={!isNew}
                uploading={uploading}
                onUploading={setUploading}
              />
            </div>
          </>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
