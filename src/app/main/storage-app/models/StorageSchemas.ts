import { z } from "zod";
import { storageType, supplyProductMode } from "../Utils";
const storageTypesSchema = z.array(z.nativeEnum(storageType)).min(1);
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
    storageTypes: storageTypesSchema,
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
      storageTypes: storageTypesSchema,
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
            mode: z.nativeEnum(supplyProductMode),
            warehouseProductId: optionalStringValidation(),
            sku: optionalStringValidation(),
            name: name(t),
            quantity: requiredNumberValidation({
              positive: true,
              nonZero: true,
            })
              .int()
              .max(Number.MAX_SAFE_INTEGER),
            unitPrice: z.number().finite().nonnegative().nullable(),
            notes: optionalStringValidation(),
            storageType: z.union([z.nativeEnum(storageType), z.literal("")]),
          }),
        )
        .min(1, t("ADD_PRODUCT")),
    })
    .superRefine((value, ctx) => {
      const seen = new Set<string>();
      value.products.forEach((item, i) => {
        if (
          item.mode === supplyProductMode.existing &&
          !item.warehouseProductId
        )
          ctx.addIssue({
            code: "custom",
            path: ["products", i, "warehouseProductId"],
            message: t("CHOOSE_PRODUCT"),
          });
        if (item.mode === supplyProductMode.new && item.unitPrice == null)
          ctx.addIssue({
            code: "custom",
            path: ["products", i, "unitPrice"],
            message: t("REQUIRED"),
          });
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

export const storageProductSchema = (t: (key: string) => string) =>
  z.object({
    userId: name(t),
    warehouseId: name(t),
    name: name(t),
    sku: optionalStringValidation(),
    quantity: requiredNumberValidation({ positive: true })
      .int()
      .max(Number.MAX_SAFE_INTEGER),
    unitPrice: requiredNumberValidation({ positive: true }).finite(),
    storageType: z.nativeEnum(storageType),
  });
