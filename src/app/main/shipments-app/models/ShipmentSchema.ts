import { z } from "zod";
import { TFunction } from "i18next";
import IShipment, { IShipmentDetails } from "./IShipment";
import {
  requiredStringValidation,
  requiredNumberValidation,
  optionalStringValidation,
  optionalBooleanValidation,
} from "src/app/main/utils/validations";
import { shipmentVolumetricWeight } from "../Utils";
type ShipmentContactDetails = Omit<
  IShipmentDetails,
  | "senderCountry"
  | "senderState"
  | "senderCity"
  | "receiverCountry"
  | "receiverState"
  | "receiverCity"
>;
export type ShipmentReceiverValues = Partial<ShipmentContactDetails> & {
  key: string;
  receiverId?: string;
  receiverPhoneCountry?: string;
  receiverPhoneCountry1?: string;
  receiverNationalAddress?: string;
};
// Only editable/domain fields enter RHF; recursive shipment populations remain read-only.
export type ShipmentFormValues = Partial<
  Pick<
    IShipment,
    | keyof ShipmentContactDetails
    | "shippingCompanyId"
    | "shippingCompany"
    | "method"
    | "type"
    | "isCod"
    | "codPrice"
    | "imageUrl"
    | "products"
    | "couponCodeId"
    | "coupon"
    | "orderReturned"
    | "returnedFromShipmentId"
    | "userId"
  >
