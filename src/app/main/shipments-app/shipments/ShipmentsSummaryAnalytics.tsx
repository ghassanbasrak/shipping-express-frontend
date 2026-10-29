import { Alert, Button, Paper, Typography } from "@mui/material";
import ReactApexChart from "react-apexcharts";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import FuseLoading from "@fuse/core/FuseLoading";
import { useGetShipmentsSummaryQuery } from "../ShipmentsApi";
import { toShippingFilterTypeTitle } from "../Utils";
export default function ShipmentsSummaryAnalytics({
  userId,
}: {
  userId: string;
}) {
  const { t } = useTranslation("shipmentsApp"),
    user = useAppSelector(selectUser),
    query = useGetShipmentsSummaryQuery(user.role === "user" ? "" : userId, {
      refetchOnMountOrArgChange: true,
    });
  if (query.isError)
    return (
      <Alert
        severity="error"
        action={
          <Button
            color="primary"
            variant="outlined"
            onClick={() => query.refetch()}
          >
            {t("RETRY")}
          </Button>
        }
      >
        {t("LOAD_ERROR")}
      </Alert>
    );
  if (!query.currentData) return <FuseLoading />;
  const data = query.currentData;
  const charts = [
    {
      title: "SHIPMENTS_VS_SHIPPING_COMPANIES",
      values: data.shippingCompanyAnalyticData || [],
      pie: false,
    },
    {
      title: "SHIPMENTS_VS_METHODS",
      values: (data.methodAnalyticData || []).map((item) => ({
        ...item,
        label: t(toShippingFilterTypeTitle(item.label)),
      })),
      pie: true,
    },
    ...(user.role !== "user"
      ? [
          {
            title: "SHIPMENTS_VS_USERS",
            values: data.userAnalyticData || [],
            pie: false,
          },
        ]
      : []),
  ];
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-2 gap-24 p-24"
      data-testid="shipments-summary"
    >
      {charts.map((chart) => (
        <Paper key={chart.title} className="p-16 min-w-0">
          <Typography variant="h6">
            {t(chart.title)} (
            {chart.values.reduce(
              (sum, item) => sum + Number(item.value || 0),
              0,
            )}
            )
          </Typography>
          {chart.values.some((item) => item.value > 0) ? (
            <ReactApexChart
              type={chart.pie ? "pie" : "bar"}
              height={300}
              options={{
                chart: { toolbar: { show: false } },
                labels: chart.values.map((item) => item.label),
                xaxis: { categories: chart.values.map((item) => item.label) },
                dataLabels: { enabled: chart.pie },
                legend: { show: chart.pie },
              }}
              series={
                chart.pie
                  ? chart.values.map((item) => Number(item.value || 0))
                  : [
                      {
                        name: t("SHIPMENTS"),
                        data: chart.values.map((item) =>
                          Number(item.value || 0),
                        ),
                      },
                    ]
              }
            />
          ) : (
            <Alert severity="info">{t("NO_SHIPMENTS")}</Alert>
          )}
        </Paper>
      ))}
    </div>
  );
}
