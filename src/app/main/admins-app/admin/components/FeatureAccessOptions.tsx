import { Checkbox, FormControlLabel, Typography } from "@mui/material";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import IAdmin, { IAdminFeature } from "../../models/IAdmin";

export default function FeatureAccessOptions({
  index,
  row,
  disabled = false,
}: {
  index: number;
  row: IAdminFeature;
  disabled?: boolean;
}) {
  const { t } = useTranslation("adminsApp");
  const {
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<IAdmin>();
  const needsView = row?.accessCreate || row?.accessUpdate || row?.accessDelete;
  return (
    <div className="flex flex-wrap gap-16">
      {(
        ["accessView", "accessCreate", "accessUpdate", "accessDelete"] as const
      ).map((name) => (
        <FormControlLabel
          key={name}
          label={t(
            {
              accessView: "VIEW_ACCESS",
              accessCreate: "CREATE_ACCESS",
              accessUpdate: "UPDATE_ACCESS",
              accessDelete: "DELETE_ACCESS",
            }[name],
          )}
          control={
            <Checkbox
              checked={!!row?.[name]}
              disabled={disabled || (name === "accessView" && needsView)}
              inputProps={{ id: `${row.feature}-${name}` }}
              onChange={(_, checked) => {
                const next: IAdminFeature = {
                  ...getValues(`features.${index}`),
                  [name]: checked,
                };
                if (next.accessCreate || next.accessUpdate || next.accessDelete)
                  next.accessView = true;
                setValue(`features.${index}`, next, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
          }
        />
      ))}
      {errors.features?.[index]?.accessView && (
        <Typography color="error">{t("VIEW_REQUIRED")}</Typography>
      )}
    </div>
  );
}
