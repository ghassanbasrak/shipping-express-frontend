import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Alert, Button } from "@mui/material";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CustomTable from "app/shared-components/custom-table/CustomTable";
import {
  TableDataTypes,
  TableFieldProps,
} from "app/shared-components/custom-table/Utils";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import IAdmin from "../models/IAdmin";
import { GetAdminsApiArg, useGetAdminsQuery } from "../AdminsApi";
import {
  adminRoles,
  toAdminRoleTitle,
  toAdminRoleColor,
  adminRelatedLinks,
} from "../Utils";
import {
  newAdminsInstance,
  resetAdmins,
  selectAdminsFilters,
  setAdminsPage,
  setAdminsPageSize,
} from "../store/adminsSlice";

export default function AdminsTable() {
  const { t } = useTranslation("adminsApp");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const canView = hasOperationPermission("admins", "view", user);
  const filters = useSelector(selectAdminsFilters) as GetAdminsApiArg;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    dispatch(newAdminsInstance(null));
    setReady(true);
    return () => {
      dispatch(resetAdmins(null));
    };
  }, [dispatch]);
  const { data, isFetching, isError, refetch } = useGetAdminsQuery(filters, {
    skip: !ready || !canView,
    refetchOnMountOrArgChange: true,
  });
  const fields: TableFieldProps<IAdmin>[] = [
    {
      id: "name",
      label: t("NAME"),
      type: TableDataTypes.normal,
      valueGetter: (row) =>
        `${row.firstName || ""} ${row.lastName || ""}${row.id === user.id ? ` (${t("YOU")})` : ""}`.trim(),
      flex: 1,
      minWidth: 100,
    },
    {
      id: "email",
      label: t("EMAIL"),
      type: TableDataTypes.normal,
      link: true,
      linkGetter: (row) => `mailto:${row.email || ""}`,
      flex: 0.9,
      minWidth: 90,
    },
    {
      id: "phone",
      label: t("PHONE_NUMBER"),
      type: TableDataTypes.normal,
      dir: "ltr",
      link: true,
      linkGetter: (row) =>
        `https://wa.me/${row.phone?.replace(/[^0-9]/g, "") || ""}`,
      flex: 0.9,
      minWidth: 90,
    },
    {
      id: "role",
      label: t("ROLE"),
      type: TableDataTypes.normal,
      chip: true,
      toChipTitle: (value) => t(toAdminRoleTitle(value)),
      toChipColor: toAdminRoleColor,
      flex: 0.6,
      minWidth: 60,
    },
    {
      id: "createdAt",
      label: t("CREATED_AT"),
      type: TableDataTypes.date,
      flex: 0.7,
      minWidth: 70,
    },
    ...(user.role === adminRoles.admin
      ? [
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
                onActionClick: (row) => navigate(`/admins/${row.id}`),
              },
              ...adminRelatedLinks
                .filter(
                  (link) =>
                    link.available &&
                    hasOperationPermission(link.feature, "view", user),
                )
                .map((link) => ({
                  title: t(link.title),
                  color: "success" as const,
                  link: true,
                  linkGetter: (row) => link.path(row.id),
                })),
            ],
          } as TableFieldProps<IAdmin>,
        ]
      : []),
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
      <CustomTable<IAdmin>
        fields={fields}
        data={data?.results || []}
        total={data?.total || 0}
        page={filters.page}
        pageSize={filters.pageSize}
        status={
          isError
            ? FetchStatus.error
            : !ready || isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        error={isError ? t("LOAD_ERROR") : undefined}
        noDataMessage={t("NO_ADMINS")}
        checkboxSelection
        exportedFileName="Ashamco Express - Staff"
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setAdminsPageSize(pageSize));
          else dispatch(setAdminsPage(page));
        }}
      />
    </div>
  );
}
