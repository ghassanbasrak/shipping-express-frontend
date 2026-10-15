import { z } from "zod";
import {
  arrayValidation,
  requiredStringValidation,
  optionalStringValidation,
  optionalNumberValidation,
  requiredBooleanValidation,
  optionalBooleanValidation,
  requiredEnumValidation,
} from "src/app/main/utils/validations";
import { shippingMethods } from "../Utils";

export function shippingCompanySchema(t: (key: string) => string) {
  return z
    .object({
      id: optionalStringValidation(),
      name: z.preprocess(
        (value) => (typeof value === "string" ? value.trim() : value),
        requiredStringValidation({
          minLength: 2,
          minLengthError: t("TWO_CHARACTERS_AT_LEAST"),
        }),
      ),
      serviceName: z.preprocess(
        (value) => (typeof value === "string" ? value.trim() : value),
        requiredStringValidation({ error: t("REQUIRED_FIELD") }),
      ),
      hasState: requiredBooleanValidation(),
      isEnglish: requiredBooleanValidation(),
      isActive: optionalBooleanValidation(),
      shippingMethods: arrayValidation({
        itemSchema: requiredEnumValidation({
          enumValues: Object.values(shippingMethods),
        }),
        minLength: 1,
        minLengthError: t("AT_LEAST_SHIPPING_METHOD"),
      }),
      localPrice: optionalNumberValidation(),
      maxWeight: optionalNumberValidation(),
      extraWeightPrice: optionalNumberValidation(),
      codPrice: optionalNumberValidation(),
      internationalProfitsRate: optionalNumberValidation(),
      internationalProfitsExtras: optionalNumberValidation(),
      returnFees: optionalNumberValidation(),
      shipmentFees: optionalNumberValidation(),
      shipmentCodFees: optionalNumberValidation(),
      shipmentExtraWeightFees: optionalNumberValidation(),
      shipmentReturnFees: optionalNumberValidation(),
      fuelPercentage: optionalNumberValidation(),
      color: optionalStringValidation(),
      logoUrl: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
      iconUrl: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
    })
    .superRefine((value, ctx) => {
      const methods = value.shippingMethods as string[];
      const local = methods.includes(shippingMethods.local);
      const cod = methods.includes(shippingMethods.cashOnDelivery);
      if (cod && !local)
        ctx.addIssue({
          code: "custom",
          path: ["shippingMethods"],
          message: t("COD_REQUIRES_LOCAL"),
        });
      const requiredFields = [
        ...(local ? ["localPrice", "maxWeight", "extraWeightPrice"] : []),
        ...(cod ? ["codPrice"] : []),
      ];
      requiredFields.forEach((field) => {
        if (value[field] == null)
          ctx.addIssue({
            code: "custom",
            path: [field],
            message: t("REQUIRED_FIELD"),
          });
      });
    });
}
