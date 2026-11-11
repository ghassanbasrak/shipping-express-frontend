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
import type IStorageProduct from "../../storage-app/models/IStorageProduct";
import type IWarehouse from "../../storage-app/models/IWarehouse";
import type IStorageSubscription from "../../storage-app/models/IStorageSubscription";
export type ShipmentWarehouse = Pick<
  IWarehouse,
  "id" | "name" | "address" | "mapAddress" | "pickup"
>;
export type ShipmentWarehouseItem = {
  productId: string;
  quantity: number;
  product?: Pick<
    IStorageProduct,
    | "id"
    | "userId"
    | "warehouseId"
    | "sku"
    | "name"
    | "unitPrice"
    | "storageType"
    | "quantity"
  >;
};
type ShipmentContactDetails = Omit<
  IShipmentDetails,
  | "isCommercial"
  | "senderPhone1"
  | "receiverPhone1"
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
    | "couponCodeId"
    | "coupon"
    | "orderReturned"
    | "returnedFromShipmentId"
    | "userId"
  >
> & {
  senderId?: string;
  receiverId?: string;
  senderPhoneCountry?: string;
  receiverPhoneCountry?: string;
  senderNationalAddress?: string;
  receiverNationalAddress?: string;
  couponCode?: string;
  receivers: ShipmentReceiverValues[];
  fulfillmentSource?: "external" | "warehouse";
  warehouseId?: string;
  warehouse?: ShipmentWarehouse;
  warehouseItems?: ShipmentWarehouseItem[];
  storageSubscription?: Pick<
    IStorageSubscription,
    "id" | "userId" | "startsAt" | "endsAt" | "status"
  >;
};
export const shipmentSchema = (
  t: TFunction,
  mode: "create" | "return" | "calculator" = "create",
  stage: "details" | "review" = "review",
) =>
  z
    .object({
      shippingCompanyId: optionalStringValidation(),
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
    })
    .passthrough()
    .superRefine((value, ctx) => {
      const form = value as ShipmentFormValues;
      const issue = (path: (string | number)[], key: string) =>
        ctx.addIssue({ code: "custom", path, message: t(key) });
      if (
        form.fulfillmentSource &&
        !["external", "warehouse"].includes(form.fulfillmentSource)
      )
        issue(["fulfillmentSource"], "STORAGE_SELECTION_REQUIRED");
      if (form.fulfillmentSource === "warehouse") {
        const subscription = form.storageSubscription;
        if (
          mode !== "create" ||
          !subscription ||
          subscription.status !== "active" ||
          !Number.isFinite(Date.parse(subscription.endsAt)) ||
          Date.parse(subscription.endsAt) <= Date.now()
        )
          issue(["warehouseId"], "STORAGE_SUBSCRIPTION_REQUIRED");
        if (!form.warehouseId || form.warehouse?.id !== form.warehouseId)
          issue(["warehouseId"], "STORAGE_SELECTION_REQUIRED");
        if (!form.warehouse?.pickup?.phone || !form.warehouse.pickup.cityId)
          issue(["warehouseId"], "STORAGE_PICKUP_REQUIRED");
        if (!form.warehouseItems?.length)
          issue(["warehouseItems"], "STORAGE_SELECTION_REQUIRED");
        const ids = new Set<string>();
        (form.warehouseItems || []).forEach((item, index) => {
          if (
            !item.productId ||
            ids.has(item.productId) ||
            !item.product ||
            item.product.id !== item.productId ||
            item.product.warehouseId !== form.warehouseId ||
            item.product.userId !== subscription?.userId
          )
            issue(
              ["warehouseItems", index, "productId"],
              "STORAGE_SELECTION_REQUIRED",
            );
          ids.add(item.productId);
          if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0)
            issue(
              ["warehouseItems", index, "quantity"],
              "STORAGE_QUANTITY_INVALID",
            );
        });
      }
      if (!["local", "international"].includes(form.method))
        issue(["method"], "SHIPPING_TYPE_REQUIRED");
      if (
        stage === "review" &&
        (!form.shippingCompanyId ||
          !form.shippingCompany ||
          form.shippingCompany.id !== form.shippingCompanyId ||
          form.shippingCompany.isActive === false ||
          (form.shippingCompany.shippingMethods &&
            !form.shippingCompany.shippingMethods.includes(form.method)))
      )
        issue(["shippingCompanyId"], "SHIPPING_COMPANY_REQUIRED");
      if (form.packagesCount > (mode === "create" ? 6 : 2))
        issue(
          ["packagesCount"],
          mode === "create" ? "MAXIMUM_6_PACKAGES" : "MAXIMUM_2_PACKAGES",
        );
      if (!Number.isInteger(form.weight))
        issue(["weight"], "INTEGER_VALUES_ONLY");
      const volumetricWeight = shipmentVolumetricWeight(
        stage === "details" ? { ...form, shippingCompany: null } : form,
      );
      if (form.weight < volumetricWeight)
        ctx.addIssue({
          code: "custom",
          path: ["weight"],
          message: `${t("MUST_BE_MORE_THAN_OR_EQUAL")} ${volumetricWeight} ${t("KG")}`,
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
          if (!(prefix === "sender" && form.fulfillmentSource === "warehouse"))
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
            stage === "review" &&
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
        if (stage === "review" && form.shippingCompany?.hasState)
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
        if (
          stage === "review" &&
          form.shippingCompany &&
          get("CityId") &&
          !get("CityName")
        )
          issue([...path, `${prefix}CityId`], "CITY_NOT_AVAILABLE_FOR_CARRIER");
        if (
          stage === "review" &&
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
          (stage === "review" &&
            form.shippingCompany?.shippingMethods &&
            !form.shippingCompany.shippingMethods.includes("cashOnDelivery")))
      )
        issue(["isCod"], "SHIPPING_COMPANY_DOESNT_SUPPORT_COD");
      if (form.isCod && !(form.codPrice > 0))
        issue(["codPrice"], "MUST_BE_MORE_THAN_0");
      if (
        stage === "review" &&
        form.coupon?.shippingCompanyId &&
        form.coupon.shippingCompanyId !== form.shippingCompanyId
      )
        issue(["couponCode"], "COUPON_NOT_AVILABLE_SHIPPING_COMPANY");
      if (mode !== "calculator") {
        if (!form.description) issue(["description"], "DESCRIPTION_REQURIED");
        if (
          (form.method === "international" || form.type === "document") &&
          !form.imageUrl
        )
          issue(["imageUrl"], "SHIPMENT_IMAGE_REQUIRED");
      }
    });
