import _ from "@lodash";
import { PartialDeep } from "type-fest";
import IShippingCompany from "./IShippingCompany";

const ShippingCompanyModel = (data: PartialDeep<IShippingCompany> = {}) =>
  _.defaultsDeep({}, data, {
    name: "",
    serviceName: "",
    hasState: true,
    isEnglish: false,
    isActive: true,
    internationalProfitsRate: 0,
    internationalProfitsExtras: 0,
    localPrice: 0,
    codPrice: 0,
    maxWeight: 0,
    extraWeightPrice: 0,
    returnFees: 0,
    color: "#000000",
    logoUrl: "",
    iconUrl: "",
    shippingMethods: [],
    shipmentFees: 0,
    shipmentCodFees: 0,
    shipmentExtraWeightFees: 0,
    shipmentReturnFees: 0,
  });

export const shippingCompanyDefaultValues = ShippingCompanyModel({});
export const shippingCompanyEditableFields = [
  "name",
  "serviceName",
  "hasState",
  "isEnglish",
  "isActive",
  "internationalProfitsRate",
  "internationalProfitsExtras",
  "localPrice",
  "codPrice",
  "maxWeight",
  "extraWeightPrice",
  "returnFees",
  "color",
  "logoUrl",
  "iconUrl",
  "shippingMethods",
  "shipmentFees",
  "shipmentCodFees",
  "shipmentExtraWeightFees",
  "shipmentReturnFees",
  "fuelPercentage",
];

export default ShippingCompanyModel;
