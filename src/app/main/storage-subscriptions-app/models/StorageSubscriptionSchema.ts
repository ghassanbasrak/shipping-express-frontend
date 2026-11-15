import { z } from "zod";
import { requiredStringValidation } from "../../utils/validations";
import { storageSubscriptionOperation } from "../Utils";
export const storageSubscriptionSchema = () =>
  z.object({
    userId: requiredStringValidation(),
    planId: requiredStringValidation(),
    operation: z.nativeEnum(storageSubscriptionOperation),
  });
