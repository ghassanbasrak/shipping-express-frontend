import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";
export default function WarehouseMap({ address }: { address?: string }) {
  const { t } = useTranslation("storageApp");
  if (!address?.trim()) return null;
  let href: string;
  try {
    const url = new URL(address);
    href = ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    href =
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(address);
  }
  if (!href) return null;
  return (
    <Button
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant="outlined"
      color="primary"
    >
      {t("OPEN_MAP")}
    </Button>
  );
}
