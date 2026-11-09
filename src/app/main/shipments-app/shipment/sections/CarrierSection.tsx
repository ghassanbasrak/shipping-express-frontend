import {
  Alert,
  Box,
  ButtonBase,
  Chip,
  Skeleton,
  Typography,
} from "@mui/material";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import Currency from "src/app/main/utils/currencyFormatter";
import {
  carrierUnsuitableReason,
  type ShipmentCarrierChoice,
} from "../../Utils";
import type { ShipmentFormValues } from "../../models/ShipmentSchema";

export default function CarrierSection({
  choices,
  loading,
  stale,
  disabled,
  receiverName,
  onChoose,
}: {
  choices: ShipmentCarrierChoice[];
  loading: boolean;
  stale: boolean;
  disabled?: boolean;
  receiverName: (key: string) => string;
  onChoose: () => void;
}) {
  const { t } = useTranslation("shipmentsApp"),
    { watch, setValue } = useFormContext<ShipmentFormValues>(),
    selectedId = watch("shippingCompanyId");
  const groups = [
    { eligible: true, title: "SUITABLE_CARRIERS" },
    { eligible: false, title: "UNSUITABLE_CARRIERS" },
  ];
  return (
    <div className="space-y-24" data-testid="carrier-comparison-results">
      {loading && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-12"
          role="status"
          aria-label={t("REVIEWING_ALL_CARRIERS")}
        >
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} variant="rounded" height={120} />
          ))}
        </div>
      )}
      {stale && choices.length > 0 && (
        <Alert severity="info">{t("QUOTE_CHANGED")}</Alert>
      )}
      {!loading && !choices.length && (
        <Alert severity="info">{t("NO_COMPARISON_RESULTS")}</Alert>
      )}
      {groups.map((group) => {
        const rows = choices.filter(
          (choice) => choice.eligible === group.eligible,
        );
        if (!rows.length) return null;
        return (
          <div
            key={group.title}
            className="space-y-12"
            data-testid={
              group.eligible ? "suitable-carriers" : "unsuitable-carriers"
            }
          >
            <div className="flex items-center gap-8">
              <Typography className="font-semibold text-16">
                {t(group.title)}
              </Typography>
              <Chip size="small" label={rows.length} />
            </div>
            <div
              role={group.eligible ? "radiogroup" : undefined}
              aria-label={t(group.title)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-12"
            >
              {rows.map((choice) => {
                const company = choice.shippingCompany,
                  selected = group.eligible && selectedId === company.id;
                return (
                  <ButtonBase
                    key={company.id}
                    role={group.eligible ? "radio" : undefined}
                    aria-checked={group.eligible ? selected : undefined}
                    disabled={!group.eligible || disabled || stale || loading}
                    data-testid={`carrier-${company.id}`}
                    onClick={() => {
                      setValue("shippingCompanyId", company.id, {
                        shouldDirty: true,
                      });
                      setValue("shippingCompany", structuredClone(company), {
                        shouldDirty: true,
                      });
                      onChoose();
                    }}
                    className="w-full rounded-16 border-2 p-16 text-start items-start flex flex-col gap-12"
                    sx={{
                      borderColor: selected ? "primary.main" : "divider",
                      bgcolor: selected
                        ? "action.selected"
                        : "background.paper",
                      opacity: stale ? 0.55 : 1,
                    }}
                  >
                    <div className="flex w-full items-center gap-12">
                      <Box
                        className="h-48 w-48 shrink-0 rounded-12 flex items-center justify-center overflow-hidden border-1"
                        sx={{ borderColor: "divider", bgcolor: "common.white" }}
                      >
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt=""
                            className="h-36 w-36 object-contain"
                          />
                        ) : (
                          <FuseSvgIcon color="disabled">
                            heroicons-outline:truck
                          </FuseSvgIcon>
                        )}
                      </Box>
                      <Typography className="text-14 font-bold flex-1 min-w-0">
                        {company.name}
                      </Typography>
                      {selected && (
                        <FuseSvgIcon color="primary">
                          heroicons-solid:check-circle
                        </FuseSvgIcon>
                      )}
                    </div>
                    {group.eligible ? (
                      <div className="w-full flex items-end justify-between gap-8">
                        <Typography className="text-12" color="text.secondary">
                          {t("CARRIER_TOTAL_PRICE")}
                        </Typography>
                        <Typography
                          className="font-bold text-20"
                          color="primary.main"
                          data-testid={`carrier-price-${company.id}`}
                        >
                          {Currency(choice.total)}
                        </Typography>
                      </div>
                    ) : (
                      <ul className="m-0 ps-16 space-y-4 text-12 min-w-0 max-w-full break-words">
                        {choice.reasons.map((reason, index) => (
                          <li key={index}>
                            {receiverName(reason.key)
                              ? `${receiverName(reason.key)}: `
                              : ""}
                            {carrierUnsuitableReason[reason.code]
                              ? t(carrierUnsuitableReason[reason.code])
                              : reason.message || t("CARRIER_RESULT_MISSING")}
                          </li>
                        ))}
                      </ul>
                    )}
                  </ButtonBase>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
