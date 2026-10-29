import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link, Navigate, useParams } from "react-router-dom";
import { Alert, Button, Tab, Tabs } from "@mui/material";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import FusePageCarded from "@fuse/core/FusePageCarded";
import FuseLoading from "@fuse/core/FuseLoading";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { useGetShipmentUserQuery } from "../ShipmentUsersApi";
import ShipmentUserModel, {
  shipmentUserDefaultValues,
} from "../models/ShipmentUserModel";
import { ShipmentUserFormValues } from "../models/ShipmentUserSchema";
import {
  shipmentUserTypes,
  shipmentUsersPath,
  toShipmentUserFormValues,
} from "../Utils";
import { shipmentUserSchema } from "../models/ShipmentUserSchema";
import ShipmentUserHeader from "./ShipmentUserHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";

function ShipmentUser() {
  const { shipmentUserId, type = "all" } = useParams();
  const routeKey = `${type}/${shipmentUserId}`;
  const { t } = useTranslation("shipmentUsersApp");
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const isNew = shipmentUserId === "new";
  const user = useAppSelector(selectUser);
  const permitted = hasOperationPermission(
    "shipment-users",
    isNew ? "create" : "view",
    user,
  );
  const canEdit = hasOperationPermission(
    "shipment-users",
    isNew ? "create" : "update",
    user,
  );
  const [tabValue, setTabValue] = useState(0);
  const [ready, setReady] = useState<string>();
  const initialized = useRef<string>();
  const {
    currentData: shipmentUser,
    isError,
    error,
    refetch,
  } = useGetShipmentUserQuery(shipmentUserId, {
    skip: isNew || !shipmentUserId || !permitted,
    refetchOnMountOrArgChange: true,
  });
  const methods = useForm<ShipmentUserFormValues>({
    mode: "onChange",
    defaultValues: toShipmentUserFormValues(shipmentUserDefaultValues),
    resolver: zodResolver(shipmentUserSchema(t)),
  });
  const { reset } = methods;
  useEffect(() => {
    if (initialized.current === routeKey || (!isNew && !shipmentUser)) return;
    reset(
      toShipmentUserFormValues(
        ShipmentUserModel(
          isNew
            ? {
                type:
                  type === shipmentUserTypes.sender
                    ? shipmentUserTypes.sender
                    : shipmentUserTypes.receiver,
                address: {
                  countryId:
                    import.meta.env.VITE_DEFAULT_COUNTRY_ID ||
                    "65fd1a1c1fdbc094e3369b29",
                },
              }
            : shipmentUser,
        ),
      ),
    );
    initialized.current = routeKey;
    setReady(routeKey);
    setTabValue(0);
    // Preserve drafts during list invalidation and selected-place refetches.
  }, [shipmentUserId, routeKey, type, isNew, shipmentUser, reset]);

  if (!permitted) return <Navigate to="/home" replace />;
  if (isError && !isNew)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.1 } }}
        className="flex flex-col flex-1 items-center justify-center h-full"
      >
        <Alert severity="error">
          {t(
            (error as { status?: number })?.status === 404
              ? "NO_SUCH_SHIPMENT_USER"
              : "LOAD_ERROR",
          )}
        </Alert>
        <Button color="primary" variant="outlined" onClick={() => refetch()}>
          {t("RETRY")}
        </Button>
        <Button
          className="mt-24"
          component={Link}
          variant="outlined"
          to={shipmentUsersPath(type)}
          color="primary"
        >
          {t("GO_TO_SHIPMENT_USERS")}
        </Button>
      </motion.div>
    );
  if (ready !== routeKey) return <FuseLoading />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={<ShipmentUserHeader />}
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
            <div className="p-16 sm:p-24 max-w-4xl">
              <div className={tabValue !== 0 ? "hidden" : ""}>
                <BasicInfoTab shipmentUser={shipmentUser} disabled={!canEdit} />
              </div>
            </div>
          </>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
export default ShipmentUser;
