import { z } from "zod";
import { TFunction } from "i18next";
import {
  localeStringValidation,
  requiredStringValidation,
  optionalStringValidation,
  optionalBooleanValidation,
  optionalNumberValidation,
  arrayValidation,
} from "src/app/main/utils/validations";
import { applicationFeatureCanWrite } from "../Utils";
export const applicationSchema = (t: TFunction) =>
  z
    .object({
      name: localeStringValidation({
        requiredLanguages: ["en"],
        error: t("REQUIRED_FIELD"),
      }),
      clientName: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
      userId: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
      scopes: arrayValidation({
        optional: true,
        itemSchema: z
          .object({
            feature: optionalStringValidation(),
            read: optionalBooleanValidation(),
            write: optionalBooleanValidation(),
            maxHourlyUsage: optionalNumberValidation(),
          })
          .passthrough(),
      }),
    })
    .passthrough()
    .superRefine((values, ctx) => {
      (values.scopes || []).forEach((scope, index) => {
        if (
          applicationFeatureCanWrite(scope.feature) &&
          scope.write &&
          !scope.read
        )
          ctx.addIssue({
            code: "custom",
            path: ["scopes", index, "read"],
            message: t("WRITE_REQUIRES_READ"),
          });
      });
    });
