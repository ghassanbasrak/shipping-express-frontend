import { z } from "zod";
import {
  requiredStringValidation,
  optionalStringValidation,
  requiredNumberValidation,
  optionalBooleanValidation,
} from "../../utils/validations";
const name = (t: (key: string) => string) =>
  requiredStringValidation({ error: t("REQUIRED") })
    .trim()
    .min(1, t("REQUIRED"));
const money = () =>
  requiredNumberValidation({ positive: true }).finite().multipleOf(0.01);
export const warehouseSchema = (t: (key: string) => string) =>
  z.object({
    name: name(t),
    address: name(t),
    mapAddress: optionalStringValidation(),
    information: optionalStringValidation(),
    pickup: z.object({
      phone: name(t).regex(/^\+\d{1,4}-\d{6,10}$/, t("INVALID_PICKUP_PHONE")),
      email: z.union([z.literal(""), z.string().email()]).optional(),
      countryId: name(t),
      stateId: name(t),
      cityId: name(t),
      street: name(t).max(45),
      nationalAddress: name(t),
      zipCode: optionalStringValidation(),
    }),
  });
export const storagePlanSchema = (t: (key: string) => string) =>
  z
    .object({
      name: name(t),
      price: money(),
      discountPrice: z
        .number()
        .finite()
        .nonnegative()
        .multipleOf(0.01)
        .nullable()
        .optional(),
      durationDays: requiredNumberValidation({
        positive: true,
        nonZero: true,
      }).int(),
      featuresText: name(t),
      isActive: optionalBooleanValidation(),
    })
    .superRefine((value, ctx) => {
      if (value.discountPrice != null && value.discountPrice > value.price)
        ctx.addIssue({
          code: "custom",
          path: ["discountPrice"],
          message: t("DISCOUNT_LIMIT"),
        });
    });
export const supplyRequestSchema = (
  t: (key: string) => string,
  allowedTypes: string[],
) =>
  z
    .object({
      warehouseId: name(t),
      products: z
        .array(
          z.object({
            sku: optionalStringValidation(),
            name: name(t),
            quantity: requiredNumberValidation({
              positive: true,
              nonZero: true,
            })
              .int()
              .max(Number.MAX_SAFE_INTEGER),
            unitPrice: requiredNumberValidation({ positive: true }).finite(),
            notes: optionalStringValidation(),
            storageType: name(t),
          }),
        )
        .min(1, t("ADD_PRODUCT")),
    })
    .superRefine((value, ctx) => {
      const seen = new Set<string>();
      value.products.forEach((item, i) => {
        const identity = JSON.stringify([
          item.sku?.trim() || item.name.trim(),
          item.storageType,
        ]);
        if (seen.has(identity))
          ctx.addIssue({
            code: "custom",
            path: ["products", i, "name"],
            message: t("DUPLICATE_SKU"),
          });
        seen.add(identity);
        if (!allowedTypes.includes(item.storageType))
          ctx.addIssue({
            code: "custom",
            path: ["products", i, "storageType"],
            message: t("TYPE_NOT_ALLOWED"),
          });
      });
    });