> & {
  senderId?: string;
  receiverId?: string;
  senderNamePrefix?: string;
  senderPhoneCountry?: string;
  senderPhoneCountry1?: string;
  receiverPhoneCountry?: string;
  receiverPhoneCountry1?: string;
  senderNationalAddress?: string;
  receiverNationalAddress?: string;
  couponCode?: string;
  acceptExtraWeightTerms?: boolean;
  receivers: ShipmentReceiverValues[];
};
export const shipmentSchema = (
  t: TFunction,
  mode: "create" | "return" | "calculator" = "create",
) =>
  z
    .object({
      shippingCompanyId: requiredStringValidation({
        error: t("SHIPPING_COMPANY_REQUIRED"),
      }),
      method: requiredStringValidation({ error: t("SHIPPING_TYPE_REQUIRED") }),
      length: requiredNumberValidation({ positive: true, nonZero: true }),
      width: requiredNumberValidation({ positive: true, nonZero: true }),
      height: requiredNumberValidation({ positive: true, nonZero: true }),
      weight: requiredNumberValidation({ positive: true, nonZero: true }),
      packagesCount: requiredNumberValidation({
        positive: true,
        nonZero: true,
      }),
      description: optionalStringValidation(),
      isCod: optionalBooleanValidation(),
      isCommercial: optionalBooleanValidation(),
    })
    .passthrough()
    .superRefine((value, ctx) => {
      const form = value as ShipmentFormValues;
      const issue = (path: (string | number)[], key: string) =>
        ctx.addIssue({ code: "custom", path, message: t(key) });
      if (!["local", "international"].includes(form.method))
        issue(["method"], "SHIPPING_TYPE_REQUIRED");
      if (
        !form.shippingCompany ||
        !form.shippingCompany.isActive ||
        !form.shippingCompany.shippingMethods?.includes(form.method)
      )
        issue(["shippingCompanyId"], "SHIPPING_COMPANY_REQUIRED");
      if (form.packagesCount > (mode === "create" ? 6 : 2))
        issue(
          ["packagesCount"],
          mode === "create" ? "MAXIMUM_6_PACKAGES" : "MAXIMUM_2_PACKAGES",
        );
      if (!Number.isInteger(form.weight))
        issue(["weight"], "INTEGER_VALUES_ONLY");
      if (form.weight < shipmentVolumetricWeight(form))
        ctx.addIssue({
          code: "custom",
          path: ["weight"],
          message: `${t("MUST_BE_MORE_THAN_OR_EQUAL")} ${shipmentVolumetricWeight(form)} ${t("KG")}`,
        });
      const validateContact = (
        contact: Partial<ShipmentFormValues>,
        prefix: "sender" | "receiver",
        path: (string | number)[],
      ) => {
        const get = (suffix: string) => contact[`${prefix}${suffix}`];
        const required = (suffix: string, key: string) => {
          if (!get(suffix)) issue([...path, `${prefix}${suffix}`], key);
        };
        if (mode !== "calculator") {
          required(
            "Id",
            prefix === "sender" ? "SENDER_REQUIRED" : "RECEIVER_REQUIRED",
          );
          required(
            "Name",
            prefix === "sender"
              ? "SENDER_FULL_NAME_REQUIRED"
              : "RECEIVER_FULL_NAME_REQUIRED",
          );
          if (get("Name")?.length < 2)
            issue([...path, `${prefix}Name`], "TWO_CHARACTERS_AT_LEAST");
          if (
            form.shippingCompany?.isEnglish &&
            !/[A-Za-z0-9]+/.test(get("Name") || "")
          )
            issue([...path, `${prefix}Name`], "cAN_ONLY_ENGLISH_LETTERS");
          if (
            !/^[0-9]{6,10}$/.test(
              (get("Phone") || "").replace(/[٠-٩]/g, (d) =>
                String("٠١٢٣٤٥٦٧٨٩".indexOf(d)),
              ),
            )
          )
            issue([...path, `${prefix}Phone`], "INVALID_PHONE");
          required(
            "NationalAddress",
            prefix === "sender"
              ? "SENDER_NATIONAL_ADDRESS_REQUIRED"
              : "RECEIVER_NATIONAL_ADDRESS_REQUIRED",
          );
        }
        required(
          "CountryId",
          prefix === "sender"
            ? "SENDER_COUNTRY_REQUIRED"
            : "RECEIVER_COUNTRY_REQUIRED",
        );
        required(
          "CityId",
          prefix === "sender"
            ? "SENDER_CITY_REQUIRED"
            : "RECEIVER_CITY_REQUIRED",
        );
        if (form.shippingCompany?.hasState)
          required(
            "StateId",
            prefix === "sender"
              ? "SENDER_STATE_REQUIRED"
              : "RECEIVER_STATE_REQUIRED",
          );
        required(
          "Street",
          prefix === "sender"
            ? "SENDER_STREET_REQUIRED"
            : "RECEIVER_STREET_REQUIRED",
        );
        if ((get("Street") || "").length > 45)
          issue([...path, `${prefix}Street`], "MAXIMUM_45_CHARACTERS");
        if (form.method === "international")
          required(
            "ZipCode",
            prefix === "sender"
              ? "SENDER_ZIP_CODE_REQUIRED"
              : "RECEIVER_ZIP_CODE_REQUIRED",
          );
        if (form.shippingCompany && get("CityId") && !get("CityName"))
          issue([...path, `${prefix}CityId`], "CITY_NOT_AVAILABLE_FOR_CARRIER");
        if (
          form.shippingCompany?.hasState &&
          get("StateId") &&
          !get("StateName")
        )
          issue(
            [...path, `${prefix}StateId`],
            "CITY_NOT_AVAILABLE_FOR_CARRIER",
          );
      };
      validateContact(form, "sender", []);
      if (mode === "create") {
        if (!form.receivers?.length)
          issue(["receivers"], "YOU_SHOULD_ADD_ONE_RECEIVER_AT_LEAST");
        (form.receivers || []).forEach((receiver, index) =>
          validateContact(receiver, "receiver", ["receivers", index]),
        );
      } else validateContact(form, "receiver", []);
      if (
        form.isCod &&
        (mode === "return" ||
          form.method !== "local" ||
          !form.shippingCompany?.shippingMethods?.includes("cashOnDelivery"))
      )
        issue(["isCod"], "SHIPPING_COMPANY_DOESNT_SUPPORT_COD");
      if (form.isCod && !(form.codPrice > 0))
        issue(["codPrice"], "MUST_BE_MORE_THAN_0");
      if (mode !== "calculator") {
        if (!form.description) issue(["description"], "DESCRIPTION_REQURIED");
        if (!form.acceptExtraWeightTerms)
          issue(
            ["acceptExtraWeightTerms"],
            "EXTRA_WEIGHT_TERMS_REQUIRED_FIELD",
          );
        if (
          (form.method === "international" || form.type === "document") &&
          !form.imageUrl
        )
          issue(["imageUrl"], "SHIPMENT_IMAGE_REQUIRED");
        if (form.isCommercial && form.type !== "document") {
          if (!form.products?.length)
            issue(["products"], "YOU_SHOULD_ADD_ONE_PRODUCT");
          (form.products || []).forEach((item, index) => {
            if (!item.title)
              issue(["products", index, "title"], "REQUIRED_FIELD");
            for (const field of ["price", "quantity"])
              if (typeof item[field] !== "number" || Number.isNaN(item[field]))
                issue(["products", index, field], "REQUIRED_FIELD");
          });
        }
      }
    });
