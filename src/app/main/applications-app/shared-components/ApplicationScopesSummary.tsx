import { Box, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { IApplicationScope } from "../models/IApplication";
import { applicationFeatures, toApplicationFeatureTitle } from "../Utils";
export default function ApplicationScopesSummary({
  scopes = [],
}: {
  scopes?: IApplicationScope[];
}) {
  const { t } = useTranslation("applicationsApp");
  const features = Array.from(
    new Set([
      ...Object.values(applicationFeatures),
      ...scopes.map((scope) => scope.feature),
    ]),
  );
  return (
    <div className="w-full flex flex-col py-8 gap-4">
      {features.map((feature) => {
        const scope = scopes.find((item) => item.feature === feature);
        return (
          <div
            className="w-full flex items-center justify-between gap-8"
            key={feature}
            data-testid={`summary-scope-${feature}`}
          >
            <span>{t(toApplicationFeatureTitle(feature))}</span>
            <div className="flex gap-4">
              {!scope || (!scope.read && !scope.write) ? (
                <Tooltip title={t("NO_ACCESS")}>
                  <Box component="span" color="error.main">
                    <FuseSvgIcon size={18}>heroicons-outline:x</FuseSvgIcon>
                  </Box>
                </Tooltip>
              ) : null}
              {scope?.read && (
                <Tooltip title={t("READ")}>
                  <Box
                    component="span"
                    color="info.main"
                    aria-label={t("READ")}
                  >
                    <FuseSvgIcon size={18}>heroicons-outline:eye</FuseSvgIcon>
                  </Box>
                </Tooltip>
              )}
              {scope?.write && (
                <Tooltip title={t("WRITE")}>
                  <Box
                    component="span"
                    color="info.main"
                    aria-label={t("WRITE")}
                  >
                    <FuseSvgIcon size={18}>
                      heroicons-outline:pencil
                    </FuseSvgIcon>
                  </Box>
                </Tooltip>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
