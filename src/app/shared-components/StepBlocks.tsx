import { Box, Typography } from "@mui/material";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

function StepBlocks({
  steps,
  currentStep,
  handleStepClick,
  size = "medium",
  color = "primary",
  hideProgressText = false,
  className = "",
}: {
  steps: number;
  currentStep: number;
  handleStepClick?: (step: number) => void;
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "success" | "error" | "info";
  hideProgressText?: boolean;
  className?: string;
}) {
  const { t } = useTranslation("public");

  return (
    <div className={clsx("w-full flex flex-col space-y-8", className)}>
      <div
        className={clsx(
          "w-full flex items-center",
          size === "large"
            ? "space-x-16"
            : size === "small"
              ? "space-x-8"
              : "space-x-12",
          className
        )}
      >
        {Array.from({ length: steps }, (_, index) => (
          <StepBlock
            key={index}
            active={currentStep === index}
            finished={currentStep > index}
            size={size}
            color={color}
            onClick={handleStepClick ? () => handleStepClick(index) : undefined}
          />
        ))}
      </div>
      {!hideProgressText && (
        <Typography className="text-15 font-semibold" color="text.disabled">
          {`${currentStep + 1} ${t("oF")} ${steps}`}
        </Typography>
      )}
    </div>
  );
}

function StepBlock({
  active = false,
  finished,
  size = "medium",
  color = "primary",
  onClick,
}: {
  active?: boolean;
  finished?: boolean;
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "success" | "error" | "info";
  onClick?: () => void;
}) {
  const { t } = useTranslation("public");

  return (
    <Box
      onClick={onClick}
      className={clsx(
        "w-full rounded-lg shadow",
        size === "large" ? "h-10" : size === "small" ? "h-2" : "h-6",
        onClick ? "cursor-pointer" : ""
      )}
      sx={{
        bgcolor: (theme) =>
          !active && !finished
            ? theme.palette.divider
            : theme.palette[color][active ? "main" : "dark"],
      }}
    ></Box>
  );
}

export default StepBlocks;
