import { Box, Button, IconButton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { UploadFileInput } from "src/app/main/auth-app/verify-account/VerifyAccountPage";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
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
    user = useAppSelector(selectUser),
    { control, watch, setValue, formState } =
      useFormContext<ShipmentFormValues>(),
    form = watch(),
    { fields, append, remove } = useFieldArray({
      control,
      name: "products",
      keyName: "formKey",
    });
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
          {form.type !== "document" && (
            <ShipmentField
              name="isCommercial"
              type="checkbox"
              label={t("IS_COMMERCIAL")}
              helper={t("IS_COMMERCIAL_HINT")}
              disabled={disabled}
            />
          )}
          {form.isCommercial && form.type !== "document" && (
            <Box
              sx={(theme) => ({
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "16px",
                p: { xs: 1.5, sm: 2 },
              })}
              className="space-y-16"
            >
              {fields.map((item, index) => (
                <div
                  key={item.formKey}
                  className="grid grid-cols-2 items-start gap-12 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <ShipmentField
                    name={`products.${index}.title`}
                    label={t("PRODUCT_NAME")}
                    className="col-span-2 sm:col-span-1"
                    disabled={disabled}
                    required
                  />
                  <ShipmentField
                    name={`products.${index}.price`}
                    label={t("PRICE")}
                    disabled={disabled}
                    type="number"
                    required
                  />
                  <ShipmentField
                    name={`products.${index}.quantity`}
                    label={t("QUANTITY")}
                    disabled={disabled}
                    type="number"
                    required
                  />
                  <IconButton
                    disabled={disabled}
                    color="error"
                    aria-label={t("REMOVE")}
                    onClick={() => remove(index)}
                    sx={{ mt: 0.75 }}
                  >
                    <FuseSvgIcon size={20}>heroicons-outline:trash</FuseSvgIcon>
                  </IconButton>
                </div>
              ))}
              <Button
                disabled={disabled}
                onClick={() => append({ title: "", price: 0, quantity: 1 })}
                startIcon={
                  <FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>
                }
                data-testid="add-shipment-product"
              >
                {t("ADD_PRODUCT")}
              </Button>
              {formState.errors.products && (
                <Typography color="error" className="text-13">
                  {t("YOU_SHOULD_ADD_ONE_PRODUCT")}
                </Typography>
              )}
            </Box>
          )}
          {needsImage && (
            <Box
              sx={(theme) => ({
                border: `1px dashed ${formState.errors.imageUrl ? theme.palette.error.main : theme.palette.divider}`,
                borderRadius: "16px",
                p: 2,
              })}
            >
              <UploadFileInput
                name="imageUrl"
                userId={user.id}
                label={t("SHIPMENT_IMAGE")}
                accept="image/*"
                onBusy={onUploadBusy}
              />
            </Box>
          )}
          <ShipmentField
            name="acceptExtraWeightTerms"
            type="checkbox"
            label={t("ACCEPT_EXTRA_WEIGHT_TERMS")}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
