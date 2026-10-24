import { z } from "zod";
import { TFunction } from "i18next";
import {
  arrayValidation,
  requiredNumberValidation,
  requiredStringValidation,
  optionalStringValidation,
} from "src/app/main/utils/validations";
import Currency from "../../utils/currencyFormatter";
import IPackageRequest from "./IPackageRequest";
export type PackageRequestFormValues = IPackageRequest & {
  phoneCountry: string;
};
export const packageRequestSchema = (t: TFunction, balance: number) =>
  z
    .object({
      type: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
      amount: requiredNumberValidation({
        error: t("REQUIRED_FIELD"),
        positive: true,
        nonZero: true,
        positiveError: t("SHOULD_BE_MORE_THAN_0"),
        nonZeroError: t("SHOULD_BE_MORE_THAN_0"),
      }),
      description: optionalStringValidation(),
      productIds: arrayValidation({
        itemSchema: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
        minLength: 1,
        minLengthError: t("SHOULD_SELECT_ONE_PRODUCT_AT_LEAST"),
      }),
      fullName: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
      phone: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
      phoneCountry: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
      shippingAddress: z
        .object({
          countryId: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
          stateId: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
          cityId: optionalStringValidation(),
          street: optionalStringValidation(),
          zipCode: optionalStringValidation(),
        })
        .passthrough(),
    })
    .passthrough()
    .superRefine((values, context) => {
      if (values.amount > balance)
        context.addIssue({
          code: "custom",
          path: ["amount"],
          message: t("SHOULD_BE_LESS_THAN_YOUR_BALANCE", {
            balance: Currency(balance),
          }),
        });
    });
