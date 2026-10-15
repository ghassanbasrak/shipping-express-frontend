import i18n from "src/i18n";
import { ZodRawShape, ZodSchema, z } from "zod";
import validator from "validator";

export const optionalUrlValidation = (params?: { error?: string }) => {
  const { error } = params ?? {};
  return z
    .string()
    .url(error ?? i18n.t("INVALID_URL", { ns: "public" }))
    .optional()
    .nullable();
};

export const requiredUrlValidation = (params?: {
  error?: string;
  invalidError?: string;
}) => {
  const { error, invalidError } = params ?? {};
  return z
    .string({
      required_error: error ?? i18n.t("REQUIRED_FIELD", { ns: "public" }),
    })
    .url(invalidError ?? i18n.t("INVALID_URL", { ns: "public" }));
};

export const optionalDateTimeValidation = (params?: { error?: string }) => {
  const { error } = params ?? {};
  return z
    .string()
    .datetime(error ?? i18n.t("INVALID_DATETIME", { ns: "public" }))
    .optional()
    .nullable();
};

export const requiredDateTimeValidation = (params?: {
  error?: string;
  invalidError?: string;
}) => {
  const { error, invalidError } = params ?? {};
  return z
    .string({
      required_error: error ?? i18n.t("REQUIRED_FIELD", { ns: "public" }),
    })
    .datetime(invalidError ?? i18n.t("INVALID_DATETIME", { ns: "public" }));
};

export const requiredEmailValidation = (params?: {
  error?: string;
  invalidError?: string;
}) => {
  const { error, invalidError } = params ?? {};
  return z
    .string({
      required_error: error ?? i18n.t("REQUIRED_FIELD", { ns: "public" }),
    })
    .email(invalidError ?? i18n.t("INVALID_EMAIL", { ns: "public" }));
};

export const optionalEmailValidation = (params?: { error?: string }) => {
  const { error } = params ?? {};
  return z
    .string()
    .email(error ?? i18n.t("INVALID_EMAIL", { ns: "public" }))
    .optional()
    .nullable();
};

export const optionalBooleanValidation = () => {
  return z.boolean().optional().nullable();
};

export const requiredBooleanValidation = (params?: { error?: string }) => {
  const { error } = params ?? {};
  return z.boolean({
    required_error: error ?? i18n.t("REQUIRED_FIELD", { ns: "public" }),
  });
};

export const optionalNumberValidation = (params?: {
  positive?: boolean;
  positiveError?: string;
  negative?: boolean;
  negativeError?: string;
  nonZero?: boolean;
  nonZeroError?: string;
}) => {
  const {
    positive = false,
    positiveError,
    negative = false,
    negativeError,
    nonZero = false,
    nonZeroError,
  } = params ?? {};
  var schema = z.number({});
  if (positive) {
    schema = nonZero
      ? schema.gt(
          0,
          positiveError ??
            i18n.t("SHOULD_BE_POSITIVE_NUMBER", { ns: "public" }),
        )
      : schema.gte(
          0,
          positiveError ??
            i18n.t("SHOULD_BE_POSITIVE_NUMBER", { ns: "public" }),
        );
  }
  if (nonZero) {
    schema = schema[negative ? "lt" : "gt"](
      0,
      nonZeroError ??
        i18n.t(
          negative ? "SHOULD_BE_LESS_THAN_ZERO" : "SHOULD_BE_MORE_THAN_ZERO",
          { ns: "public" },
        ),
    );
  }
  if (negative) {
    schema = nonZero
      ? schema.lt(
          0,
          negativeError ??
            i18n.t("SHOULD_BE_NEGATIVE_NUMBER", { ns: "public" }),
        )
      : schema.lte(
          0,
          negativeError ??
            i18n.t("SHOULD_BE_NEGATIVE_NUMBER", { ns: "public" }),
        );
  }
  return schema.optional().nullable();
};

export const requiredNumberValidation = (params?: {
  error?: string;
  positive?: boolean;
  positiveError?: string;
  negative?: boolean;
  negativeError?: string;
  nonZero?: boolean;
  nonZeroError?: string;
}) => {
  const {
    error,
    positive = false,
    positiveError,
    negative = false,
    negativeError,
    nonZero = false,
    nonZeroError,
  } = params ?? {};
  var schema = z.number({
    required_error: error ?? i18n.t("REQUIRED_FIELD", { ns: "public" }),
  });
  if (positive) {
    schema = nonZero
      ? schema.gt(
          0,
          positiveError ??
            i18n.t("SHOULD_BE_POSITIVE_NUMBER", { ns: "public" }),
        )
      : schema.gte(
          0,
          positiveError ??
            i18n.t("SHOULD_BE_POSITIVE_NUMBER", { ns: "public" }),
        );
  }
  if (nonZero) {
    schema = schema[negative ? "lt" : "gt"](
      0,
      nonZeroError ??
        i18n.t(
          negative ? "SHOULD_BE_LESS_THAN_ZERO" : "SHOULD_BE_MORE_THAN_ZERO",
          { ns: "public" },
        ),
    );
  }
  if (negative) {
    schema = nonZero
      ? schema.lt(
          0,
          negativeError ??
            i18n.t("SHOULD_BE_NEGATIVE_NUMBER", { ns: "public" }),
        )
      : schema.lte(
          0,
          negativeError ??
            i18n.t("SHOULD_BE_NEGATIVE_NUMBER", { ns: "public" }),
        );
  }
  return schema;
};

export const optionalDateValidation = () => {
  return z.date().optional().nullable();
};

export const optionalStringValidation = () => {
  return z.string().optional().nullable();
};

