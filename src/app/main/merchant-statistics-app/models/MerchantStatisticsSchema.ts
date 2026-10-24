import { z } from "zod";
import { TFunction } from "i18next";
import type { User } from "src/app/auth/user";
import {
  requiredStringValidation,
  optionalDateValidation,
} from "src/app/main/utils/validations";
export const merchantStatisticsFields = (t: TFunction) => ({
  userId: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
  dateFrom: optionalDateValidation(),
  dateTo: optionalDateValidation(),
});
export function validateStatisticsDates(
  values: { dateFrom?: Date; dateTo?: Date },
  ctx: z.RefinementCtx,
  t: TFunction,
) {
  if (values.dateFrom && values.dateTo && values.dateTo < values.dateFrom)
    ctx.addIssue({
      code: "custom",
      path: ["dateTo"],
      message: t("INVALID_END_DATE"),
    });
}
export const merchantStatisticsSchema = (t: TFunction) =>
  z
    .object(merchantStatisticsFields(t))
    .passthrough()
    .superRefine((values, ctx) => validateStatisticsDates(values, ctx, t));
export type MerchantStatisticsForm = z.infer<
  ReturnType<typeof merchantStatisticsSchema>
> & { user?: User };
