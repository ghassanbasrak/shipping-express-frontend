import { z } from "zod";
import {
  requiredNumberValidation,
  requiredStringValidation,
} from "../../utils/validations";
export default function customerPricesSchema(t: (key: string) => string) {
  return z
    .object({
      prices: z.array(
        z.object({
          shippingCompanyId: requiredStringValidation(),
          name: z.string(),
          localEnabled: z.boolean(),
          codEnabled: z.boolean(),
          mainLocalPrice: requiredNumberValidation(),
          mainCodPrice: requiredNumberValidation(),
          localProfits: requiredNumberValidation(),
          codProfits: requiredNumberValidation(),
          internationalDiscountRate: z.number().optional(),
        }),
      ),
    })
    .superRefine((value, ctx) => {
      const ids = new Set<string>();
      value.prices.forEach((row, index) => {
        if (ids.has(row.shippingCompanyId))
          ctx.addIssue({
            code: "custom",
            path: ["prices", index, "shippingCompanyId"],
            message: t("INVALID_PRICES"),
          });
        ids.add(row.shippingCompanyId);
        for (const key of ["local", "cod"] as const)
          if (
            row[`${key}Enabled`] &&
            (row[`${key}Profits`] < 0 ||
              row[key === "local" ? "mainLocalPrice" : "mainCodPrice"] +
                row[`${key}Profits`] <
                0)
          )
            ctx.addIssue({
              code: "custom",
              path: ["prices", index, `${key}Profits`],
              message: t("PRICE_BELOW_BASE"),
            });
      });
    });
}
