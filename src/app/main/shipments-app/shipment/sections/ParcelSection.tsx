import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import MediaInput from "app/shared-components/media-input/MediaInput";
import { MediaInputTypes } from "app/shared-components/media-input/Utils";
import { shipmentVolumetricWeight } from "../../Utils";
import type { ShipmentFormValues } from "../../models/ShipmentSchema";
import ShipmentField from "../components/ShipmentField";
import ShipmentChoiceTile from "../components/ShipmentChoiceTile";

export default function ParcelSection({
  disabled = false,
  calculator = false,
  onUploadBusy,
}: {
  disabled?: boolean;
  calculator?: boolean;
  onUploadBusy: (busy: boolean) => void;
}) {
  const { t } = useTranslation("shipmentsApp"),
    { watch, setValue, formState } = useFormContext<ShipmentFormValues>(),
    form = watch();
  const needsImage =
    form.method === "international" || form.type === "document";
  return (
    <div className="space-y-24">
      <div
        role="radiogroup"
        aria-label={t("SHIPMENT_TYPE")}
        className="grid grid-cols-1 gap-12 sm:grid-cols-2"
      >
        <ShipmentChoiceTile
          icon="heroicons-outline:cube"
          title={t("BOXES")}
          hint={t("SHIPMENT_TYPE_BOXES_HINT")}
          active={form.type !== "document"}
          disabled={disabled}
          testId="shipment-type-box"
          onClick={() => setValue("type", "box", { shouldDirty: true })}
        />
        <ShipmentChoiceTile
          icon="heroicons-outline:document-text"
          title={t("DOCUMENT")}
          hint={t("SHIPMENT_TYPE_DOCUMENT_HINT")}
          active={form.type === "document"}
          disabled={disabled}
          testId="shipment-type-document"
          onClick={() => setValue("type", "document", { shouldDirty: true })}
        />
      </div>

      <div className="space-y-12">
        <Typography className="text-14 font-semibold">
          {t("PACKAGE_SIZE_AND_WEIGHT")}
        </Typography>
        <div className="grid grid-cols-2 gap-16 sm:grid-cols-3">
          {[
            ["length", "LENGTH", "CM"],
            ["width", "WIDTH", "CM"],
            ["height", "HEIGHT", "CM"],
            ["weight", "WEIGHT", "KG"],
            ["packagesCount", "BOXES_NUMBER", ""],
          ].map(([name, label, unit]) => (
            <ShipmentField
              key={name}
              name={name}
              type="number"
              required
              disabled={disabled}
              label={t(label)}
              unit={unit ? t(unit) : undefined}
            />
          ))}
          <Box
            sx={(theme) => ({
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              px: 1.5,
              py: 0.75,
              minHeight: 56,
              borderRadius: "12px",
              backgroundColor: alpha(theme.palette.primary.main, 0.07),
              border: `1px dashed ${alpha(theme.palette.primary.main, 0.5)}`,
            })}
            data-testid="volumetric-weight"
          >
            <Typography
              color="text.secondary"
              className="text-11 leading-tight"
            >
              {t("VOLUMETRIC_WEIGHT")}
            </Typography>
            <Typography className="text-15 font-bold" dir="ltr">
              {shipmentVolumetricWeight(form)} {t("KG")}
            </Typography>
            {!form.shippingCompanyId && (
              <Typography className="text-11" color="text.secondary">
                {t("WEIGHT_CARRIER_HINT")}
              </Typography>
            )}
          </Box>
        </div>
      </div>

      {!calculator && (
        <div className="space-y-16">
          <ShipmentField
            name="description"
            label={t("SHIPMENT_DESCRIPTION")}
            multiline
            required
            disabled={disabled}
          />
          {needsImage && (
            <Box
              sx={(theme) => ({
                border: `1px dashed ${formState.errors.imageUrl ? theme.palette.error.main : theme.palette.divider}`,
                borderRadius: "16px",
                p: 2,
              })}
            >
              <MediaInput
                type={MediaInputTypes.file}
                name="imageUrl"
                label={t("SHIPMENT_IMAGE")}
                accept="image/*"
                disabled={disabled}
                onBusy={onUploadBusy}
              />
            </Box>
          )}
        </div>
      )}
    </div>
  );
}
