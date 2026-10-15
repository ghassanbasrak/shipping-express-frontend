import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { memo, useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { useSelector } from "react-redux";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

function CircleAnalytic({ data, title, pointLabel }) {
  const { t } = useTranslation("public");
  const [awaitRender, setAwaitRender] = useState(true);
  const theme = useTheme();
  const colorMap = {};
  const selectedColors = {};
  const generateColor = () => {
    let randomColorString = "#";
    const arrayOfColorFunctions = "0123456789abcdef";
    for (let x = 0; x < 6; x++) {
      let index = Math.floor(Math.random() * 16);
      let value = arrayOfColorFunctions[index];

      randomColorString += value;
    }
    return randomColorString;
  };

  const newColorFind = (id) => {
    // If already generated and assigned, return
    if (colorMap[id]) return colorMap[id];

    // Generate new random color
    let newColor;

    do {
      newColor = generateColor();
    } while (selectedColors[newColor]);

    // Found a new random, unassigned color
    colorMap[id] = newColor;
    selectedColors[newColor] = true;

    // Return next new color
    return newColor;
  };
  const series = data.map((e) => e.value);
  const labels = data.map((e) => e.label);
  console.log();
  //   const colors = data.map((_, index) => newColorFind(index));
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

  const chartOptions = {
    chart: {
      animations: {
        speed: 400,
        animateGradually: {
          enabled: false,
        },
      },
      fontFamily: "inherit",
      foreColor: "inherit",
      height: "100%",
      type: "donut",
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
      colors: [theme.palette.background.paper],
    },
    series,
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
            <div class="ml-8 text-md font-bold leading-none">${series[
              seriesIndex
            ].toFixed(2)}%</div>
        </div>`,
    },
  };

  useEffect(() => {
    setAwaitRender(false);
  }, []);

  if (awaitRender) {
    return null;
  }
  return (
    <Paper
      className="flex flex-col flex-auto shadow rounded-2xl overflow-hidden p-24 h-400"
      sx={{ bgcolor: (theme) => theme.palette.background.default }}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between">
        <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
          {title}
        </Typography>
        <div className="ml-8"></div>
      </div>
      <div className="flex items-center space-x-16 h-full">
        <div className="flex flex-col flex-auto mt-24 w-full">
          <ReactApexChart
            className="flex flex-auto items-center justify-center w-full"
            options={chartOptions}
            // series={[{ name: pointLabel, data: series }]}
            series={series}
            type={chartOptions.chart.type}
            height={chartOptions.chart.height}
          />
        </div>
        <div className="flex flex-col flex-auto mt-24 h-full w-full">
          {series.map((dataset, i) => (
            <div className="flex justify-between py-12 space-x-16" key={i}>
              <div className="flex items-center">
                <Box
                  className="flex-0 w-8 h-8 rounded-full"
                  sx={{ backgroundColor: colors[i] }}
                />
                <Typography className="ms-12 truncate">{labels[i]}</Typography>
              </div>
              <Typography className="text-right" color="text.secondary">
                {dataset.toFixed(2)}%
              </Typography>
            </div>
          ))}
        </div>
      </div>
      {/* <div className="mt-32">
        <div className="-my-12 divide-y">
          <div className="grid grid-cols-2 gap-8">
            {series.map((dataset, i) => (
              <div className="flex justify-between py-12" key={i}>
                <div className="flex items-center">
                  <Box
                    className="flex-0 w-8 h-8 rounded-full"
                    sx={{ backgroundColor: colors[i] }}
                  />
                  <Typography className="ms-12 truncate">
                    {labels[i]}
                  </Typography>
                </div>
                <Typography className="text-right" color="text.secondary">
                  {dataset.toFixed(2)}%
                </Typography>
              </div>
            ))}
          </div>
        </div> 
      </div>*/}
    </Paper>
  );
}

export default CircleAnalytic;
