import { z } from "zod";
import { TFunction } from "i18next";
import { requiredNumberValidation } from "src/app/main/utils/validations";
import { topupMinimumExceptions } from "../Utils";
export type TopupRequestForm = { amount: number };
export const topupRequestSchema = (t: TFunction, userId: string) =>
  z.object({
    amount: requiredNumberValidation({ error: t("REQUIRED_FIELD") })
      .finite()
      .superRefine((amount, context) => {
        if (!topupMinimumExceptions.includes(userId) && amount < 100)
          context.addIssue({
            code: "custom",
            message: t("SHOULD_BE_MORE_THAN_100"),
          });
      }),
  });
