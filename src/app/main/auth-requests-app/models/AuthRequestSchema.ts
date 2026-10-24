import { z } from "zod";
import { TFunction } from "i18next";
import { requiredStringValidation } from "src/app/main/utils/validations";
export const authRequestSchema = (t: TFunction) =>
  z
    .object({
      description: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
      fileUrl: requiredStringValidation({ error: t("REQUIRED_FIELD") }),
    })
    .passthrough();
