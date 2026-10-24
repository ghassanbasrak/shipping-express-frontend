import { z } from "zod";
import { TFunction } from "i18next";
import {
  requiredStringValidation,
  optionalStringValidation,
} from "src/app/main/utils/validations";
export const bankTransferApprovalSchema = (t: TFunction) =>
  z.object({ bank: requiredStringValidation({ error: t("REQUIRED_FIELD") }) });
export const bankTransferRejectionSchema = () =>
  z.object({ notes: optionalStringValidation() });
