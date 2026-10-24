import { useFieldArray, useFormContext } from "react-hook-form";
import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { applicationFeatures, newApplicationScope } from "../../Utils";
import IApplication from "../../models/IApplication";
import ApplicationScope from "./ApplicationScope";
export default function ApplicationScopes({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { t } = useTranslation("applicationsApp"),
    { control, watch } = useFormContext<IApplication>();
  const { append, remove } = useFieldArray({
      control,
      name: "scopes",
      keyName: "formKey",
    }),
    scopes = watch("scopes") || [];
  const features = Array.from(
    new Set([
      ...Object.values(applicationFeatures),
      ...scopes.map((scope) => scope.feature),
    ]),
  );
  return (
    <div className="space-y-16">
      <Typography className="text-18 font-semibold">
        {t("APPLICATION_SCOPES")}
      </Typography>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-16">
        {features.map((feature) => {
          const index = scopes.findIndex((scope) => scope.feature === feature);
          return (
            <ApplicationScope
              key={feature}
              feature={feature}
              index={index}
              disabled={disabled}
              onToggle={() => {
                if (disabled) return;
                if (index >= 0) remove(index);
                else append(newApplicationScope(feature));
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
