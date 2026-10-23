import { z } from "zod";
import {
  arrayValidation,
  requiredBooleanValidation,
  requiredEnumValidation,
  requiredStringValidation,
} from "src/app/main/utils/validations";
import { adminRoles } from "../Utils";

export const adminSchema = z
  .object({
    role: requiredEnumValidation({ enumValues: Object.values(adminRoles) }),
    features: arrayValidation({
      minLength: 1,
      itemSchema: z
        .object({
          feature: requiredStringValidation(),
          accessView: requiredBooleanValidation(),
          accessCreate: requiredBooleanValidation(),
          accessUpdate: requiredBooleanValidation(),
          accessDelete: requiredBooleanValidation(),
        })
        .passthrough(),
    }),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    value.features.forEach((feature, index) => {
      if (
        (feature.accessCreate ||
          feature.accessUpdate ||
          feature.accessDelete) &&
        !feature.accessView
      )
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["features", index, "accessView"],
          message: "VIEW_REQUIRED",
        });
      if (
        value.features.findIndex((row) => row.feature === feature.feature) !==
        index
      )
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["features", index, "feature"],
          message: "DUPLICATE_FEATURE",
        });
    });
  });
