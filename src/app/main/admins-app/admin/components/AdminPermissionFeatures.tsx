import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import IAdmin from "../../models/IAdmin";
import { featureTypes, toFeaturesTypeTitle } from "../../Utils";
import FeatureAccessOptions from "./FeatureAccessOptions";

export default function AdminPermissionFeatures({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { t } = useTranslation("adminsApp");
  const { control } = useFormContext<IAdmin>();
  const { append, remove } = useFieldArray({
    control,
    name: "features",
    keyName: "formKey",
  });
  const features = useWatch({ control, name: "features" }) || [];
  // Retain and expose grants returned by the backend, including future feature IDs.
  const options = Array.from(
    new Set([
      ...Object.values(featureTypes),
      ...features.map((row) => row.feature),
    ]),
  );
  return (
    <div>
      {options.map((feature) => {
        const index = features.findIndex((row) => row.feature === feature);
        return (
          <Accordion key={feature} data-testid={`permission-${feature}`}>
            <AccordionSummary
              expandIcon={
                <FuseSvgIcon size={20}>
                  heroicons-outline:chevron-down
                </FuseSvgIcon>
              }
            >
              <FormControlLabel
                label={t(toFeaturesTypeTitle(feature))}
                onClick={(event) => event.stopPropagation()}
                onFocus={(event) => event.stopPropagation()}
                control={
                  <Checkbox
                    checked={index >= 0}
                    disabled={disabled}
                    inputProps={{
                      "aria-label": t(toFeaturesTypeTitle(feature)),
                    }}
                    onChange={(_, checked) => {
                      if (checked)
                        append({
                          feature,
                          accessView: true,
                          accessCreate: true,
                          accessUpdate: true,
                          accessDelete: true,
                        });
                      else remove(index);
                    }}
                  />
                }
              />
            </AccordionSummary>
            <AccordionDetails>
              {index >= 0 && (
                <FeatureAccessOptions
                  index={index}
                  row={features[index]}
                  disabled={disabled}
                />
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
}
