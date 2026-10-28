import { ReactNode } from "react";
import FusePageSimple from "@fuse/core/FusePageSimple";
import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
export default function ServicePage({
  title,
  message,
  comingSoon = false,
  children,
}: {
  title: string;
  message: string;
  comingSoon?: boolean;
  children?: ReactNode;
}) {
  const { t } = useTranslation("merchantServices");
  return (
    <FusePageSimple
      content={
        <div
          className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center gap-24 p-24 sm:p-48 min-h-384"
          data-testid="merchant-service"
        >
          <Typography
            className="text-24 sm:text-32 font-bold"
            textAlign="center"
          >
            {t(title)}
          </Typography>
          {comingSoon && (
            <img
              src="/assets/images/coming-soon.png"
              alt={t("COMING_SOON")}
              className="w-full max-w-320 h-auto"
            />
          )}
          <Typography className="text-16" textAlign="center">
            {t(message)}
          </Typography>
          {children}
        </div>
      }
    />
  );
}
