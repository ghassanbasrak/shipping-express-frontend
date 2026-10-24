import { alpha, Box, ButtonBase, Chip, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import IPackagingSupply from "../../models/IPackagingSupply";
import Currency from "../../../utils/currencyFormatter";
import localeString from "../../../utils/localeString";

function PackagingSupplyCard({
  product,
  selected = false,
  disabled = false,
  onSelect,
}: {
  product: IPackagingSupply;
  selected?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation("packageRequestsApp");
  const name =
    typeof product.name === "string"
      ? product.name
      : localeString(product.name);
  const description =
    typeof product.description === "string"
      ? product.description
      : localeString(product.description);

  return (
    <Paper
      className="w-full shadow-0 rounded-lg overflow-hidden"
      sx={{
        border: "2px solid",
        borderColor: selected ? "secondary.main" : "divider",
        bgcolor: (theme) =>
          selected
            ? alpha(theme.palette.secondary.main, 0.1)
            : theme.palette.background.default,
      }}
    >
      <ButtonBase
        className="w-full p-24 flex flex-col items-stretch gap-16"
        disabled={disabled}
        data-testid={`supply-${product.id}`}
        role="checkbox"
        aria-checked={selected}
        aria-label={name}
        onClick={onSelect}
      >
        <div className="flex items-start gap-16 text-start">
          {product.imageUrl && (
            <img
              className="w-128 object-contain"
              src={product.imageUrl}
              alt={name}
            />
          )}
          <div className="flex-1 min-w-0">
            <Typography className="text-18 font-semibold">{name}</Typography>
            {description && (
              <Typography className="text-14 mt-4" color="text.secondary">
                {description}
              </Typography>
            )}
          </div>
          {selected && (
            <Box sx={{ color: "secondary.main" }}>
              <FuseSvgIcon>heroicons-outline:check-circle</FuseSvgIcon>
            </Box>
          )}
        </div>
        <div className="flex items-center justify-end gap-8">
          {product.count != null && (
            <Chip
              label={`${product.count} ${t("PIECES")}`}
              color="secondary"
              size="small"
            />
          )}
          <Chip label={Currency(product.price)} color="success" size="small" />
        </div>
      </ButtonBase>
    </Paper>
  );
}

export default PackagingSupplyCard;
