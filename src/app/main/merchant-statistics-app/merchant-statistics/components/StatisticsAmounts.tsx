import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Currency from "src/app/main/utils/currencyFormatter";
export default function StatisticsAmounts({
  namespace,
  title,
  total,
  rows,
}: {
  namespace: string;
  title: string;
  total?: number;
  rows: { key: string; title: string; amount?: number; count?: number }[];
}) {
  const { t } = useTranslation(namespace);
  return (
    <section className="min-w-0" data-testid={`statistics-${title}`}>
      <Box
        className="flex flex-wrap justify-between gap-8 rounded-lg p-16 mb-8"
        sx={{ bgcolor: "secondary.main", color: "secondary.contrastText" }}
      >
        <Typography className="font-semibold">{t(title)}</Typography>
        {total !== undefined && <Typography>{Currency(total)}</Typography>}
      </Box>
      {rows.map((row) => (
        <div
          key={row.key}
          data-testid={`statistic-${row.key}`}
          className="flex justify-between gap-16 py-8 border-b break-words"
        >
          <Typography className="min-w-0">
            {t(row.title)}
            {row.count !== undefined ? ` (${row.count})` : ""}
          </Typography>
          <Typography className="font-semibold shrink-0" dir="ltr">
            {Currency(row.amount ?? 0)}
          </Typography>
        </div>
      ))}
    </section>
  );
}