export const requiredStringValidation = (params?: {
  error?: string;
  minLength?: number;
  minLengthError?: string;
  maxLength?: number;
  maxLengthError?: string;
  nullable?: boolean;
}) => {
  const { error, minLength, minLengthError, maxLength, maxLengthError } =
    params ?? {};
  var schema = z.string({
    required_error: error ?? i18n.t("REQUIRED_FIELD", { ns: "public" }),
  });
  if (minLength) {
    schema = schema.min(
      minLength,
      minLengthError ??
        i18n.t("STRING_MIN_LENGTH_ERROR", { ns: "public", minLength }),
    );
  } else {
    schema = schema.min(1, error ?? i18n.t("REQUIRED_FIELD", { ns: "public" }));
  }
  if (maxLength) {
    schema = schema.max(
      maxLength,
      maxLengthError ??
        i18n.t("STRING_MAX_LENGTH_ERROR", { ns: "public", maxLength }),
    );
  }
  return schema;
};

export const objectValidation = (params?: {
  objectSchema?: ZodRawShape;
  error?: string;
  optional?: boolean;
}) => {
  const { objectSchema, error, optional = false } = params ?? {};
  var schema = z.object(objectSchema, {
    required_error: error ?? i18n.t("REQUIRED_FIELD", { ns: "public" }),
  });
  if (optional) {
    return schema.optional().nullable();
  }
  return schema;
};
export const arrayValidation = (params?: {
  itemSchema?: ZodSchema;
  error?: string;
  minLength?: number;
  minLengthError?: string;
  maxLength?: number;
  maxLengthError?: string;
  optional?: boolean;
}) => {
  const {
    itemSchema,
    error,
    minLength,
    minLengthError,
    maxLength,
    maxLengthError,
    optional = false,
  } = params ?? {};
  var schema = z.array(itemSchema ?? z.string(), {
    required_error: error ?? i18n.t("REQUIRED_FIELD", { ns: "public" }),
  });
  if (minLength) {
    schema = schema.min(
      minLength,
      minLengthError ??
        i18n.t("ARRAY_MIN_LENGTH_ERROR", { ns: "public", minLength }),
    );
  }
  if (maxLength) {
    schema = schema.max(
      maxLength,
      maxLengthError ??
        i18n.t("ARRAY_MAX_LENGTH_ERROR", { ns: "public", maxLength }),
    );
  }
  if (optional) {
    return schema.optional().nullable();
  }
  return schema;
};

export const requiredEnumValidation = (params: {
  enumValues: string[];
  error?: string;
}) => {
  const { enumValues, error } = params ?? {};
  return z.enum(enumValues as [string, ...string[]], {
    required_error: error ?? i18n.t("REQUIRED_FIELD", { ns: "public" }),
  });
};

export const localeStringValidation = (params?: {
  languages?: string[];
  requiredLanguages?: string[];
  error?: string;
}) => {
  const {
    error,
    languages = ["en", "ar"],
    requiredLanguages = ["ar"],
  } = params ?? {};
  const obj = {};
  languages.forEach(
    (s) =>
      (obj[s] =
        requiredLanguages.findIndex((r) => r === s) > -1
          ? requiredStringValidation({ error })
          : z.string().optional().nullable()),
  );
  if (requiredLanguages.length === 0) {
    return z.object(obj).optional().nullable();
  }
  return z.object(obj);
};
export const localeArrayStringValidation = (params?: {
  languages?: string[];
  requiredLanguages?: string[];
  error?: string;
}) => {
  const {
    error,
    languages = ["en", "ar"],
    requiredLanguages = ["ar"],
  } = params ?? {};
  const obj = {};
  languages.forEach(
    (s) =>
      (obj[s] = arrayValidation({
        itemSchema: requiredStringValidation({ error }),
        optional: requiredLanguages.findIndex((r) => r === s) === -1,
      })),
  );
  if (requiredLanguages.length === 0) {
    return z.object(obj).optional().nullable();
  }
  return z.object(obj);
};

export const requiredPhoneValidation = (params?: {
  noStartWithZero?: boolean;
  error?: string;
  noStartWithZeroError?: string;
  invalidError?: string;
}) => {
  const { noStartWithZero, noStartWithZeroError, error, invalidError } =
    params ?? {};
  var schema = z
    .string({
      required_error: error ?? i18n.t("REQUIRED_FIELD", { ns: "public" }),
    })
    .refine((value) => validatePhone(value), {
      message: invalidError ?? i18n.t("INVALID_PHONE_NUMBER", { ns: "public" }),
    });
  if (noStartWithZero) {
    return schema.refine(
      (value) => {
        return !value.startsWith("+9680");
      },
      {
        message:
          noStartWithZeroError ??
          i18n.t("PHONE_NUMBER_SHOULD_NOT_START_WITH_ZERO", { ns: "public" }),
      },
    );
  }
  return schema;
};

export const optionalPhoneValidation = (params?: { invalidError?: string }) => {
  const { invalidError } = params ?? {};
  var schema = z
    .string()
    .refine((value) => validatePhone(value), {
      message: invalidError ?? i18n.t("INVALID_PHONE_NUMBER", { ns: "public" }),
    })
    .optional()
    .nullable();

  return schema;
};

export function validateUrl(string: string) {
  let url: URL;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

export function validateEmail(string: string) {
  if (string && string.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g)) {
    return true;
  }
  return false;
}

export function validatePhone(string: string) {
  return Boolean(
    Boolean(string) &&
      (string.startsWith("+968")
        ? string.match(/^\+968(?:2[2-6]|7[126-9]|9\d)\d{6}$/)
        : validator.isMobilePhone(string, "any")),
  );
}
