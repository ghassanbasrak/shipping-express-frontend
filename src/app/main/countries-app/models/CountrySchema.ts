import { z } from "zod";
import {
  localeStringValidation,
  optionalStringValidation,
  requiredStringValidation,
  requiredBooleanValidation,
  arrayValidation,
} from "src/app/main/utils/validations";

export function shipmentCountrySchema(t: (key: string) => string) {
  return z
    .object({
      id: optionalStringValidation(),
      _id: optionalStringValidation(),
      countryId: optionalStringValidation(),
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

export function countrySchema(t: (key: string) => string) {
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
    code: requiredStringValidation({ error: t("REQUIRED_FIELD") })
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, t("UPPERCASE")),
    dialCode: requiredStringValidation({ error: t("REQUIRED_FIELD") })
      .trim()
      .min(1, t("REQUIRED_FIELD")),
    subzoneName: localeStringValidation({ requiredLanguages: [] }),
    shipmentCountries: arrayValidation({
      itemSchema: shipmentCountrySchema(t),
    }),
  });
}
