import { z } from "zod";
import { TFunction } from "i18next";
import {
  requiredEnumValidation,
  optionalStringValidation,
} from "src/app/main/utils/validations";
import { alertTypes, alertViewTypes } from "../Utils";
export const alertSchema = (t: TFunction) =>
  z
    .object({
      type: requiredEnumValidation({ enumValues: Object.values(alertTypes) }),
      viewType: requiredEnumValidation({
        enumValues: Object.values(alertViewTypes),
      }),
      title: optionalStringValidation(),
      content: optionalStringValidation(),
      imageUrl: optionalStringValidation(),
    })
    .passthrough()
    .superRefine((value, ctx) => {
      const required =
        value.type === alertTypes.normal ? ["title", "content"] : ["imageUrl"];
      required.forEach((name) => {
        if (!value[name])
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [name],
            message: t("REQUIRED_FIELD"),
          });
      });
      if (
        value.type === alertTypes.onlyImage &&
        value.viewType !== alertViewTypes.popup
      )
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["viewType"],
          message: t("IMAGE_REQUIRES_POPUP"),
        });
    });
