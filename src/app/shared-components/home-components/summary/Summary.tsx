import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { SummaryProps } from "./Utils";
import { motion } from "framer-motion";
import Icon from "app/shared-components/Icon";
import clsx from "clsx";
import Currency from "src/app/main/utils/currencyFormatter";
import { Link } from "react-router-dom";
import { useThemeMediaQuery } from "@fuse/hooks";
const itemMotion = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};
function Summary({
  title,
  count,
  icon,
  currency = false,
  iconBadgeColor,
  color,
  titleClassName = "",
  countClassName = "",
  action,
  hideAction = false,
}: SummaryProps) {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("md"));
  const theme = useTheme();
  return (
    <Box
      component={motion.div}
      variants={itemMotion}
      className="relative w-full"
    >
      <Box
        className={clsx(
          "absolute top-0 start-0 rounded-16 p-12 sm:p-16 text-white shadow",
          iconBadgeColor
        )}
      >
        <Icon
          type={icon.split("-")[0]}
          name={icon.split("-")[1]}
          size={isMobile ? "1.4em" : "1.6em"}
        />
      </Box>
      <Box
        className="mt-16 ms-16 max-w-full flex flex-col items-end space-y-32 p-16 rounded-lg shadow"
        sx={{ bgcolor: (theme) => theme.palette.background.paper }}
      >
        <Typography
          className={clsx(
            "text-16 sm:text-17 md:text-18 lg:text-18 font-semibold",
            titleClassName
          )}
          textAlign="end"
        >
          {title}
        </Typography>
        <div className="w-full flex items-center justify-between">
          {!hideAction && (
            <IconButton
              className={clsx(color)}
              component={Link}
              to={action}
              size="small"
            >
              <Icon
                type="fa6"
                name={
                  theme.direction === "ltr" ? "FaAngleLeft" : "FaAngleRight"
                }
                size="1.5em"
              />
            </IconButton>
          )}
          <Typography
            className={clsx(
              "font-semibold tracking-tight leading-none",
              currency
                ? "text-1xl sm:text-2xl md:text-4xl lg:text-5xl"
                : "text-3xl sm:text-4xl md:text-5xl lg:text-6xl",
              countClassName,
              color
            )}
          >
            {currency ? Currency(count) : count.toLocaleString("en-US")}
          </Typography>
        </div>
      </Box>
    </Box>
  );
}

export default Summary;
