import { z } from "zod";
import { TFunction } from "i18next";
import {
  requiredStringValidation,
  requiredEnumValidation,
  requiredNumberValidation,
  optionalStringValidation,
} from "src/app/main/utils/validations";
import { couponTypes } from "../Utils";
export const couponSchema = (t: TFunction) =>
  z
    .object({
      shippingCompanyId: optionalStringValidation(),
      code: requiredStringValidation({
        minLength: 2,
        minLengthError: t("TWO_CHARACTERS_AT_LEAST"),
      }),
      type: requiredEnumValidation({ enumValues: Object.values(couponTypes) }),
      value: requiredNumberValidation(),
      maxUsageCount: requiredNumberValidation(),
      expiresAt: optionalStringValidation(),
    })
    .passthrough()
    .superRefine((value, ctx) => {
      if (
        value.expiresAt &&
        (!Number.isFinite(Date.parse(value.expiresAt)) ||
          Date.parse(value.expiresAt) < Date.now())
      )
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expiresAt"],
          message: t("INVALID_END_DATE"),
        });
    });
