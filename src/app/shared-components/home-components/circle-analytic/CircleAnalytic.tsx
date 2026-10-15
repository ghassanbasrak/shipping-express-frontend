import { useTheme } from "@mui/material/styles";
import ReactApexChart from "react-apexcharts";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import moment from "moment";
import { motion } from "framer-motion";
import { CircleAnalyticProps } from "./Utils";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { Box, Divider } from "@mui/material";
import { useThemeMediaQuery } from "@fuse/hooks";
const itemMotion = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};
function CircleAnalytic({
  title,
  series,
  color,
  textColor = "",
  className = "",
}: CircleAnalyticProps) {
  const { t } = useTranslation("public");
  const theme = useTheme();
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("md"));
  const today = new Date();

  const labels = series.map((e) => e.label);
  const colors = [
    "#3182CE",
    "#DD6B20",
    "#319795",
    "#805AD5",
    "#63B3ED",
    "#F6AD55",
    "#4FD1C5",
    "#B794F4",
  ];

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      animations: {
        enabled: true,
      },
      fontFamily: "inherit",
      foreColor: "inherit",
      height: "100%",
      type: "pie",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      sparkline: {
        enabled: true,
      },
    },

    colors,
    labels,
    plotOptions: {
      pie: {
        customScale: 0.9,
        expandOnClick: false,
        donut: {
          size: "70%",
        },
      },
    },
    stroke: {
      curve: "smooth",
      lineCap: "round",
    },
    tooltip: {
      enabled: true,
      fillSeriesColor: false,
      theme: "dark",
      custom: ({ seriesIndex, w }) =>
        `<div class="flex items-center h-32 min-h-32 max-h-23 px-12">
              <div class="w-12 h-12 rounded-full" style="background-color: ${
                colors[seriesIndex]
              };"></div>
              <div class="ml-8 text-md leading-none">${labels[seriesIndex]}:</div>
              <div class="ml-8 text-md font-bold leading-none">${(
                (series[seriesIndex].value /
                  series.reduce((partialSum, a) => partialSum + a.value, 0)) *
                100
              ).toFixed(1)}%</div>
          </div>`,
    },
    states: {
      hover: {
        filter: {
          type: "none",
        },
      },
      active: {
        filter: {
          type: "none",
        },
      },
    },
    // grid: {
    //   borderColor: "#FFFFFF2F",
    //   position: "back",
    //   xaxis: {
    //     lines: {
    //       show: true,
    //     },
    //   },
    // },
    // yaxis: {
    //   labels: {
    //     style: {
    //       colors: "#FFFFFFAF",
    //     },
    //   },
    // },
    // xaxis: {
    //   type: "category",
    //   axisBorder: {
    //     color: "#FFFFFFAF",
    //   },
    //   labels: {
    //     style: {
    //       colors: "#FFFFFFAF",
    //     },
    //   },
    //   categories:
    //     typeof series?.[0]?.[0] === "number"
    //       ? [
    //           ...Array.from({ length: series.length - 1 }, (_, i) => {
    //             const date = new Date();
    //             date.setDate(
    //               today.getDate() -
    //                 (series.length - 1 - i) * (30 / (series.length - 1))
    //             );
    //             return moment(date).format("DD MMM");
    //           }),
    //           moment(today).format("DD MMM"),
    //         ]
    //       : series?.[0]?.map((s: any) => s.y),
    // },
  };
  return (
    <Box
      component={motion.div}
      variants={itemMotion}
      className={clsx("relative w-full", className)}
    >
      <div
        className={clsx(
          "absolute top-0 -left-16",
          isMobile ? "h-160 w-160" : "h-256 w-256"
        )}
      >
        <Box className={clsx("h-full rounded-16 overflow-hidden")}>
          <ReactApexChart
            options={chartOptions}
            series={series.map((s) => s.value)}
            type={chartOptions.chart.type}
            height={chartOptions.chart.height}
            // className="flex flex-auto items-center justify-center w-full h-full"
          />
        </Box>
      </div>
      <Paper
        className={clsx(
          "flex flex-col flex-auto shadow rounded-lg overflow-hidden min-h-256 h-full",
          isMobile ? "ms-64 ps-64" : "ms-112 ps-112"
        )}
      >
        <div className="flex items-start justify-between m-16 mb-0">
          <Typography className="text-xl font-medium tracking-tight leading-6 truncate">
            {title}
          </Typography>
          {/* <div className="ml-8">
            <Chip
              size="small"
              className="font-medium text-sm"
              label={`30 ${t("dAYS")}`}
            />
          </div> */}
        </div>
        <Divider flexItem className="mx-16 my-8" />
        {/* <div className="flex flex-col lg:flex-row lg:items-center mx-16 my-8">
          <Typography
            className={clsx(
              "text-6xl font-semibold tracking-tighter leading-tight",
              textColor
            )}
          >
            {series[series.length - 1]?.value?.toLocaleString("en-US")}
          </Typography>
        </div> */}
        <div className="grid grid-cols-1 gap-x-32 gap-y-8 mx-16">
          {series.map((dataset, i) => (
            <div className="flex justify-between py-12" key={i}>
              <div className="flex items-center">
                <Box
                  className="flex-0 w-12 h-12 rounded-full"
                  sx={{ backgroundColor: colors[i] }}
                />
                <Typography className="ms-8 font-medium">
                  {labels[i]}
                </Typography>
              </div>
              <Typography
                className="text-right font-bold"
                sx={{ color: colors[i] }}
              >
                {`${dataset.value?.toLocaleString("en-US")}`}
              </Typography>
            </div>
          ))}
        </div>
      </Paper>
    </Box>
  );
}

export default CircleAnalytic;
