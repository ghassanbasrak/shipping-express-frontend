import { z } from "zod";
import { TFunction } from "i18next";
import {
  requiredNumberValidation,
  requiredStringValidation,
  optionalStringValidation,
} from "src/app/main/utils/validations";
import IWithdrawRequest from "./IWithdrawRequest";
import Currency from "../../utils/currencyFormatter";
export type WithdrawRequestForm = IWithdrawRequest & {
  availableBalance: number;
  shipmentIds: string[];
};
export const withdrawRequestSchema = (t: TFunction) =>
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
      shipmentIds: z
        .array(requiredStringValidation({ error: t("REQUIRED_FIELD") }))
        .min(1, t("SHOULD_SELECT_AT_LEAST_ONE_SHIPMENT")),
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
export const withdrawRequestApprovalSchema = (
  t: TFunction,
  walletCharge = false,
) =>
  z.object({
    bank: walletCharge
      ? optionalStringValidation()
      : requiredStringValidation({ error: t("REQUIRED_FIELD") }),
    transactionReference: walletCharge
      ? optionalStringValidation()
      : requiredStringValidation({ error: t("REQUIRED_FIELD") }),
    transactionDescription: optionalStringValidation(),
    transactionImageUrl: optionalStringValidation(),
  });
