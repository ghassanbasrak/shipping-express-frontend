import type ICoupon from "./models/ICoupon";
export const couponTypes = {
  fixed: "fixed",
  percentage: "percentage",
};

export const toCouponTypeTitle = (status: string) => {
  switch (status) {
    case couponTypes.fixed:
      return "FIXED";
    case couponTypes.percentage:
      return "PERCENTAGE";
  }
  return "FIXED";
};
export const toCouponTypeColor = (status: string) => {
  switch (status) {
    case couponTypes.fixed:
      return "bg-blue-500";
    case couponTypes.percentage:
      return "bg-amber-500";
  }
  return "bg-blue-500";
};

export const couponsPath = (shippingCompanyId = "all", userId = "all") =>
  `/coupons/${shippingCompanyId || "all"}/${userId || "all"}`;
export const generateCouponCode = () => crypto.randomUUID();
export function toCouponSaveValues(value: ICoupon): ICoupon {
  const result = { ...value };
  if (!result.shippingCompanyId || result.shippingCompanyId === "all")
    delete result.shippingCompanyId;
  return result;
}
