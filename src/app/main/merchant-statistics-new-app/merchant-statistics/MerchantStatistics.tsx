import { useRef, useState } from "react";
import { Alert, Tab, Tabs } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FusePageCarded from "@fuse/core/FusePageCarded";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { hasOperationPermission } from "src/app/auth/permissions";
import { useGetMerchantStatisticsNewMutation } from "../MerchantStatisticsApi";
import MerchantStatisticsModel from "../models/MerchantStatisticsModel";
import {
  merchantStatisticsSchema,
  MerchantStatisticsForm,
} from "../models/MerchantStatisticsSchema";
import { statisticsNewRequest } from "../Utils";
import {
  downloadStatisticsPdf,
  statisticsUserSnapshot,
} from "../../merchant-statistics-app/Utils";
import BasicInfoTab from "./tabs/BasicInfoTab";
import MerchantStatisticsHeader from "./MerchantStatisticsHeader";
import MerchantStatisticsReport, {
  MerchantStatisticsReportData,
  hasMerchantStatistics,
} from "./sections/MerchantStatisticsReport";
export default function MerchantStatistics() {
  const { t } = useTranslation("merchantStatisticsNewApp");
  const user = useAppSelector(selectUser);
  const permitted =
    ["admin", "employee"].includes(user?.role) &&
    hasOperationPermission("merchant-statistics-new", "view", user);
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const methods = useForm<MerchantStatisticsForm>({
    mode: "onChange",
    defaultValues: MerchantStatisticsModel(),
    resolver: zodResolver(merchantStatisticsSchema(t)),
  });
  const [generate, { isLoading }] = useGetMerchantStatisticsNewMutation();
  const [report, setReport] = useState<MerchantStatisticsReportData>();
  const [error, setError] = useState(false),
    [printError, setPrintError] = useState(false),
    [printing, setPrinting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const values = methods.watch();
  const changed =
    report &&
    JSON.stringify(statisticsNewRequest(values)) !==
      JSON.stringify(report.request);
  async function onGenerate(values: MerchantStatisticsForm) {
    if (!permitted || busy.current) return;
    busy.current = true;
    setError(false);
    setPrintError(false);
    const request = statisticsNewRequest(values),
      selectedUser = statisticsUserSnapshot(values.user);
    try {
      const statistics = await generate(request).unwrap();
      setReport({ statistics, request, user: selectedUser });
    } catch {
      setError(true);
    } finally {
      busy.current = false;
    }
  }
  async function onPrint() {
    if (
      !permitted ||
      busy.current ||
      !reportRef.current ||
      !hasMerchantStatistics(report?.statistics)
    )
      return;
    busy.current = true;
    setPrinting(true);
    setPrintError(false);
    try {
      await downloadStatisticsPdf(
        reportRef.current,
        `Ashamco-statistics-new-${report.request.userId}`,
      );
    } catch {
      setPrintError(true);
    } finally {
      busy.current = false;
      setPrinting(false);
    }
  }
  if (!permitted) return <Navigate to="/home" replace />;
  return (
    <FormProvider {...methods}>
      <FusePageCarded
        header={
          <MerchantStatisticsHeader
            onGenerate={methods.handleSubmit(onGenerate)}
            onPrint={onPrint}
            loading={isLoading}
            printing={printing}
            canPrint={hasMerchantStatistics(report?.statistics)}
          />
        }
        content={
          <>
            <Tabs
              value={0}
              indicatorColor="secondary"
              textColor="secondary"
              variant="scrollable"
              scrollButtons="auto"
              classes={{ root: "w-full h-64 border-b-1" }}
            >
              <Tab className="h-64" label={t("BASIC_INFO")} />
            </Tabs>
            <div className="w-full min-w-0 p-16 sm:p-24 max-w-6xl space-y-24">
              <BasicInfoTab />
              {error && (
                <Alert severity="error" role="alert">
                  {t("LOAD_ERROR")}
                </Alert>
              )}
              {printError && (
                <Alert severity="error" role="alert">
                  {t("PRINT_ERROR")}
                </Alert>
              )}
              {changed && (
                <Alert severity="info" data-testid="statistics-draft-changed">
                  {t("REPORT_FILTERS_CHANGED")}
                </Alert>
              )}
              <div
                ref={reportRef}
                data-testid="merchant-statistics-report"
                className="p-16 sm:p-24 bg-white text-gray-900 rounded-lg min-w-0"
                aria-busy={isLoading}
              >
                <MerchantStatisticsReport report={report} />
              </div>
            </div>
          </>
        }
        scroll={isMobile ? "normal" : "content"}
      />
    </FormProvider>
  );
}
