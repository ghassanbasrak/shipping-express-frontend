import { z } from "zod";
import { TFunction } from "i18next";
import {
  requiredNumberValidation,
  requiredStringValidation,
  optionalStringValidation,
} from "src/app/main/utils/validations";
import IAffiliateWithdrawRequest from "./IAffiliateWithdrawRequest";
import Currency from "../../utils/currencyFormatter";
export type AffiliateWithdrawRequestForm = IAffiliateWithdrawRequest & {
  availableBalance: number;
};
export const affiliateWithdrawRequestSchema = (t: TFunction) =>
  z
    .object({
      amount: requiredNumberValidation({
        error: t("REQUIRED_FIELD"),
        positive: true,
        nonZero: true,
        positiveError: t("REQUIRED_FIELD"),
        nonZeroError: t("REQUIRED_FIELD"),
      }),
      availableBalance: requiredNumberValidation({
        error: t("REQUIRED_FIELD"),
        positive: true,
        nonZero: true,
        positiveError: t("REQUIRED_FIELD"),
        nonZeroError: t("REQUIRED_FIELD"),
      }),
      description: optionalStringValidation(),
    })
    .passthrough()
    .superRefine((value, context) => {
      if (value.amount > value.availableBalance)
        context.addIssue({
          code: "custom",
          path: ["amount"],
          message: `${t("SHOULD_BE_LESS_THAN_OR_EQUAL")} ${Currency(value.availableBalance)}`,
        });
    });
export const affiliateWithdrawRequestApprovalSchema = (t: TFunction) =>
  z.object({
    bank: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
    transactionReference: requiredStringValidation({
      error: t("REQUIRED_FIELD"),
    }),
    transactionDescription: optionalStringValidation(),
    transactionImageUrl: optionalStringValidation(),
  });
