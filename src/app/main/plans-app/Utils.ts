import type IPlan from "./models/IPlan";
import type { IPlanPrice } from "./models/IPlan";
import type { PlanFormValues } from "./models/PlanSchema";

export const planStatus = { disabled: "disabled", active: "active" } as const;
export const toPlanStatusTitle = (status: string) =>
  status === planStatus.active ? "ACTIVE" : "DISABLED";
export const toPlanStatusColor = (status: string) =>
  status === planStatus.active ? "green" : "red";

export function toPlanFormValues(plan: IPlan): PlanFormValues {
  return {
    ...plan,
    prices: (plan.prices || []).map((price) => ({ ...price, active: true })),
  };
}

export function toPlanSaveValues(values: PlanFormValues): IPlan {
  const prices = values.prices
    .filter((row) => row.active)
    .map((row) => {
      const price: IPlanPrice = { shippingCompanyId: row.shippingCompanyId };
      for (const field of [
        "localPrice",
        "codPrice",
        "internationalDiscountRate",
        "returnFees",
      ] as const) {
        const value = row[field];
        if (
          value != null &&
          Number.isFinite(value) &&
          (field === "returnFees" ? value >= 0 : value > 0)
        )
          price[field] = value;
      }
      return price;
    })
    .filter((row) =>
      [
        "localPrice",
        "codPrice",
        "internationalDiscountRate",
        "returnFees",
      ].some((field) => row[field] != null),
    );
  const plan = { ...values, prices };
  if (!plan.description) delete plan.description;
  return plan;
}
