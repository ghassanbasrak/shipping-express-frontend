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
  GetPlansApiArg,
  useGetPlansQuery,
  useUpdatePlanMutation,
} from "../PlansApi";
import {
  newPlansInstance,
  resetPlans,
  selectPlansFilters,
  setPlansPage,
  setPlansPageSize,
} from "../store/plansSlice";
import IPlan from "../models/IPlan";
import { planStatus } from "../Utils";
import PlanCard from "./PlanCard";

function PlansContent() {
  const { t } = useTranslation("plansApp");
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const canView = hasOperationPermission("plans", "view", user);
  const filters = useSelector(selectPlansFilters) as GetPlansApiArg;
  const [ready, setReady] = useState(false);
  const [loadingChangeActiveItem, setLoadingChangeActiveItem] =
    useState<string>();
  const { data, isFetching, isError, refetch } = useGetPlansQuery(filters, {
    skip: !ready || !canView,
    refetchOnMountOrArgChange: true,
  });
  const [updatePlan] = useUpdatePlanMutation();
  useEffect(() => {
    dispatch(newPlansInstance(null));
    setReady(true);
    return () => {
      dispatch(resetPlans(null));
    };
  }, [dispatch]);

  function handleChangeActivePlan(plan: IPlan) {
    if (!hasOperationPermission("plans", "update", user)) return;
    const active = plan.status !== planStatus.active;
    dispatch(
      openDialog({
        children: (
          <AlertDialog
            title={t(`${active ? "ACTIVATE" : "DEACTIVATE"}_PLAN_TITLE`)}
            message={`${t(`${active ? "ACTIVATE" : "DEACTIVATE"}_PLAN_MESSAGE`)} "${plan.name}"`}
            onSubmit={async () => {
              setLoadingChangeActiveItem(plan.id);
              try {
                await updatePlan({
                  id: plan.id,
                  status: active ? planStatus.active : planStatus.disabled,
                }).unwrap();
                dispatch(
                  showMessage({
                    message: t(
                      `PLAN_${active ? "ACTIVATED" : "DEACTIVATED"}_SUCCESSFULLY`,
                    ),
                    variant: "success",
                  }),
                );
              } catch {
                dispatch(
                  showMessage({
                    message: t(
                      `SOMETHING_WENT_WRONG_WHEN_${active ? "ACTIVATE" : "DEACTIVATE"}_PLAN`,
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
      <CustomGrid<IPlan>
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
        noDataMessage={t("NO_PLANS")}
        affectedMemoVars={[loadingChangeActiveItem, user, t]}
        onChangePagination={({ page, pageSize }) => {
          if (pageSize !== filters.pageSize)
            dispatch(setPlansPageSize(pageSize));
          else dispatch(setPlansPage(page));
        }}
        renderGridItem={(plan) => (
          <PlanCard
            plan={plan}
            loadingChangeActive={loadingChangeActiveItem === plan.id}
            handleChangeActiveItem={() => handleChangeActivePlan(plan)}
          />
        )}
      />
    </div>
  );
}
export default PlansContent;
