import { useSelector } from "react-redux";
import { alpha, styled, useTheme } from "@mui/material/styles";
import ReactApexChart from "react-apexcharts";
import { useEffect, useMemo, useState } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FetchStatus } from "../../main/utils/dataStatus";
import Currency from "../../main/utils/currencyFormatter";
import localeString from "../../main/utils/localeString";
import TranslatedTablePagination from "../TranslatedTablePagination";
import { AnalyticDataTypes, CustomAnalyticProps } from "./Utils";
import { selectContrastMainTheme } from "@fuse/core/FuseSettings/fuseSettingsSlice";

const Root = styled(Paper)(({ theme }) => ({
  background: theme.palette.background.paper,
  color: theme.palette.text.primary,
}));

function CustomAnalytic<T extends object>({
  data,
  yKey = "value",
  xKey = "createdAt",
  zKey,
  zGetter,
  zRender,
  zLabel = "",
  status = FetchStatus.done,
  pointLabel = "",
  error,
  total,
  pageSizeOptions = [10, 25, 50, 100],
  page = 0,
  pageSize = 10,
  label,
  fields,
  dataType = AnalyticDataTypes.normal,
  onChangePagination,
  hideToolbar = false,
  noCard = true,
  header = true,
  headerValue,
  headerTitle,
  headerSuffix,
  moneyChangesLabel = false,
  moneyChangesLabelGetter,
  placeholder = "-----",
  isMoneyGetter,
  locale = false,
}: CustomAnalyticProps<T>) {
  const { t } = useTranslation("public");
  const theme = useTheme();
  const dispatch = useDispatch();
  const contrastTheme = useSelector(
    selectContrastMainTheme(theme.palette.primary.main)
  );
  const [dataSeries, setDataSeries] = useState<any[]>([]);

  useEffect(() => {
    if (data) {
      setDataSeries(
        data.map((item) => ({
          y: item[yKey],
          x: item[xKey],
          z:
            zKey || zGetter
              ? zGetter
                ? zGetter(item)
                : item[zKey]
              : undefined,
        }))
      );
    }
  }, [data, status]);

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
      type: "area",
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    colors: [contrastTheme.palette.secondary.dark],
    dataLabels: {
      enabled: false,
    },
    fill: {
      colors: [contrastTheme.palette.secondary.light],
    },
    grid: {
      show: true,
      borderColor: alpha(contrastTheme.palette.text.secondary, 0.4),
      padding: {
        top: 10,
        bottom: -33,
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
      x: {
        format: "MMM dd, yyyy",
      },
      y: {
        formatter: (value) => getFormattedValue(value),
      },
      z: {
        title: zLabel,
        formatter: zRender,
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
          colors: contrastTheme.palette.text.secondary,
        },
      },
      tickAmount: 20,
      tooltip: {
        enabled: false,
      },
      type: "datetime",
    },
    yaxis: {
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      min: 0,
      max: (max) => max + 5000,
      tickAmount: 5,
      show: false,
    },
  };
  const container = {
    show: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0 },
  };

  function getFormattedValue(value: any) {
    return dataType === AnalyticDataTypes.money
      ? value === null || value === undefined
        ? placeholder ?? "--"
        : `${
            moneyChangesLabel && moneyChangesLabelGetter
              ? moneyChangesLabelGetter(value)
              : ""
          }${Currency(value)}`
      : dataType === AnalyticDataTypes.moneyOrPercentage
        ? value === null || value === undefined
          ? placeholder ?? "--"
          : isMoneyGetter && isMoneyGetter(value)
            ? `${
                moneyChangesLabel && moneyChangesLabelGetter
                  ? moneyChangesLabelGetter(value)
                  : ""
              }${Currency(value)}`
            : `${value ?? ""}%`
        : dataType === AnalyticDataTypes.percentage
          ? `${value ?? ""}%`
          : dataType === AnalyticDataTypes.weight
            ? `${value ?? ""} ${t("KG")}`
            : // :
              // dataType === AnalyticDataTypes.date
              // ? value
              //   ? moment(value).format("DD/MM/YYYY")
              //   : placeholder ?? "--"
              locale
              ? localeString(value ?? { en: "", ar: "" })
              : value;
  }

  function getAverageValue() {
    if (status !== FetchStatus.done) {
      return placeholder;
    }
    var value =
      headerValue ??
      (dataSeries.length > 0
        ? dataSeries
            .map((x) => x.y)
            .reduce((partialSum, a) => partialSum + a, 0) / dataSeries.length
        : 0);
    return getFormattedValue(value);
  }

  return (
    <motion.div
      className="grid grid-cols-1 w-full h-full"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <Root className="w-full h-full dark flex flex-col flex-auto shadow-0 overflow-hidden">
          {header && (
            <div className="flex items-center justify-between mt-40 ml-40 mr-24 sm:mr-40">
              <div className="flex flex-col">
                <Typography className="text-lg font-medium tracking-tight leading-6 truncate">
                  {headerTitle ?? t("AVERAGE_VALUE")}
                </Typography>
                <Typography className="me-16 text-4xl md:text-3xl font-semibold tracking-tight leading-7">
                  {getAverageValue()}
                </Typography>
              </div>
              <div className="mt-12 sm:mt-0 sm:ml-8">
                {headerSuffix ?? (
                  <TranslatedTablePagination
                    className="shrink-0 rounded-lg border-1 shadow"
                    component="div"
                    count={total ?? 10}
                    rowsPerPage={pageSize}
                    page={page}
                    rowsPerPageOptions={pageSizeOptions}
                    backIconButtonProps={{
                      "aria-label": "Previous Page",
                    }}
                    nextIconButtonProps={{
                      "aria-label": "Next Page",
                    }}
                    rowsPerPageTranslation={t("ITEMS_NUMBER")}
                    onPageChange={(event, value) =>
                      onChangePagination({ page: value, pageSize })
                    }
                    onRowsPerPageChange={(event) =>
                      onChangePagination({ page, pageSize: event.target.value })
                    }
                  />
                )}
              </div>
            </div>
          )}

          {useMemo(
            () => (
              <div
                className="flex flex-col flex-auto"
                style={{ height: "425px" }}
              >
                <ReactApexChart
                  options={chartOptions}
                  series={[
                    {
                      name: pointLabel,
                      data: dataSeries,
                    },
                  ]}
                  type={chartOptions.chart.type}
                  height={chartOptions.chart.height}
                />
              </div>
            ),
            [dataSeries, theme.direction]
          )}
        </Root>
      </motion.div>
    </motion.div>
  );
}

export default CustomAnalytic;
