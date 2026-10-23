import { z } from "zod";
import { TFunction } from "i18next";
import {
  requiredStringValidation,
  requiredNumberValidation,
  optionalStringValidation,
  optionalBooleanValidation,
} from "src/app/main/utils/validations";
import { transactionTypes, relatedBalanceTypes } from "../Utils";
export const transactionSchema = (t: TFunction) =>
  z
    .object({
      userId: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
      type: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
      relatedBalance: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
      amount: requiredNumberValidation({
        error: t("REQUIRED_FIELD"),
        positive: true,
        nonZero: true,
        positiveError: t("SHOULD_BE_MORE_THAN_0"),
        nonZeroError: t("SHOULD_BE_MORE_THAN_0"),
      }),
      operationType: optionalStringValidation(),
      notes: optionalStringValidation(),
      applyTax: optionalBooleanValidation(),
    })
    .passthrough()
    .superRefine((value, ctx) => {
      if (!Object.values(transactionTypes).includes(value.type as "deposit"))
        ctx.addIssue({
          code: "custom",
          path: ["type"],
          message: t("REQUIRED_FIELD"),
        });
      if (
        !Object.values(relatedBalanceTypes).includes(
          value.relatedBalance as "wallet",
        )
      )
        ctx.addIssue({
          code: "custom",
          path: ["relatedBalance"],
          message: t("REQUIRED_FIELD"),
        });
    });
