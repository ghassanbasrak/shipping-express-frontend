import { useMemo, useRef } from "react";
import {
  Alert,
  Button,
  Checkbox,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { WithdrawRequestForm } from "../../models/WithdrawRequestSchema";
import { useGetWithdrawRequestShipmentsQuery } from "../../WithdrawRequestsApi";
import {
  decompressShipment,
  toShipmentStatusTitle,
  toShippingTypeTitle,
} from "../../../shipments-app/Utils";
import { selectedWithdrawalAmount, withdrawalWalletNet } from "../../Utils";
import Currency from "../../../utils/currencyFormatter";
import IShipment from "../../../shipments-app/models/IShipment";
export default function BasicInfoTab({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation("withdrawRequestsApp"),
    { control, watch, setValue } = useFormContext<WithdrawRequestForm>();
  const query = useGetWithdrawRequestShipmentsQuery(undefined, {
    skip: disabled,
    refetchOnMountOrArgChange: true,
  });
  const shipments = useMemo(
    () => query.currentData?.results.map(decompressShipment) || [],
    [query.currentData],
  );
  // Retain labels for selected records when a refreshed eligibility response no longer includes them.
  const labels = useRef(new Map<string, IShipment>());
  shipments.forEach((item) => labels.current.set(item.id, item));
  const ids = watch("shipmentIds") || [],
    amount = watch("amount") || 0;
  const options = [
    ...shipments,
    ...ids
      .filter((id) => !shipments.some((item) => item.id === id))
      .map((id) => labels.current.get(id) || { id }),
  ];
  return (
    <div className="space-y-16">
      {!disabled && query.isError && (
        <Alert
          severity="error"
          action={
            <Button
              color="primary"
              variant="outlined"
              onClick={() => query.refetch()}
            >
              {t("RETRY")}
            </Button>
          }
        >
          {t("SHIPMENTS_LOAD_ERROR")}
        </Alert>
      )}
      {!disabled &&
        ids.some((id) => !shipments.some((item) => item.id === id)) &&
        !query.isFetching &&
        !query.isError && (
          <Alert severity="warning">{t("STALE_SHIPMENTS")}</Alert>
        )}
      <Controller
        name="shipmentIds"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            value={field.value || []}
            select
            fullWidth
            required
            disabled={disabled || query.isFetching || query.isError}
            label={t("COD_SHIPMENTS")}
            error={!!fieldState.error}
            helperText={
              fieldState.error?.message || t("SELECT_SHIPMENTS_MESSAGE")
            }
            SelectProps={{
              multiple: true,
              renderValue: (selected: string[]) =>
                selected
                  .map((id) => labels.current.get(id)?.trackingNumber || id)
                  .join(", "),
            }}
            onChange={(event) => {
              const next =
                typeof event.target.value === "string"
                  ? event.target.value.split(",")
                  : (event.target.value as string[]);
              field.onChange(next);
              const nextAmount = selectedWithdrawalAmount(next, shipments);
              setValue("amount", nextAmount ?? 0, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          >
            {options.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                <Checkbox checked={ids.includes(item.id)} />
                <div className="whitespace-normal">
                  <Typography>
                    {item.shippingCompany?.iconUrl && (
                      <img
                        className="inline h-20 me-8"
                        src={item.shippingCompany.iconUrl}
                        alt=""
                      />
                    )}
                    {item.trackingNumber || item.id} —{" "}
                    {Currency(item.codPrice || 0)}
                  </Typography>
                  {item.method && (
                    <Typography>
                      {t(toShippingTypeTitle(item.method), {
                        ns: "shipmentsApp",
                      })}{" "}
                      ·{" "}
                      {t(toShipmentStatusTitle(item.status), {
                        ns: "shipmentsApp",
                      })}
                    </Typography>
                  )}
                  {item.senderName && (
                    <Typography>
                      {t("SENDER")}: {item.senderName}
                    </Typography>
                  )}
                  {item.receiverName && (
                    <Typography>
                      {t("RECEIVER")}: {item.receiverName}
                    </Typography>
                  )}
                </div>
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        name="amount"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            fullWidth
            label={t("AMOUNT")}
            InputProps={{ readOnly: true }}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            value={field.value || ""}
            fullWidth
            multiline
            rows={3}
            disabled={disabled}
            label={t("REQUEST_NOTES")}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
          />
        )}
      />
      <Typography>
        {t("WITHDRAW_AMOUNT")}: {Currency(amount)}
      </Typography>
      <Typography data-testid="wallet-net">
        {t("TOPUP_AMOUNT")}: {Currency(withdrawalWalletNet(amount))}
      </Typography>
    </div>
  );
}
