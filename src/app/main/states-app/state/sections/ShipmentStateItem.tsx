import { useState } from "react";
import {
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { showMessage } from "@fuse/core/FuseMessage/fuseMessageSlice";
import IState, { IShipmentState } from "../../models/IState";
import IShippingCompany from "../../../shipping-companies-app/models/IShippingCompany";
import {
  useSaveShipmentStateMutation,
  useSetShipmentStateActiveMutation,
} from "../../StatesApi";
import { shipmentStateSchema } from "../../models/StateSchema";
import { displayName, shipmentStatePayload } from "../../Utils";
export default function ShipmentStateItem({
  index,
  company,
}: {
  index: number;
  company?: IShippingCompany;
}) {
  const { t } = useTranslation("statesApp");
  const dispatch = useDispatch();
  const { control, watch, getValues, setValue, trigger } =
    useFormContext<IState>();
  const path = `shipmentStates.${index}` as const;
  const row = watch(path);
  const stateId = watch("id");
  const [save, saving] = useSaveShipmentStateMutation();
  const [toggle, toggling] = useSetShipmentStateActiveMutation();
  const [error, setError] = useState(false);
  const busy = saving.isLoading || toggling.isLoading;
  async function persist(value: IShipmentState, activeOnly = false) {
    setError(false);
    try {
      const response = await (
        activeOnly
          ? toggle(value)
          : save({ ...value, ...shipmentStatePayload(value) })
      ).unwrap();
      // Keep the backend ID separate from useFieldArray's formKey. A second save must PATCH, not POST.
      setValue(
        path,
        { ...value, ...response },
        { shouldValidate: true, shouldDirty: true },
      );
      dispatch(
        showMessage({
          message: t("SHIPMENT_STATE_SAVED_SUCCESSFULLY"),
          variant: "success",
        }),
      );
    } catch {
      setError(true);
    }
  }
  return (
    <div
      className="border-1 rounded-8 p-12"
      data-testid={`mapping-${row.shippingCompanyId}`}
    >
      <div className="flex flex-wrap items-center gap-12">
        {company?.logoUrl && (
          <img
            src={company.logoUrl}
            alt={displayName(company.name)}
            className="max-w-80 max-h-32"
          />
        )}
        <Typography className="font-medium">
          {displayName(company?.name) || row.shippingCompanyId}
        </Typography>
        <FormControlLabel
          label={t("ACTIVE")}
          control={
            <Checkbox
              name={`${path}.isActive`}
              checked={row.isActive}
              disabled={busy}
              onChange={(_, checked) => {
                const next = {
                  ...getValues(path),
                  stateId,
                  isActive: checked,
                  name: checked
                    ? getValues(`${path}.name`) || getValues("name.en")
                    : getValues(`${path}.name`),
                };
                if (row.id || row._id) persist(next, true);
                else {
                  if (!checked) next.name = "";
                  setValue(path, next, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
            />
          }
        />
      </div>
      <div className="flex items-start gap-12">
        <Controller
          name={`${path}.name`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={t("NAME")}
              fullWidth
              disabled={!row.isActive || busy}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        {stateId && (
          <LoadingButton
            color="primary"
            variant="contained"
            loading={busy}
            disabled={
              !row.isActive || !shipmentStateSchema(t).safeParse(row).success
            }
            onClick={async () => {
              if (await trigger(path))
                await persist({ ...getValues(path), stateId });
            }}
            data-testid={`save-mapping-${row.shippingCompanyId}`}
          >
            {t("SAVE")}
          </LoadingButton>
        )}
      </div>
      {error && (
        <Alert severity="error">
          {t("SOMETHING_WENT_WRONG_WHEN_SAVE_SHIPMENT_STATE")}
        </Alert>
      )}
    </div>
  );
}
