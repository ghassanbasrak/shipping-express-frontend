import { Alert, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import ILog from "../../models/ILog";
import { logSnapshots } from "../../Utils";
import localeString from "../../../utils/localeString";
export default function BasicInfoTab({ log }: { log: ILog }) {
  const { t } = useTranslation("logsApp"),
    snapshots = logSnapshots(log);
  return (
    <div className="space-y-24" data-testid="log-details">
      <Alert severity="info">{t("HISTORICAL_SNAPSHOT")}</Alert>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
        {["message", "modelName", "context", "createdAt"].map((key) => (
          <Paper variant="outlined" className="p-16" key={key}>
            <Typography className="font-semibold">
              {t(
                {
                  message: "MESSAGE",
                  modelName: "MODEL_NAME",
                  context: "CONTEXT",
                  createdAt: "CREATED_AT",
                }[key],
              )}
            </Typography>
            <Typography className="whitespace-pre-wrap break-words">
              {String(log[key] ?? "")}
            </Typography>
          </Paper>
        ))}
      </div>
      {snapshots.map((snapshot, index) => {
        const data = snapshot.shipment || snapshot;
        return (
          <div key={index} className="space-y-16">
            <Typography variant="h6">
              {t("SHIPMENT")} {data.trackingNumber || ""}
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {(["sender", "receiver"] as const).map((prefix) => (
                <Paper
                  variant="outlined"
                  className="p-16 space-y-8"
                  key={prefix}
                >
                  <Typography variant="h6">
                    {t(
                      prefix === "sender"
                        ? "SENDER_DETAILS"
                        : "RECEIVER_DETAILS",
                      { ns: "shipmentsApp" },
                    )}
                  </Typography>
                  {[
                    "Name",
                    "Email",
                    "Phone",
                    "Phone1",
                    "Street",
                    "ZipCode",
                  ].map((key) => (
                    <Typography key={key} className="break-words">
                      {String(
                        key.startsWith("Phone") &&
                          data[`${prefix}${key}`] &&
                          data[
                            `${prefix}PhoneCountry${key === "Phone1" ? "1" : ""}`
                          ]
                          ? `${data[`${prefix}PhoneCountry${key === "Phone1" ? "1" : ""}`]}-${data[`${prefix}${key}`]}`
                          : data[`${prefix}${key}`] ?? "",
                      )}
                    </Typography>
                  ))}
                  {["Country", "State", "City"].map((key) => (
                    <Typography key={key}>
                      {data[`${prefix}${key}`]?.name
                        ? localeString(data[`${prefix}${key}`].name)
                        : String(data[`${prefix}${key}Name`] || "")}
                    </Typography>
                  ))}
                </Paper>
              ))}
            </div>
            <Paper variant="outlined" className="p-16 space-y-8">
              {[
                "type",
                "method",
                "weight",
                "packagesCount",
                "length",
                "width",
                "height",
                "description",
              ].map((key) => (
                <Typography
                  key={key}
                  className="whitespace-pre-wrap break-words"
                >
                  {t(
                    {
                      type: "SHIPMENT_TYPE",
                      method: "SHIPPING_TYPE",
                      weight: "WEIGHT",
                      packagesCount: "PACKAGES_COUNT",
                      length: "LENGTH",
                      width: "WIDTH",
                      height: "HEIGHT",
                      description: "SHIPMENT_DESCRIPTION",
                    }[key],
                    { ns: "shipmentsApp" },
                  )}
                  : {String(data[key] ?? "")}
                </Typography>
              ))}
            </Paper>
          </div>
        );
      })}
    </div>
  );
}
