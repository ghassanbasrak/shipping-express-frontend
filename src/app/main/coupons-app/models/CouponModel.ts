import _ from "@lodash";
import { PartialDeep } from "type-fest";
import ICoupon from "./ICoupon";
import { couponTypes } from "../Utils";
const CouponModel = (data: PartialDeep<ICoupon> = {}) =>
  _.defaultsDeep({}, data, {
    shippingCompanyId: "all",
    code: "",
    type: couponTypes.fixed,
    value: 0,
    expiresAt: null,
  });
export const couponDefaultValues = CouponModel({});
export const couponEditableFields = [
  "shippingCompanyId",
  "code",
  "type",
  "value",
  "expiresAt",
  "maxUsageCount",
  "isActive",
];
export default CouponModel;
