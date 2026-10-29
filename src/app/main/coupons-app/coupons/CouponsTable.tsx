import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button } from "@mui/material";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import AlertDialog from "app/shared-components/alert-dialog/AlertDialog";
import { openDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import ICoupon from "../models/ICoupon";
import {
  GetCouponsApiArg,
  useGetCouponsQuery,
  useUpdateCouponMutation,
} from "../CouponsApi";
import {
  couponTypes,
  toCouponTypeTitle,
  toCouponTypeColor,
  couponsPath,
} from "../Utils";
import {
  newCouponsInstance,
  resetCoupons,
  selectCouponsFilters,
  setCouponsPage,
  setCouponsPageSize,
} from "../store/couponsSlice";

export default function CouponsTable() {
  const { t } = useTranslation("couponsApp"),
    dispatch = useAppDispatch(),
    navigate = useNavigate(),
    user = useAppSelector(selectUser);
  const { shippingCompanyId = "all", userId = "all" } = useParams();
  const routeKey = `${shippingCompanyId}/${userId}`;
  const filters = useSelector(selectCouponsFilters) as GetCouponsApiArg;
  const [ready, setReady] = useState<string>();
  const canView = hasOperationPermission("coupons", "view", user);
  useEffect(() => {
    dispatch(
      newCouponsInstance({
        shippingCompanyIdFilter: shippingCompanyId,
        userIdFilter: userId,
      }),
    );
    setReady(routeKey);
  }, [dispatch, routeKey]);
  useEffect(
    () => () => {
      dispatch(resetCoupons(null));
    },
    [dispatch],
  );
  const { data, isFetching, isError, refetch } = useGetCouponsQuery(filters, {
    skip: ready !== routeKey || !canView,
    refetchOnMountOrArgChange: true,
  });
  const [updateCoupon] = useUpdateCouponMutation();
  function handleAction(row: ICoupon) {
    if (!hasOperationPermission("coupons", "update", user)) return;
    const active = !row.isActive;
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t(`${active ? "ACTIVATE" : "DEACTIVATE"}_COUPON_TITLE`)}
            message={`${t(`${active ? "ACTIVATE" : "DEACTIVATE"}_COUPON_MESSAGE`)} "${row.code}"`}
            onSubmit={async () => {
              try {
                await updateCoupon({ id: row.id, isActive: active }).unwrap();
                dispatch(
                  showMessage({
                    message: t(
                      `COUPON_${active ? "ACTIVATED" : "DEACTIVATED"}_SUCCESSFULLY`,
                    ),
                    variant: "success",
                  }),
                );
              } catch {
                dispatch(
                  showMessage({
                    message: t(
                      `SOMETHING_WENT_WRONG_WHEN_${active ? "ACTIVATE" : "DEACTIVATE"}_COUPON`,
                    ),
                    variant: "error",
                  }),
                );
              }
            }}
          />
        ),
      }),
    );
  }
  const fields: TableFieldProps<ICoupon>[] = [
    {
      id: "code",
      label: t("COUPON_CODE"),
      type: TableDataTypes.normal,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "shippingCompanyId",
      label: t("SHIPPING_COMPANY"),
      type: TableDataTypes.image,
      valueGetter: (row) => row.shippingCompany?.logoUrl,
      valueFormatter: (row) => row.shippingCompany?.name || "---",
      flex: 1,
      minWidth: 100,
    },
    {
      id: "type",
      label: t("COUPON_TYPE"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toCouponTypeTitle(value)),
      toChipColor: toCouponTypeColor,
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "value",
      label: t("VALUE"),
      type: TableDataTypes.moneyOrPercentage,
      isMoneyGetter: (row) => row.type === couponTypes.fixed,
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "usageCount",
      label: t("CURRENT_USAGE_COUNT"),
      type: TableDataTypes.normal,
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "maxUsageCount",
      label: t("MAX_USAGE_COUNT"),
      type: TableDataTypes.normal,
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "expiresAt",
      label: t("EXPIRE_DATE"),
      type: TableDataTypes.date,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "isActive",
      label: t("STATUS"),
      type: TableDataTypes.bool,
      flex: 0.3,
      minWidth: 30,
    },

    {
      id: "createdAt",
      label: t("CREATED_AT"),
      type: TableDataTypes.date,
      flex: 0.7,
      minWidth: 70,
    },
    {
      id: "actions",
      label: t("ACTIONS"),
      type: TableDataTypes.actions,
      flex: 1.2,
      minWidth: 120,
      actions: [
        {
          title: t("VIEW"),
          color: "secondary",
          onActionClick: (row) =>
            navigate(
              `${couponsPath(filters.shippingCompanyIdFilter, filters.userIdFilter)}/${row.id}`,
            ),
        },
        ...(hasOperationPermission("coupons", "update", user)
          ? [
              ...(["ACTIVATE", "DEACTIVATE"] as const).map((title) => ({
                title: t(title),
                color:
                  title === "ACTIVATE"
                    ? ("success" as const)
                    : ("error" as const),
                onActionClick: handleAction,
                conditions: [
                  { id: "isActive", equalsTo: title === "DEACTIVATE" },
                ],
              })),
            ]
          : []),
      ],
    },
  ];
  if (!canView) return <Navigate to="/home" replace />;
  return (
    <div className="w-full flex flex-col h-full">
      {isError && (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => refetch()}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <CustomTable<ICoupon>
        fields={fields}
        data={data?.results || []}
        total={data?.total || 0}
        page={filters.page}
        pageSize={filters.pageSize}
        status={
          isError
            ? FetchStatus.error
            : ready !== routeKey || isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        error={isError ? t("LOAD_ERROR") : undefined}
        noDataMessage={t("NO_COUPONS")}
        autoRowHeight
        estimatedRowHeight={60}
        checkboxSelection
        exportedFileName="Ashamco Express - Coupons"
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setCouponsPageSize(pageSize));
          else dispatch(setCouponsPage(page));
        }}
      />
    </div>
  );
}
