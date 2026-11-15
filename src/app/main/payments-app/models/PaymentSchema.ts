import { z } from "zod";
import { TFunction } from "i18next";
import { requiredNumberValidation } from "src/app/main/utils/validations";
import { paymentMinimumExceptions, paymentFundingMethod } from "../Utils";
export type PaymentForm = {
  amount: number;
  method: (typeof paymentFundingMethod)[keyof typeof paymentFundingMethod];
  transactionReference: string;
  transactionImageUrl: string;
  description: string;
};
export const paymentSchema = (t: TFunction, userId: string) =>
  z
    .object({
      amount: requiredNumberValidation({ error: t("REQUIRED_FIELD") })
        .finite()
        .positive(t("POSITIVE_AMOUNT"))
        .refine(
          (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7,
          t("TWO_DECIMALS"),
        )
        .superRefine((amount, context) => {
          if (!paymentMinimumExceptions.includes(userId) && amount < 100)
            context.addIssue({
              code: "custom",
              message: t("SHOULD_BE_MORE_THAN_100"),
            });
        }),
      method: z.enum([
        paymentFundingMethod.online,
        paymentFundingMethod.bankTransfer,
      ]),
      transactionReference: z.string().trim(),
      transactionImageUrl: z.union([z.literal(""), z.string().url()]),
      description: z.string().trim(),
    })
    .superRefine((values, context) => {
      if (
        values.method === paymentFundingMethod.bankTransfer &&
        !values.transactionReference &&
        !values.transactionImageUrl
      )
        context.addIssue({
          code: "custom",
          path: ["transactionReference"],
          message: t("TRANSFER_PROOF_REQUIRED"),
        });
    });
