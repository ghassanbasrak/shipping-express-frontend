import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import { styled } from "@mui/system";
import clsx from "clsx";

const Segment = styled(Box)(({ theme, color }) => ({
  borderRadius: 3,
  transition: "background-color 0.3s ease",
  boxShadow: "0 2px 2px rgba(0, 0, 0, 0.1)",
  border: "1px solid #ddd",
}));

const DividedProgressBar = ({
  total,
  current,
  currentName,
  names,
  hideCurrentName = false,
  flex = false,
  className = "w-full p-6",
}: {
  total: number;
  current: number;
  currentName?: string;
  names?: string[];
  hideCurrentName?: boolean;
  flex?: boolean;
  className?: string;
}) => {
  const progress = (current + 1 / total) * 100;
  const backgroundColors = {
    red: "bg-red-400",
    blue: "bg-blue-400",
    green: "bg-green-400",
    white: "bg-white",
  };
  const backgroundHoverColors = {
    red: "hover:bg-red-600",
    blue: "hover:bg-blue-600",
    green: "hover:bg-green-600",
    white: "hover:bg-grey-200",
  };

  const segments = Array.from({ length: total }, (_, index) => {
    const segmentProgress = ((index + 1) / total) * 100;
    const segmentColor =
      backgroundColors[
        index <= current
          ? progress <= 30
            ? "red"
            : progress > 30 && progress <= 60
              ? "blue"
              : "green"
          : "white"
      ];
    const segmentHoverColor =
      backgroundHoverColors[
        index <= current
          ? progress <= 30
            ? "red"
            : progress > 30 && progress <= 60
              ? "blue"
              : "green"
          : "white"
      ];
    return (
      <Tooltip
        key={index}
        title={names ? names[index] : `${segmentProgress.toFixed(0)}%`}
        arrow
      >
        <Segment
          className={clsx("w-full h-16", segmentColor, segmentHoverColor)}
        />
      </Tooltip>
    );
  });

  return (
    <Box
      className={clsx(
        "flex justify-center",
        flex
          ? "flex-row space-x-8 items-center"
          : "flex-col space-y-8 items-start",
        className
      )}
    >
      <Box className="w-full flex items-center space-x-2">{segments}</Box>
      {!hideCurrentName && (
        <Typography className="mt-6 text-12 font-semibold">
          {currentName || names?.[current] || `${progress.toFixed(0)}%`}
        </Typography>
      )}
    </Box>
  );
};

export default DividedProgressBar;
