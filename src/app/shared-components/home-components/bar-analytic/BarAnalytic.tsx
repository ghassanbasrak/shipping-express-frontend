import { useTheme } from "@mui/material/styles";
import ReactApexChart from "react-apexcharts";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import { BarAnalyticProps } from "./Utils";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { Box } from "@mui/material";
const itemMotion = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};
function BarAnalytic({
  title,
  series,
  color,
  textColor = "",
  plotTitle,
  maxColumns,
  className = "",
}: BarAnalyticProps) {
  const { t } = useTranslation("public");
  const theme = useTheme();
  const dataSeries = [
    ...series.slice(0, maxColumns ?? series.length),
    ...(maxColumns && series.length > maxColumns
      ? [
          {
            label: t("OTHER"),
            value: (
              series
                .slice(maxColumns)
                .reduce((partialSum, a) => partialSum + a.value, 0) /
              (series.length - maxColumns)
            ).toFixed(0),
          },
        ]
      : []),
  ];
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      animations: {
        speed: 400,
        animateGradually: {
          enabled: false,
        },
      },
      fontFamily: "inherit",
      foreColor: "inherit",
      width: "100%",
      height: "100%",
      type: "bar",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    colors: ["#FFFFFF"],
    fill: {
      colors: ["#FFFFFF"],
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
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      followCursor: true,
      theme: "light",
    },
    xaxis: {
      axisBorder: {
        color: "#FFFFFFAF",
      },
      labels: {
        style: {
          colors: "#FFFFFFAF",
          // fontSize: "10px",
        },
      },
      categories: dataSeries.map((d) => d.label.split(" ")),
      type: "category",
    },
    yaxis: {
      labels: {
        style: {
          colors: "#FFFFFFAF",
        },
      },
      show: true,
    },
    labels: ["Test"],
  };
  let largestIndex = 0;
  if (series.length > 0) {
    for (var i = 0; i < series.length; i++) {
      if (series[i].value > series[largestIndex].value) {
        largestIndex = i;
      }
    }
  }
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
            series={[
              {
                name: plotTitle ?? title,
                data: dataSeries.map((d) => d.value),
              },
            ]}
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
          {/* <div className="ml-8">
            <Chip
              size="small"
              className="font-medium text-sm"
              label={`30 ${t("dAYS")}`}
            />
          </div> */}
        </div>
        <div className="flex items-center justify-between mx-24 mt-12 mb-8">
          <Typography
            className={clsx(
              "text-4xl font-semibold tracking-tighter leading-tight",
              textColor
            )}
          >
            {series[largestIndex]?.label ?? "-----"}
          </Typography>
          <Typography
            className={clsx(
              "text-6xl font-semibold tracking-tighter leading-tight",
              textColor
            )}
          >
            {series[largestIndex]?.value?.toLocaleString("en-US") ?? "0"}
          </Typography>
        </div>
      </Paper>
    </Box>
  );
}

export default BarAnalytic;

// export interface Structure {
//   id: string;
//   name: ILocalString;
//   parentId?: ObjectId<Structure>;
// }
// export interface Subject {
//   id: string;
//   name: ILocalString;
//   structureId?: ObjectId<Structure>;
//   parentId?: ObjectId<Subject>;
// }
