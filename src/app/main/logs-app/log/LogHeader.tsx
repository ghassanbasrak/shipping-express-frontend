import { Button, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ILog from "../models/ILog";
export default function LogHeader({ log }: { log?: ILog }) {
  const { t } = useTranslation("logsApp");
  return (
    <div className="flex flex-wrap justify-between items-center gap-16 w-full p-24 sm:p-32">
      <div>
        <Button component={Link} to="/logs">
          {t("GO_TO_LOGS")}
        </Button>
        <Typography className="text-24 font-bold break-words">
          {t("LOG")} {log?.message}
        </Typography>
      </div>
    </div>
  );
}
