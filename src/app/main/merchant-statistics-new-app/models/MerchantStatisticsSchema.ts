import { z } from "zod";
import { TFunction } from "i18next";
import type { User } from "src/app/auth/user";
import { requiredNumberValidation } from "src/app/main/utils/validations";
import {
  merchantStatisticsFields,
  validateStatisticsDates,
} from "../../merchant-statistics-app/models/MerchantStatisticsSchema";
export const merchantStatisticsSchema = (t: TFunction) =>
  z
    .object({
      ...merchantStatisticsFields(t),
      bankTransferTotals: requiredNumberValidation({
        error: t("REQUIRED_FIELD"),
      }),
      otherFees: requiredNumberValidation({ error: t("REQUIRED_FIELD") }),
    })
    .passthrough()
    .superRefine((values, ctx) => validateStatisticsDates(values, ctx, t));
export type MerchantStatisticsForm = z.infer<
  ReturnType<typeof merchantStatisticsSchema>
> & { user?: User };
