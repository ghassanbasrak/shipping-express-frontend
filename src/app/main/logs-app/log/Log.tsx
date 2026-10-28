import { useEffect, useState } from "react";
import { Alert, Button, Tab, Tabs } from "@mui/material";
import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FusePageCarded from "@fuse/core/FusePageCarded";
import FuseLoading from "@fuse/core/FuseLoading";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import { useAppSelector } from "app/store/hooks";
import { selectUser } from "src/app/auth/user/store/userSlice";
import { useGetLogQuery } from "../LogsApi";
import { canViewLogs } from "../Utils";
import LogHeader from "./LogHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
import LogJson from "../shared-components/LogJson";
export default function Log() {
  const { logId } = useParams(),
    { t } = useTranslation("logsApp"),
    user = useAppSelector(selectUser),
    permitted = canViewLogs(user),
    mobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg")),
    [tab, setTab] = useState(0);
  const query = useGetLogQuery(logId, {
    skip: !permitted || !logId,
    refetchOnMountOrArgChange: true,
  });
  useEffect(() => setTab(0), [logId]);
  if (!permitted) return <Navigate to="/home" replace />;
  if (query.isError || (!query.isFetching && !query.currentData))
    return (
      <div className="p-24 space-y-16">
        <Alert severity="error">{t("NO_SUCH_LOG")}</Alert>
        <Button onClick={() => query.refetch()}>{t("RETRY")}</Button>
        <Button component={Link} to="/logs">
          {t("GO_TO_LOGS")}
        </Button>
      </div>
    );
  if (!query.currentData) return <FuseLoading />;
  return (
    <FusePageCarded
      header={<LogHeader log={query.currentData} />}
      content={
        <>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            indicatorColor="secondary"
            textColor="secondary"
            classes={{ root: "w-full h-64 border-b-1" }}
          >
            <Tab label={t("BASIC_INFO")} />
            <Tab label={t("RAW_JSON")} />
          </Tabs>
          <div className="p-16 sm:p-24">
            {tab === 0 ? (
              <BasicInfoTab log={query.currentData} />
            ) : (
              <LogJson log={query.currentData} />
            )}
          </div>
        </>
      }
      scroll={mobile ? "normal" : "content"}
    />
  );
}
