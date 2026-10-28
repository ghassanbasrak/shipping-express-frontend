import { Button, MenuItem, Typography } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { UploadFileInput } from "src/app/main/auth-app/verify-account/VerifyAccountPage";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { shipmentVolumetricWeight } from "../../Utils";
import type { ShipmentFormValues } from "../../models/ShipmentSchema";
import ShipmentField from "../components/ShipmentField";
export default function ParcelTab({
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
    { control, watch, formState } = useFormContext<ShipmentFormValues>(),
    form = watch(),
    { fields, append, remove } = useFieldArray({
      control,
      name: "products",
      keyName: "formKey",
    });
  return (
    <div className="space-y-16">
      <Typography className="text-18 font-semibold">
        {t("SHIPMENT_DETAILS")}
      </Typography>
      <ShipmentField name="type" label={t("SHIPMENT_TYPE")} disabled={disabled}>
        <MenuItem value="box">{t("BOXES")}</MenuItem>
        <MenuItem value="document">{t("DOCUMENT")}</MenuItem>
      </ShipmentField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
        {["length", "width", "height", "weight", "packagesCount"].map(
          (name) => (
            <ShipmentField
              key={name}
              name={name}
              type="number"
              required
              disabled={disabled}
              label={t(
                {
                  length: "LENGTH",
                  width: "WIDTH",
                  height: "HEIGHT",
                  weight: "WEIGHT",
                  packagesCount: "BOXES_NUMBER",
                }[name],
              )}
            />
          ),
        )}
      </div>
      <Typography>
        {t("VOLUMETRIC_WEIGHT")}: {shipmentVolumetricWeight(form)} {t("KG")}
      </Typography>
      {!calculator && (
        <>
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
              disabled={disabled}
            />
          )}
          {form.isCommercial && form.type !== "document" && (
            <div className="space-y-16">
              {fields.map((item, index) => (
                <div
                  key={item.formKey}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-8"
                >
                  <ShipmentField
                    name={`products.${index}.title`}
                    label={t("PRODUCT_NAME")}
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
                  <Button
                    disabled={disabled}
                    color="error"
                    onClick={() => remove(index)}
                  >
                    {t("REMOVE")}
                  </Button>
                </div>
              ))}
              <Button
                disabled={disabled}
                onClick={() => append({ title: "", price: 0, quantity: 1 })}
                data-testid="add-shipment-product"
              >
                {t("ADD_PRODUCT")}
              </Button>
              {formState.errors.products && (
                <Typography color="error">
                  {t("YOU_SHOULD_ADD_ONE_PRODUCT")}
                </Typography>
              )}
            </div>
          )}
          {(form.method === "international" || form.type === "document") && (
            <UploadFileInput
              name="imageUrl"
              userId={user.id}
              label={t("SHIPMENT_IMAGE")}
              accept="image/*"
              onBusy={onUploadBusy}
            />
          )}
          <ShipmentField
            name="acceptExtraWeightTerms"
            type="checkbox"
            label={t("ACCEPT_EXTRA_WEIGHT_TERMS")}
            disabled={disabled}
          />
          {formState.errors.acceptExtraWeightTerms && (
            <Typography color="error">
              {formState.errors.acceptExtraWeightTerms.message}
            </Typography>
          )}
        </>
      )}
    </div>
  );
}
