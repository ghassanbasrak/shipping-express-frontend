import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { Button, ButtonGroup, useTheme } from "@mui/material";
import clsx from "clsx";

function SliderControl({
  onPrevPressed,
  onNextPressed,
  middleLabel = "../..",
  prevLabel = "Prev",
  nextLabel = "",
  prevDisabled = false,
  nextDisabled = false,
  variant = "contained",
  size = "medium",
  color = "primary",
  className = "",
}) {
  const theme = useTheme();
  return (
    <div
      className={clsx(
        "flex justify-center w-full sticky bottom-0 p-16 z-10",
        className
      )}
    >
      <ButtonGroup variant={variant} aria-label="" color={color} size={size}>
        <Button
          size={size}
          startIcon={
            <FuseSvgIcon size={18}>
              {theme.direction === "rtl"
                ? "heroicons-outline:arrow-narrow-right"
                : "heroicons-outline:arrow-narrow-left"}
            </FuseSvgIcon>
          }
          onClick={onPrevPressed}
          disabled={prevDisabled}
        >
          {prevLabel}
        </Button>
        <Button className="pointer-events-none" size={size}>
          {middleLabel}
        </Button>
        <Button
          size={size}
          endIcon={
            <FuseSvgIcon size={18}>
              {theme.direction === "rtl"
                ? "heroicons-outline:arrow-narrow-left"
                : "heroicons-outline:arrow-narrow-right"}
            </FuseSvgIcon>
          }
          onClick={onNextPressed}
          disabled={nextDisabled}
        >
          {nextLabel}
        </Button>
      </ButtonGroup>
    </div>
  );
}

export default SliderControl;
