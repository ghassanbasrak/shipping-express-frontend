import { z } from "zod";
import { TFunction } from "i18next";
import {
  requiredStringValidation,
  optionalStringValidation,
  optionalNumberValidation,
} from "src/app/main/utils/validations";
import IMerchant from "./IMerchant";
import MerchantModel from "./MerchantModel";
import { normalizedTaxNumber } from "../Utils";
export type MerchantForm = IMerchant & {
  phoneCountry: string;
  phone: string;
  address: NonNullable<IMerchant["address"]>;
};
export function merchantFormValues(value: Partial<IMerchant>): MerchantForm {
  const result = MerchantModel(value);
  const [dial, ...parts] = (result.phone || "").split("-");
  return {
    ...result,
    address: result.address || {},
    phoneCountry: parts.length ? dial : "+966",
    phone: parts.length ? parts.join("-") : dial,
    prices: (result.prices || []).map((price) => ({
      ...price,
      localPrice: price.localPrice > 0 ? price.localPrice : undefined,
      codPrice: price.codPrice > 0 ? price.codPrice : undefined,
      internationalDiscountRate:
        price.internationalDiscountRate > 0
          ? price.internationalDiscountRate
          : undefined,
    })),
  };
}
export function merchantPayload(value: MerchantForm, staff: boolean) {
  const address = value.address || {},
    prices = (value.prices || [])
      .filter((price) =>
        [
          price.localPrice,
          price.codPrice,
          price.internationalDiscountRate,
        ].some((amount) => amount > 0),
      )
      .map((price) => ({
        shippingCompanyId: price.shippingCompanyId,
        ...(price.localPrice > 0 ? { localPrice: price.localPrice } : {}),
        ...(price.codPrice > 0 ? { codPrice: price.codPrice } : {}),
        ...(price.internationalDiscountRate > 0
          ? { internationalDiscountRate: price.internationalDiscountRate }
          : {}),
      }));
  return {
    firstName: value.firstName,
    lastName: value.lastName,
    companyName: value.companyName,
    email: value.email,
    phone: value.phone ? `${value.phoneCountry}-${value.phone}` : "",
    phone1: value.phone1,
    address: {
      countryId: address.countryId,
      stateId: address.stateId,
      cityId: address.cityId,
      street: address.street,
      zipCode: address.zipCode,
    },
    ...(value.taxNumber
      ? { taxNumber: normalizedTaxNumber(value.taxNumber) }
      : {}),
    ...(staff ? { loyaltyType: value.loyaltyType, prices } : {}),
  };
}
export const merchantSchema = (t: TFunction) =>
  z
    .object({
      firstName: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
      lastName: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
      companyName: optionalStringValidation(),
      email: requiredStringValidation({ error: t("EMAIL_REQUIRED") }).email(
        t("INVALID_EMAIL"),
      ),
      phone: optionalStringValidation().refine(
        (value) => !!value && /^[0-9 +()\-]{6,}$/.test(value),
        t("INVALID_PHONE_NUMBER"),
      ),
      phoneCountry: optionalStringValidation(),
      phone1: optionalStringValidation(),
      taxNumber: optionalStringValidation().refine(
        (value) => !value || normalizedTaxNumber(value).length === 15,
        t("SHOULD_BE_15_CHARS"),
      ),
      loyaltyType: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
      address: z
        .object({
          countryId: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
          stateId: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
          cityId: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
          street: optionalStringValidation(),
          zipCode: optionalStringValidation(),
        })
        .passthrough(),
      prices: z
        .array(
          z
            .object({
              shippingCompanyId: optionalStringValidation(),
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
            })
            .passthrough(),
        )
        .optional(),
    })
    .passthrough()
    .superRefine((value, context) => {
      if (value.taxNumber && !value.address.street)
        context.addIssue({
          code: "custom",
          path: ["address", "street"],
          message: t("REQUIRED_FIELD"),
        });
    });
