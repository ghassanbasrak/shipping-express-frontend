import { useEffect, useState } from "react";
import { Alert, Button } from "@mui/material";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import CustomGrid from "app/shared-components/custom-grid/CustomGrid";
import AlertDialog from "app/shared-components/alert-dialog/AlertDialog";
import { openDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import { useAppDispatch, useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { FetchStatus } from "src/app/main/utils/dataStatus";
import {
  GetShippingCompaniesApiArg,
  useGetShippingCompaniesQuery,
  useUpdateShippingCompanyMutation,
} from "../ShippingCompaniesApi";
import {
  newShippingCompaniesInstance,
  resetShippingCompanies,
  selectShippingCompaniesFilters,
  setShippingCompaniesPage,
  setShippingCompaniesPageSize,
} from "../store/shippingCompaniesSlice";
import IShippingCompany from "../models/IShippingCompany";
import ShippingCompanyCard from "./ShippingCompanyCard";

function ShippingCompaniesContent() {
  const { t } = useTranslation("shippingCompaniesApp");
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const canView = hasOperationPermission("shipping-companies", "view", user);
  const filters = useSelector(
    selectShippingCompaniesFilters,
  ) as GetShippingCompaniesApiArg;
  const [ready, setReady] = useState(false);
  const [loadingChangeActiveItem, setLoadingChangeActiveItem] =
    useState<string>();
  const { data, isFetching, isError, refetch } = useGetShippingCompaniesQuery(
    filters,
    { skip: !ready || !canView, refetchOnMountOrArgChange: true },
  );
  const [updateShippingCompany] = useUpdateShippingCompanyMutation();
  useEffect(() => {
    dispatch(newShippingCompaniesInstance(null));
    setReady(true);
    return () => {
      dispatch(resetShippingCompanies(null));
    };
  }, [dispatch]);

  function handleChangeActiveShippingCompany(company: IShippingCompany) {
    if (!hasOperationPermission("shipping-companies", "update", user)) return;
    const active = !company.isActive;
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t(
              `${active ? "ACTIVATE" : "DEACTIVATE"}_SHIPPING_COMPANY_TITLE`,
            )}
            message={`${t(`${active ? "ACTIVATE" : "DEACTIVATE"}_SHIPPING_COMPANY_MESSAGE`)} "${company.name}"`}
            onSubmit={async () => {
              setLoadingChangeActiveItem(company.id);
              try {
                await updateShippingCompany({
                  id: company.id,
                  isActive: active,
                }).unwrap();
                dispatch(
                  showMessage({
                    message: t(
                      `SHIPPING_COMPANY_${active ? "ACTIVATED" : "DEACTIVATED"}_SUCCESSFULLY`,
                    ),
                    variant: "success",
                  }),
                );
              } catch {
                dispatch(
                  showMessage({
                    message: t(
                      `SOMETHING_WENT_WRONG_WHEN_${active ? "ACTIVATE" : "DEACTIVATE"}_SHIPPING_COMPANY`,
                    ),
                    variant: "error",
                  }),
                );
              } finally {
                setLoadingChangeActiveItem(undefined);
              }
            }}
          />
        ),
      }),
    );
  }

  if (!canView) return <Navigate to="/home" replace />;
  return (
    <div className="flex flex-col flex-1 w-full">
      {isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => refetch()}>{t("RETRY")}</Button>}
        >
          {t("LOAD_ERROR")}
        </Alert>
      )}
      <CustomGrid<IShippingCompany>
        data={data?.results || []}
        total={data?.total || 0}
        page={filters.page}
        pageSize={filters.pageSize}
        gridMdColumns={3}
        gridLgColumns={4}
        status={
          isError
            ? FetchStatus.error
            : !ready || isFetching
              ? FetchStatus.loading
              : FetchStatus.done
        }
        noDataMessage={t("NO_SHIPPING_COMPANIES")}
        affectedMemoVars={[loadingChangeActiveItem, user, t]}
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setShippingCompaniesPageSize(pageSize));
          else dispatch(setShippingCompaniesPage(page));
        }}
        renderGridItem={(company) => (
          <ShippingCompanyCard
            shippingCompany={company}
            loadingChangeActive={loadingChangeActiveItem === company.id}
            handleChangeActiveItem={handleChangeActiveShippingCompany}
          />
        )}
      />
    </div>
  );
}
export default ShippingCompaniesContent;
