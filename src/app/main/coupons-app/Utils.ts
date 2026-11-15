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
      return "bg-status-info-bg text-status-info-fg";
    case couponTypes.percentage:
      return "bg-status-warning-bg text-status-warning-fg";
  }
  return "bg-status-info-bg text-status-info-fg";
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
