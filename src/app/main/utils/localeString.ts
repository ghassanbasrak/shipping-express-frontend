import i18next from "i18next";
import { LocaleString } from "./commonTypes";
import pluralize from "pluralize";

export function localeCapitalPluralString(
  object: LocaleString,
  {
    options: { capitalizeOnlyFirstWord = false } = {
      capitalizeOnlyFirstWord: false,
    },
    defaultTranslation,
  }: {
    options: {
      capitalizeOnlyFirstWord?: boolean;
    };
    defaultTranslation: string;
  }
): string | "" {
  const currentLocale = i18next.language as string;
  var value: string;
  var locale: string;
  if (object && object[currentLocale]) {
    value = object[currentLocale];
    locale = currentLocale;
  } else {
    const defaultLocale = "ar";
    value = object?.[defaultLocale] ?? "";
    locale = defaultLocale;
  }
  if (!value) {
    return defaultTranslation;
  }
  const words = pluralize.plural(value).split(" ");
  const formattedValue = words
    .map((word, index) =>
      locale === "ar"
        ? index === words.length - 1
          ? `ال${word}`
          : word
        : index === 0 || !capitalizeOnlyFirstWord
          ? word.charAt(0).toUpperCase() + word.slice(1)
          : word
    )
    .join(" ");
  return formattedValue;
}

export function localeCapitalSingularString(
  object: LocaleString,
  {
    options: { capitalizeOnlyFirstWord = false, withArabicThe = true } = {
      capitalizeOnlyFirstWord: false,
      withArabicThe: true,
    },
    defaultTranslation,
  }: {
    options: {
      capitalizeOnlyFirstWord?: boolean;
      withArabicThe?: boolean;
    };
    defaultTranslation: string;
  }
): string | "" {
  const currentLocale = i18next.language as string;
  var value: string;
  var locale: string;
  if (object && object[currentLocale]) {
    value = object[currentLocale];
    locale = currentLocale;
  } else {
    const defaultLocale = "ar";
    value = object?.[defaultLocale] ?? "";
    locale = defaultLocale;
  }
  if (!value) {
    return defaultTranslation;
  }
  const words = pluralize.singular(value).split(" ");
  const formattedValue = words
    .map((word, index) =>
      locale === "ar"
        ? index === words.length - 1
          ? `${withArabicThe ? "ال" : ""}${word}`
          : word
        : index === 0 || !capitalizeOnlyFirstWord
          ? word.charAt(0).toUpperCase() + word.slice(1)
          : word
    )
    .join(" ");
  return formattedValue;
}

export function localeSmallSingularString(
  object: LocaleString,
  {
    options: { withArabicThe = false } = { withArabicThe: false },
    defaultTranslation,
  }: {
    options: {
      withArabicThe?: boolean;
    };
    defaultTranslation: string;
  }
): string | "" {
  const currentLocale = i18next.language as string;
  var value: string;
  var locale: string;
  if (object && object[currentLocale]) {
    value = object[currentLocale];
    locale = currentLocale;
  } else {
    const defaultLocale = "ar";
    value = object?.[defaultLocale] ?? "";
    locale = defaultLocale;
  }
  if (!value) {
    return defaultTranslation;
  }
  const words = pluralize.singular(value).split(" ");
  const formattedValue = words
    .map((word, index) =>
      locale === "ar"
        ? index === words.length - 1
          ? `${withArabicThe ? "ال" : ""}${word}`
          : word
        : word.charAt(0).toLowerCase() + word.slice(1)
    )
    .join(" ");
  return formattedValue;
}

// Define a generic type for the object argument
type TranslatableObject<T> = { [key: string]: T };

function localeString<T>(object: TranslatableObject<T>): T | "" {
  // Check for translation in current language first
  const currentLocale = i18next.language as string; // Cast language to string
  if (object && object[currentLocale]) {
    return object[currentLocale];
  }

  // Fallback to English (or any default language)
  const defaultLocale = "ar"; // Adjust as needed
  return object?.[defaultLocale] ?? "";
}

export default localeString;
