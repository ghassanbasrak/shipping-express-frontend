import localeString from "./localeString";
import Cookies from "js-cookie";

interface CurrencyInfo {
  valueFactor: number;
  decimalPlaces: number;
  symbol: { [locale: string]: string }; // Indexed by locale string
}

export function getCurrentCurrency(): string {
  return Cookies.get("currency") ?? "USD";
}

function Currency(originalPrice: number, short = false): string {
  const currencySymbol = short ? "" : getCurrentCurrency();

  const currentCurrency: CurrencyInfo = {
    valueFactor: 1,
    decimalPlaces: short ? 0 : 2,
    symbol: {
      ar: currencySymbol,
      en: currencySymbol,
      fa: currencySymbol,
      ru: currencySymbol,
    },
  };
  const defaultOptions = {
    symbol: localeString(currentCurrency.symbol),

    significantDigits: currentCurrency.decimalPlaces,
    thousandsSeparator: ",",
    decimalSeparator: ".",
  };
  const price = originalPrice * currentCurrency.valueFactor;
  const currencyFormatter = (value, options) => {
    if (typeof value !== "number") value = 0.0;
    options = { ...defaultOptions, ...options };
    // value = value.toFixed(options.significantDigits)
    value = value.toFixed(options.significantDigits);
    const [currency, decimal] = value.split(".");
    return `${currency.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      options.thousandsSeparator
    )}${decimal ? options.decimalSeparator : ""}${decimal ?? ""} ${
      options.symbol
    }`;

    // return `${options.symbol} ${currency.replace(
    //   /\B(?=(\d{3})+(?!\d))/g,
    //   options.thousandsSeparator
    // )}`;
  };

  // if (price === 0) {
  //   return "";
  // }
  return currencyFormatter(price, defaultOptions);
}

export default Currency;
