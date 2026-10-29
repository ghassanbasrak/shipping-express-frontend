import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { newShipmentReceiver } from "../../models/ShipmentModel";
import ShipmentContactFields from "../components/ShipmentContactFields";
import type { ShipmentFormValues } from "../../models/ShipmentSchema";

export default function ReceiversSection({
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
    <div className="space-y-16">
      {fields.map((item, index) => {
        const locked = disabled || completed.includes(item.key);
        return (
          <Box
            key={item.formKey}
            sx={(theme) => ({
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: "16px",
              p: { xs: 1.5, sm: 2.5 },
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
            })}
          >
            {(fields.length > 1 || completed.includes(item.key)) && (
              <div className="mb-16 flex items-center justify-between gap-8">
                <Typography className="text-14 font-semibold">
                  {t("RECEIVER_NUMBER", { number: index + 1 })}
                </Typography>
                {fields.length > 1 && (
                  <Tooltip title={t("REMOVE_RECEIVER")}>
                    <span>
                      <IconButton
                        color="error"
                        size="small"
                        aria-label={t("REMOVE_RECEIVER")}
                        disabled={locked}
                        onClick={() => remove(index)}
                        data-testid={`remove-receiver-${index}`}
                      >
                        <FuseSvgIcon size={20}>
                          heroicons-outline:trash
                        </FuseSvgIcon>
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </div>
            )}
            <ShipmentContactFields
              prefix="receiver"
              path={`receivers.${index}.`}
              disabled={locked}
            />
          </Box>
        );
      })}
      <Button
        variant="outlined"
        disabled={disabled}
        onClick={() => append(newShipmentReceiver())}
        startIcon={<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>}
        data-testid="add-receiver"
        sx={{ borderStyle: "dashed", borderRadius: "12px" }}
      >
        {t("ADD_RECEIVER")}
      </Button>
    </div>
  );
}
