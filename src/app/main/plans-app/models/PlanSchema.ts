import { z } from "zod";
import { TFunction } from "i18next";
import {
  arrayValidation,
  optionalBooleanValidation,
  optionalNumberValidation,
  optionalStringValidation,
  requiredEnumValidation,
  requiredNumberValidation,
  requiredStringValidation,
} from "src/app/main/utils/validations";
import IPlan, { IPlanPrice } from "./IPlan";
import { planStatus } from "../Utils";

export type PlanFormValues = Omit<IPlan, "prices"> & {
  prices: (IPlanPrice & { active: boolean })[];
};
export const planSchema = (t: TFunction) =>
  z
    .object({
      name: requiredStringValidation({
        minLength: 2,
        minLengthError: t("TWO_CHARACTERS_AT_LEAST"),
      }),
      description: optionalStringValidation(),
      price: requiredNumberValidation({ positive: true, nonZero: true }),
      features: arrayValidation({
        itemSchema: requiredStringValidation(),
        minLength: 1,
      }),
      status: requiredEnumValidation({ enumValues: Object.values(planStatus) }),
      prices: arrayValidation({
        itemSchema: z
          .object({
            shippingCompanyId: requiredStringValidation(),
            active: optionalBooleanValidation(),
            localPrice: optionalNumberValidation({
              positive: true,
              nonZero: true,
            }),
            codPrice: optionalNumberValidation({
              positive: true,
              nonZero: true,
            }),
            internationalDiscountRate: optionalNumberValidation({
              positive: true,
              nonZero: true,
            }),
            returnFees: optionalNumberValidation({ positive: true }),
          })
          .passthrough(),
      }),
    })
    .passthrough();
