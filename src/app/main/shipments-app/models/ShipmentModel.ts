import type {
  ShipmentFormValues,
  ShipmentReceiverValues,
} from "./ShipmentSchema";
import { defaultCountry, defaultCountryId, defaultCountryCode } from "../Utils";
export const newShipmentReceiver = (): ShipmentReceiverValues => ({
  key: crypto.randomUUID(),
  receiverId: "new",
  receiverName: "",
  receiverEmail: "",
  receiverPhone: "",
  receiverPhoneCountry: "+966",
  receiverCountryId: defaultCountryId,
  receiverCountryName: defaultCountry.name.en,
  receiverCountryCode: defaultCountryCode,
  receiverStateId: "",
  receiverCityId: "",
  receiverStateName: "",
  receiverCityName: "",
  receiverStreet: "",
  receiverZipCode: "",
  receiverNationalAddress: "",
});
export default function ShipmentModel(
  data: Partial<ShipmentFormValues> = {},
): ShipmentFormValues {
  const editable = structuredClone(data);
  for (const field of [
    "senderPhone1",
    "senderPhoneCountry1",
    "receiverPhone1",
    "receiverPhoneCountry1",
    "isCommercial",
    "acceptExtraWeightTerms",
    "products",
  ])
    delete editable[field];
  editable.receivers?.forEach((receiver) => {
    delete receiver["receiverPhone1"];
    delete receiver["receiverPhoneCountry1"];
  });
  return {
    ...structuredClone({
      shippingCompanyId: "",
      shippingCompany: null,
      method: "local",
      senderId: "new",
      senderName: "",
      senderEmail: "",
      senderPhone: "",
      senderPhoneCountry: "+966",
      senderCountryId: defaultCountryId,
      senderCountryName: defaultCountry.name.en,
      senderCountryCode: defaultCountryCode,
      senderStateId: "",
      senderCityId: "",
      senderStateName: "",
      senderCityName: "",
      senderStreet: "",
      senderZipCode: "",
      senderNationalAddress: "",
      ...newShipmentReceiver(),
      type: "box",
      length: 1,
      width: 1,
      height: 1,
      weight: 1,
      packagesCount: 1,
      description: "",
      imageUrl: "",
      isCod: false,
      codPrice: 0,
      couponCode: "",
      couponCodeId: "",
      coupon: null,
      fulfillmentSource: "external",
      warehouseId: "",
      warehouseItems: [],
      ...editable,
    }),
    receivers: editable.receivers
      ? structuredClone(editable.receivers)
      : [newShipmentReceiver()],
  };
}
