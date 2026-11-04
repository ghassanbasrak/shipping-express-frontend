export const overviewNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (
    typeof value === "string" &&
    /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())
  ) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};
export const overviewCount = (value: unknown, language = "en") => {
  const n = overviewNumber(value);
  return n !== null && Number.isInteger(n) && n >= 0
    ? new Intl.NumberFormat(language).format(n)
    : "—";
};
export const overviewPercent = (value: unknown, language = "en") => {
  const n = overviewNumber(value);
  return n === null
    ? "—"
    : `${n > 0 ? "+" : ""}${new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(n)}%`;
};
export const overviewMoney = (
  value: unknown,
  language = "en",
  currency?: string,
) => {
  const n = overviewNumber(value);
  if (n === null) return "—";
  const code = currency?.trim().toUpperCase();
  if (code && /^[A-Z]{3}$/.test(code))
    try {
      return new Intl.NumberFormat(language, {
        style: "currency",
        currency: code,
        currencyDisplay: "code",
        maximumFractionDigits: 2,
      }).format(n);
    } catch {}
  return new Intl.NumberFormat(language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};
export const overviewDate = (value?: string, language = "en") =>
  value && Number.isFinite(new Date(value).getTime())
    ? new Intl.DateTimeFormat(language, {
        day: "numeric",
        month: "short",
      }).format(new Date(value))
    : "—";
export const overviewBarWidth = (value: unknown, values: unknown[]) => {
  const n = overviewNumber(value);
  const max = Math.max(
    1,
    ...values
      .map(overviewNumber)
      .filter((x): x is number => x !== null && x >= 0),
  );
  return n === null || n < 0 ? 0 : Math.min(100, (n / max) * 100);
};
