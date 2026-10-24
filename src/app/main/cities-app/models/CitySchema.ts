import { z } from "zod";
import {
  localeStringValidation,
  optionalStringValidation,
  requiredStringValidation,
  requiredBooleanValidation,
  arrayValidation,
} from "src/app/main/utils/validations";

export function shipmentCitySchema(t: (key: string) => string) {
  return z
    .object({
      id: optionalStringValidation(),
      _id: optionalStringValidation(),
      cityId: optionalStringValidation(),
      shippingCompanyId: requiredStringValidation({
        error: t("REQUIRED_FIELD"),
      }),
      name: optionalStringValidation(),
      isActive: requiredBooleanValidation(),
    })
    .passthrough()
    .superRefine((row, ctx) => {
      if (row.isActive && !row.name?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: t("REQUIRED_FIELD"),
        });
      }
    });
}

export function citySchema(t: (key: string) => string) {
  return z.object({
    id: optionalStringValidation(),
    name: (
      localeStringValidation({
        requiredLanguages: ["en"],
        error: t("REQUIRED_FIELD"),
      }) as z.AnyZodObject
    )
      .extend({
        en: z.preprocess(
          (value) => (typeof value === "string" ? value.trim() : value),
          requiredStringValidation({
            minLength: 2,
            minLengthError: t("TWO_CHARACTERS_AT_LEAST"),
          }),
        ),
      })
      .catchall(optionalStringValidation()),
    countryId: z.preprocess(
      (value) => value ?? "",
      requiredStringValidation({ error: t("REQUIRED_FIELD") }),
    ),
    stateId: z.preprocess(
      (value) => value ?? "",
      requiredStringValidation({ error: t("REQUIRED_FIELD") }),
    ),
    postalCode: optionalStringValidation(),
    shipmentCities: arrayValidation({
      itemSchema: shipmentCitySchema(t),
    }),
  });
}
