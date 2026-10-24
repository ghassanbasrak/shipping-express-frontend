import { z } from "zod";
import { TFunction } from "i18next";
import {
  requiredStringValidation,
  optionalStringValidation,
  requiredEnumValidation,
} from "src/app/main/utils/validations";
import IShipmentUser, { IShipmentUserAddress } from "./IShipmentUser";
import { shipmentUserTypes } from "../Utils";

export type ShipmentUserFormValues = Omit<IShipmentUser, "address"> & {
  phoneCountry: string;
  phoneCountry1: string;
  address: IShipmentUserAddress & { nationalAddress?: string };
};
export const shipmentUserSchema = (t: TFunction) =>
  z
    .object({
      fullName: requiredStringValidation({
        error: t("FULL_NAME_REQUIRED"),
        minLength: 2,
        minLengthError: t("TWO_CHARACTERS_AT_LEAST"),
      }),
      // Keep the source's national-number rule; email and the second phone remain optional.
      phone: requiredStringValidation({
        error: t("PHONE_NUMBER_REQUIRED"),
      }).regex(/^[0-9]{6,10}$/, t("INVALID_PHONE")),
      phoneCountry: requiredStringValidation().regex(
        /^\+[1-9][0-9]{0,3}$/,
        t("INVALID_PHONE"),
      ),
      phone1: optionalStringValidation(),
      phoneCountry1: optionalStringValidation(),
      email: optionalStringValidation(),
      type: requiredEnumValidation({
        enumValues: Object.values(shipmentUserTypes),
      }),
      address: z
        .object({
          countryId: requiredStringValidation({ error: t("COUNTRY_REQUIRED") }),
          stateId: requiredStringValidation({ error: t("STATE_REQUIRED") }),
          cityId: optionalStringValidation(),
          street: optionalStringValidation(),
          zipCode: optionalStringValidation(),
          nationalAddress: optionalStringValidation(),
        })
        .passthrough(),
    })
    .passthrough();
