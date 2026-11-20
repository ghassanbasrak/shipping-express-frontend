import { useId, type InputHTMLAttributes } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Radio,
  RadioGroup,
  Skeleton,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import Currency from "src/app/main/utils/currencyFormatter";
import {
  carrierUnsuitableReason,
  type ShipmentCarrierChoice,
} from "../../Utils";
import type { ShipmentFormValues } from "../../models/ShipmentSchema";

function CarrierLogo({ choice }: { choice: ShipmentCarrierChoice }) {
  return (
    <Avatar
      src={choice.shippingCompany.logoUrl}
      alt=""
      variant="rounded"
      className="h-56 w-56 shrink-0 rounded-12 border-1 p-8"
      sx={{
        bgcolor: "common.white",
        color: "primary.main",
        borderColor: "divider",
        "& img": { objectFit: "contain" },
      }}
    >
      <FuseSvgIcon size={26}>heroicons-outline:truck</FuseSvgIcon>
    </Avatar>
  );
}

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
    selectedId = watch("shippingCompanyId"),
    id = useId();
  const available = choices
    .filter((choice) => choice.eligible)
    .sort((a, b) => a.total - b.total);
  const unavailable = choices.filter((choice) => !choice.eligible);
  const locked = Boolean(disabled || stale || loading);

  function choose(companyId: string) {
    const choice = available.find(
      (item) => item.shippingCompany.id === companyId,
    );
    if (locked || !choice) return;
    setValue("shippingCompanyId", companyId, { shouldDirty: true });
    setValue("shippingCompany", structuredClone(choice.shippingCompany), {
      shouldDirty: true,
    });
    onChoose();
  }

  return (
    <div
      className="space-y-24"
      data-testid="carrier-comparison-results"
      aria-busy={loading}
    >
      {loading && (
        <div className="space-y-12" role="status">
          <Typography className="text-13" color="text.secondary">
            {t("REVIEWING_ALL_CARRIERS")}
          </Typography>
          {[0, 1, 2].map((index) => (
            <Skeleton
              key={index}
              variant="rounded"
              height={112}
              className="rounded-16"
            />
          ))}
        </div>
      )}
      {stale && choices.length > 0 && (
        <Alert severity="info">{t("QUOTE_CHANGED")}</Alert>
      )}
      {!loading && !choices.length && (
        <Alert severity="info">{t("NO_COMPARISON_RESULTS")}</Alert>
      )}
      {!loading && available.length === 0 && unavailable.length > 0 && (
        <Alert severity="info">{t("NO_ELIGIBLE_CARRIERS_HINT")}</Alert>
      )}
      {available.length > 0 && (
        <div className="space-y-16" data-testid="suitable-carriers">
          <div className="flex flex-wrap items-center justify-between gap-8">
            <Typography component="h3" className="font-semibold text-14">
              {t("AVAILABLE_CARRIER_COUNT", { count: available.length })}
            </Typography>
            <Typography
              className="flex items-center gap-4 text-12"
              color="text.secondary"
            >
              <FuseSvgIcon size={16}>
                heroicons-outline:sort-ascending
              </FuseSvgIcon>
              {t("CARRIERS_LOWEST_FIRST")}
            </Typography>
          </div>
          <RadioGroup
            name={`${id}-carrier`}
            aria-label={t("SUITABLE_CARRIERS")}
            value={selectedId || ""}
            onChange={(_, value) => choose(value)}
            className="gap-12"
          >
            {available.map((choice) => {
              const company = choice.shippingCompany;
              const selected = selectedId === company.id;
              const lowest =
                available.length > 1 && choice.total === available[0].total;
              const labelId = `${id}-${company.id}-name`;
              const priceId = `${id}-${company.id}-price`;
              return (
                <Box
                  component="label"
                  key={company.id}
                  className="grid w-full grid-cols-[56px_minmax(0,1fr)_24px] items-center gap-x-12 gap-y-16 rounded-16 border-2 p-16 text-start transition-colors sm:grid-cols-[56px_minmax(0,1fr)_auto_24px] sm:gap-x-16 sm:p-20"
                  sx={(theme) => ({
                    cursor: locked ? "default" : "pointer",
                    borderColor: selected ? "primary.main" : "divider",
                    bgcolor: selected
                      ? alpha(theme.palette.primary.main, 0.055)
                      : "background.paper",
                    opacity: locked ? 0.6 : 1,
                    "&:hover": locked
                      ? {}
                      : {
                          borderColor: "primary.main",
                          bgcolor: alpha(
                            theme.palette.primary.main,
                            selected ? 0.08 : 0.025,
                          ),
                        },
                    "&:focus-within": {
                      outline: `3px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                      outlineOffset: 3,
                    },
                  })}
                >
                  <CarrierLogo choice={choice} />
                  <div className="min-w-0 space-y-6">
                    <Typography
                      id={labelId}
                      className="break-words text-16 font-bold"
                    >
                      {company.name}
                    </Typography>
                    <div className="flex flex-wrap items-center gap-8">
                      {lowest && (
                        <Chip
                          size="small"
                          label={t("CARRIER_LOWEST_PRICE")}
                          className="h-24 rounded-6 text-11 font-semibold"
                          sx={(theme) => ({
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            color:
                              theme.palette.mode === "dark"
                                ? "success.light"
                                : "success.dark",
                          })}
                        />
                      )}
                      <Typography
                        className="text-12"
                        color={selected ? "primary.main" : "text.secondary"}
                      >
                        {t(selected ? "CARRIER_SELECTED" : "CARRIER_SELECT")}
                      </Typography>
                    </div>
                  </div>
                  <Box
                    className="col-span-3 row-start-2 flex items-center justify-between gap-12 border-t-1 pt-12 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:flex-col sm:items-end sm:gap-4 sm:border-t-0 sm:pt-0"
                    sx={{ borderColor: "divider" }}
                  >
                    <Typography className="text-12" color="text.secondary">
                      {t("CARRIER_QUOTE_TOTAL")}
                    </Typography>
                    <Typography
                      id={priceId}
                      className="whitespace-nowrap text-24 font-bold leading-tight tabular-nums"
                      color={selected ? "primary.main" : "text.primary"}
                      data-testid={`carrier-price-${company.id}`}
                    >
                      <bdi>{Currency(choice.total)}</bdi>
                    </Typography>
                  </Box>
                  <Radio
                    value={company.id}
                    disabled={locked}
                    className="col-start-3 row-start-1 p-0 sm:col-start-4"
                    inputProps={
                      {
                        "aria-labelledby": `${labelId} ${priceId}`,
                        "data-testid": `carrier-${company.id}`,
                      } as InputHTMLAttributes<HTMLInputElement>
                    }
                  />
                </Box>
              );
            })}
          </RadioGroup>
          <Typography
            className="flex items-start gap-6 text-12"
            color="text.secondary"
          >
            <FuseSvgIcon size={16} className="shrink-0">
              heroicons-outline:information-circle
            </FuseSvgIcon>
            {t("CARRIER_TOTAL_SCOPE")}
          </Typography>
        </div>
      )}
      {unavailable.length > 0 && (
        <Box
          component="details"
          key={available.length ? "with-offers" : "without-offers"}
          open={available.length === 0 ? true : undefined}
          className="group rounded-16 border-1"
          sx={{ borderColor: "divider" }}
          data-testid="unsuitable-carriers"
        >
          <Box
            component="summary"
            className="flex cursor-pointer list-none items-center gap-12 rounded-16 p-16 [&::-webkit-details-marker]:hidden"
            sx={{
              bgcolor: "action.hover",
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: 2,
              },
            }}
          >
            <FuseSvgIcon size={20} color="disabled">
              heroicons-outline:ban
            </FuseSvgIcon>
            <div className="min-w-0 flex-1">
              <Typography className="text-13 font-semibold">
                {t("UNSUITABLE_CARRIERS")} · {unavailable.length}
              </Typography>
              <Typography className="mt-4 text-12" color="text.secondary">
                {t("CARRIER_UNAVAILABLE_HINT")}
              </Typography>
            </div>
            <FuseSvgIcon
              size={18}
              className="shrink-0 transition-transform group-open:rotate-180"
            >
              heroicons-outline:chevron-down
            </FuseSvgIcon>
          </Box>
          <div className="space-y-16 p-16">
            {unavailable.map((choice) => (
              <div
                key={choice.shippingCompany.id}
                className="flex items-start gap-12"
              >
                <CarrierLogo choice={choice} />
                <div className="min-w-0 flex-1">
                  <Typography className="text-14 font-semibold">
                    {choice.shippingCompany.name}
                  </Typography>
                  <Typography
                    component="ul"
                    className="mb-0 mt-6 space-y-4 ps-16 text-12 break-words"
                    color="text.secondary"
                  >
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
                  </Typography>
                </div>
                <Radio
                  disabled
                  inputProps={
                    {
                      "aria-label": choice.shippingCompany.name,
                      "data-testid": `carrier-${choice.shippingCompany.id}`,
                    } as InputHTMLAttributes<HTMLInputElement>
                  }
                  className="p-0"
                />
              </div>
            ))}
          </div>
        </Box>
      )}
    </div>
  );
}
