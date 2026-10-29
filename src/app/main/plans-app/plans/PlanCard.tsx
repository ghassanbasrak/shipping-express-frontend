import { Button, Chip, Paper, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import Currency from "src/app/main/utils/currencyFormatter";
import IPlan from "../models/IPlan";
import { planStatus, toPlanStatusTitle, toPlanStatusColor } from "../Utils";
import PlanPricesView from "../shared-components/plan-prices/PlanPricesView";

export default function PlanCard({
  plan,
  handleChangeActiveItem,
  loadingChangeActive = false,
  hideActions = false,
  withFeatures = false,
  forSelect = false,
  selected = false,
  onSelect,
}: {
  plan: IPlan;
  handleChangeActiveItem?: (id: string, status: string) => void;
  loadingChangeActive?: boolean;
  hideActions?: boolean;
  withFeatures?: boolean;
  forSelect?: boolean;
  selected?: boolean;
  onSelect?: (plan: IPlan) => void;
}) {
  const { t } = useTranslation("plansApp");
  const user = useAppSelector(selectUser);
  const canUpdate = hasOperationPermission("plans", "update", user);
  return (
    <Paper
      className="flex flex-col h-full rounded-16 overflow-hidden shadow"
      data-testid={`plan-${plan.id}`}
      onClick={forSelect ? () => onSelect?.(plan) : undefined}
      sx={{
        cursor: forSelect ? "pointer" : undefined,
        ...(selected
          ? { outline: "2px solid", outlineColor: "secondary.main" }
          : {}),
      }}
    >
      <div className="p-16 flex-1">
        <div className="flex items-center justify-between gap-8">
          <Typography className="text-18 font-medium">{plan.name}</Typography>
          <Chip label={Currency(plan.price)} size="small" color="success" />
        </div>
        <Typography color="text.secondary" className="my-8">
          {plan.description}
        </Typography>
        <Chip
          label={t(toPlanStatusTitle(plan.status))}
          size="small"
          sx={{ color: toPlanStatusColor(plan.status) }}
        />
        {withFeatures && (
          <ul className="my-12 list-disc ps-16">
            {(plan.features || []).map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        )}
        <PlanPricesView prices={plan.prices} />
      </div>
      {forSelect ? (
        <Button
          color="primary"
          variant="outlined"
          onClick={(event) => {
            event.stopPropagation();
            onSelect?.(plan);
          }}
          aria-pressed={selected}
        >
          {t(selected ? "SELECTED" : "SELECT")}
        </Button>
      ) : (
        !hideActions && (
          <div className="flex gap-8 border-t-1 p-8">
            {canUpdate && (
              <LoadingButton
                variant="outlined"
                loading={loadingChangeActive}
                color={plan.status === planStatus.active ? "error" : "success"}
                onClick={() =>
                  handleChangeActiveItem?.(
                    plan.id,
                    plan.status === planStatus.active
                      ? planStatus.disabled
                      : planStatus.active,
                  )
                }
                data-testid={`toggle-plan-${plan.id}`}
              >
                {t(
                  plan.status === planStatus.active ? "DEACTIVATE" : "ACTIVATE",
                )}
              </LoadingButton>
            )}
            <Button
              color="primary"
              variant="outlined"
              component={Link}
              to={`/plans/${plan.id}`}
            >
              {t(canUpdate ? "EDIT" : "VIEW")}
            </Button>
          </div>
        )
      )}
    </Paper>
  );
}
