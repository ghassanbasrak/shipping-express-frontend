import { Button, Paper, Typography } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { newShipmentReceiver } from "../../models/ShipmentModel";
import ShipmentContactFields from "../components/ShipmentContactFields";
import type { ShipmentFormValues } from "../../models/ShipmentSchema";
export default function ReceiversTab({
  disabled = false,
  completed = [],
}: {
  disabled?: boolean;
  completed?: string[];
}) {
  const { t } = useTranslation("shipmentsApp"),
    { control } = useFormContext<ShipmentFormValues>(),
    { fields, append, remove } = useFieldArray({
      name: "receivers",
      control,
      keyName: "formKey",
    });
  return (
    <div className="space-y-24">
      <Typography className="text-18 font-semibold">
        {t("RECEIVER_DETAILS")}
      </Typography>
      {fields.map((item, index) => (
        <Paper
          key={item.formKey}
          className="p-16 space-y-16 border"
          variant="outlined"
        >
          <ShipmentContactFields
            prefix="receiver"
            path={`receivers.${index}.`}
            disabled={disabled || completed.includes(item.key)}
          />
          {fields.length > 1 && (
            <Button
              color="error"
              disabled={disabled || completed.includes(item.key)}
              onClick={() => remove(index)}
              data-testid={`remove-receiver-${index}`}
            >
              {t("REMOVE_RECEIVER")}
            </Button>
          )}
        </Paper>
      ))}
      <Button
        variant="outlined"
        disabled={disabled}
        onClick={() => append(newShipmentReceiver())}
        data-testid="add-receiver"
      >
        {t("ADD_RECEIVER")}
      </Button>
    </div>
  );
}
