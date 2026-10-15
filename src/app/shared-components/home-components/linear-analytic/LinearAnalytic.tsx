import { useTheme } from "@mui/material/styles";
import ReactApexChart from "react-apexcharts";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import moment from "moment";
import { motion } from "framer-motion";
import { LinearAnalyticProps } from "./Utils";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { Box, Button } from "@mui/material";
import Icon from "app/shared-components/Icon";
import { Link } from "react-router-dom";
const itemMotion = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};
function LinearAnalytic({
  title,
  series,
  color,
  textColor = "",
  plotTitle,
  hideAction = false,
  action,
  actionTitle,
  actionHoverColor,
  className = "",
}: LinearAnalyticProps) {
  const { t } = useTranslation("public");
  const theme = useTheme();
  const today = new Date();

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      animations: {
        enabled: true,
      },
      fontFamily: "inherit",
      foreColor: "inherit",
      height: "100%",
      type: "line",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },

    colors: ["#FFFFFF"],
    stroke: {
      curve: "smooth",
      lineCap: "round",
    },
    tooltip: {
      followCursor: true,
      theme: "light",
    },
    grid: {
      borderColor: "#FFFFFF2F",
      position: "back",
      xaxis: {
        lines: {
          show: true,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#FFFFFFAF",
        },
      },
    },
    xaxis: {
      type: "category",
      axisBorder: {
        color: "#FFFFFFAF",
      },
      labels: {
        style: {
          colors: "#FFFFFFAF",
        },
      },
      categories: [
        ...Array.from({ length: series.length - 1 }, (_, i) => {
          const date = new Date();
          date.setDate(
            today.getDate() -
              (series.length - 1 - i) * (30 / (series.length - 1))
          );
          return moment(date).format("DD MMM");
        }),
        moment(today).format("DD MMM"),
      ],
    },
  };

  return (
    <Box
      component={motion.div}
      variants={itemMotion}
      className={clsx("relative w-full", className)}
    >
      <div className="absolute top-0 h-224 w-full px-20">
        <Box
          className={clsx("h-full rounded-16 overflow-hidden shadow", color)}
          sx={{ opacity: 0.8 }}
        >
          <ReactApexChart
            options={chartOptions}
            series={[{ name: plotTitle ?? title, data: series }]}
            type={chartOptions.chart.type}
            height={chartOptions.chart.height}
          />
        </Box>
      </div>
      <Paper
        className={clsx(
          "flex flex-col flex-auto shadow rounded-lg overflow-hidden mt-52 pt-160"
        )}
      >
        <div className="flex items-start justify-between m-24 mb-0">
          <Typography className="text-lg font-semibold tracking-tight leading-6 truncate">
            {title?.toUpperCase()}
          </Typography>
          <div className="ml-8">
            <Chip
              size="small"
              className="font-medium text-sm"
              label={`30 ${t("dAYS")}`}
            />
          </div>
        </div>
        <div className="flex items-center justify-between mx-24 mt-12 mb-8">
          <Typography
            className={clsx(
              "text-6xl font-semibold tracking-tighter leading-tight",
              textColor
            )}
          >
            {series
              .reduce((partialSum, a) => partialSum + a, 0)
              .toLocaleString("en-US")}
          </Typography>
          {!hideAction && (
            <Button
              className={clsx("text-white", color, actionHoverColor)}
              component={Link}
              to={action}
              variant="contained"
              endIcon={
                <Icon
                  type="fa6"
                  name={
                    theme.direction === "rtl" ? "FaAngleLeft" : "FaAngleRight"
                  }
                  size="0.7em"
                />
              }
            >
              {actionTitle}
            </Button>
          )}
        </div>
      </Paper>
    </Box>
  );
}

export default LinearAnalytic;
