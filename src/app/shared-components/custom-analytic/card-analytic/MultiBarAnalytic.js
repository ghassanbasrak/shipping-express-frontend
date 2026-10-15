import { useSelector } from "react-redux";
import { alpha, styled, ThemeProvider, useTheme } from "@mui/material/styles";
import ReactApexChart from "react-apexcharts";
import { useMemo, useState } from "react";
import { selectContrastMainTheme } from "app/store/fuse/settingsSlice";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { analyticDataTypes } from "./Utils";
import moment from "moment";
import Currency from "src/app/main/utils/currencyFormatter";

const Root = styled(Paper)(({ theme }) => ({
  background: theme.palette.background.default,
  color: theme.palette.text.primary,
}));

function MultiBarAnalytic({
  data,
  data1,
  title,
  titleValue,
  moneyChangesLabel = false,
  moneyChangesLabel1 = false,
  moneyChangesLabelGetter,
  moneyChangesLabelGetter1,
  placeholder = "-----",
  placeholder1 = "-----",
  isMoneyGetter = false,
  isMoneyGetter1 = false,
  locale = false,
  locale1 = false,
  dataType = analyticDataTypes.normal,
  dataType1 = analyticDataTypes.normal,
  pointLabel,
  pointLabel1,
}) {
  const { t } = useTranslation("public");
  const theme = useTheme();
  const contrastTheme = useSelector(
    selectContrastMainTheme(theme.palette.primary.main)
  );
  function getFormattedValue(value) {
    return dataType === analyticDataTypes.money
      ? value === null || value === undefined
        ? placeholder ?? "--"
        : `${
            moneyChangesLabel && moneyChangesLabelGetter
              ? moneyChangesLabelGetter(value)
              : ""
          }${Currency(value)}`
      : dataType === analyticDataTypes.moneyOrPercentage
      ? value === null || value === undefined
        ? placeholder ?? "--"
        : isMoneyGetter && isMoneyGetter(value)
        ? `${
            moneyChangesLabel && moneyChangesLabelGetter
              ? moneyChangesLabelGetter(value)
              : ""
          }${Currency(value)}`
        : `${value ?? ""}%`
      : dataType === analyticDataTypes.percentage
      ? `${value ?? ""}%`
      : dataType === analyticDataTypes.weight
      ? `${value ?? ""} ${t("KG")}`
      : // :
      // dataType === analyticDataTypes.date
      // ? value
      //   ? moment(value).format("DD/MM/YYYY")
      //   : placeholder ?? "--"
      locale
      ? localeString(value ?? { en: "", ar: "" })
      : value;
  }
  const today = new Date();
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
    plotOptions: {
      bar: {
        // borderRadius: 10,
        dataLabels: {
          position: "top", // top, center, bottom
        },
      },
    },
    colors: [
      ({ value, seriesIndex, dataPointIndex, w }) =>
        data[dataPointIndex].color ?? contrastTheme.palette.secondary.main,
      ({ value, seriesIndex, dataPointIndex, w }) =>
        data1[dataPointIndex].color ?? contrastTheme.palette.success.main,
    ],
    dataLabels: {
      enabled: false,
    },
    fill: {
      colors: [
        // index === 0
        //   ? contrastTheme.palette.secondary.light
        //   :
        ({ value, seriesIndex, dataPointIndex, w }) =>
          data[dataPointIndex].color ?? contrastTheme.palette.secondary.main,
        ({ value, seriesIndex, dataPointIndex, w }) =>
          data1[dataPointIndex].color ?? contrastTheme.palette.success.main,
      ],
    },
    grid: {
      show: false,
      borderColor: alpha(contrastTheme.palette.text.secondary, 0.4),
      padding: {
        top: 10,
        bottom: -40,
        left: 0,
        right: 0,
      },
      position: "back",
      xaxis: {
        lines: {
          show: true,
        },
      },
    },
    stroke: {
      width: 2,
    },
    tooltip: {
      followCursor: true,
      theme: "dark",
      y: {
        formatter: (value) => getFormattedValue(value),
      },
    },
    xaxis: {
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      crosshairs: {
        stroke: {
          color: alpha(contrastTheme.palette.text.secondary, 0.4),
          dashArray: 0,
          width: 2,
        },
      },
      labels: {
        offsetY: -20,
        style: {
          colors: "white",
          fontSize: dataType !== analyticDataTypes.date && "10px",
        },
        trim: true,
      },
      tickAmount: 20,
      tooltip: {
        enabled: true,
      },
      categories:
        dataType !== analyticDataTypes.date
          ? data.map((d) => d.label)
          : [
              ...Array.from({ length: data.length - 1 }, (_, i) => {
                const date = new Date();
                date.setDate(
                  today.getDate() -
                    (data.length - 1 - i) * (30 / (data.length - 1))
                );
                return moment(date).format("DD MMM");
              }),
              moment(today).format("DD MMM"),
            ],
      type: dataType === analyticDataTypes.date ? "datetime" : "category",
    },
    yaxis: {
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      //   min: 0,
      //   max: (max) => max + 5000,
      tickAmount: 5,
      show: false,
    },
  };
  const container = {
    show: {
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };
  return useMemo(
    () => (
      <Root className="dark flex flex-col flex-auto shadow rounded-2xl overflow-hidden h-400">
        <div className="flex items-center justify-between mt-24 ml-24 mr-24 sm:mr-24">
          <div className="flex flex-col">
            <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
              {title}
            </Typography>
            {data && data.length > 0 && (
              <Typography className="me-16 text-4xl md:text-3xl font-semibold tracking-tight leading-7">
                {titleValue}
              </Typography>
            )}
          </div>
          <div className="mt-12 sm:mt-0 sm:ml-8">
            {/* <Tabs
                value={tabValue}
                onChange={(ev, value) => setTabValue(value)}
                indicatorColor="secondary"
                textColor="inherit"
                variant="scrollable"
                scrollButtons={false}
                className="-mx-4 min-h-40"
                classes={{
                  indicator: "flex justify-center bg-transparent w-full h-full",
                }}
                TabIndicatorProps={{
                  children: (
                    <Box
                      sx={{ bgcolor: "text.disabled" }}
                      className="w-full h-full rounded-full opacity-20"
                    />
                  ),
                }}
              >
                <Tab
                  className="text-14 font-semibold min-h-40 min-w-64 mx-4 px-12"
                  // disableRipple
                  label={t("THIS_MONTH")}
                />
                <Tab
                  className="text-14 font-semibold min-h-40 min-w-64 mx-4 px-12"
                  // disableRipple
                  label={t("LAST_MONTH")}
                />
              </Tabs> */}
          </div>
        </div>

        <div className="flex flex-col flex-auto h-full w-full">
          <ReactApexChart
            options={chartOptions}
            series={[
              {
                name: pointLabel,
                data:
                  dataType === analyticDataTypes.date
                    ? data
                    : data.map((d) => d.value),
              },
              {
                name: pointLabel1,
                data:
                  dataType1 === analyticDataTypes.date
                    ? data1
                    : data1.map((d) => d.value),
              },
            ]}
            type={chartOptions.chart.type}
            height={chartOptions.chart.height}
          />
        </div>
      </Root>
    ),
    [data, theme.direction]
  );
}

export default MultiBarAnalytic;
