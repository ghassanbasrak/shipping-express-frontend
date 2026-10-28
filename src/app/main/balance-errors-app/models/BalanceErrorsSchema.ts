import { z } from "zod";
import { requiredStringValidation } from "src/app/main/utils/validations";
import { isBalanceErrorDate } from "../Utils";
export type BalanceErrorsFilters = { dateFrom: string; dateTo: string };
export const balanceErrorsSchema = (t: (key: string) => string) =>
  z
    .object({
      dateFrom: requiredStringValidation({ error: t("REQUIRED_FIELD") }).refine(
        isBalanceErrorDate,
        t("INVALID_DATE"),
      ),
      dateTo: requiredStringValidation({ error: t("REQUIRED_FIELD") }).refine(
        isBalanceErrorDate,
        t("INVALID_DATE"),
      ),
    })
    .superRefine((range, ctx) => {
      if (
        isBalanceErrorDate(range.dateFrom) &&
        isBalanceErrorDate(range.dateTo) &&
        range.dateFrom > range.dateTo
      )
        ctx.addIssue({
          code: "custom",
          path: ["dateTo"],
          message: t("INVALID_DATE_RANGE"),
        });
    });
