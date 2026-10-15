import { ReactNode } from "react";

import { DefaultRootProps } from "@measured/puck";
import { IconButton } from "@mui/material";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";

export type RootProps = {
  children: ReactNode;
  title?: string;
  language?: string;
  paddingTop?: string;
  paddingBottom?: string;
  closeIcon?: boolean;
  headerType?: "textWithBorder" | "text" | "hidden";
  backgroundColor?: string;
  backgroundImageUrl?: string;
  backgroundSize?: "cover" | "contain" | "auto";
  borderRadius?: "20px";
} & DefaultRootProps;
function Root({
  children,
  puck,
  language = "ar",
  paddingTop,
  paddingBottom,
  title,
  closeIcon = false,
  headerType = "textWithBorder",
  backgroundColor,
  backgroundImageUrl,
  backgroundSize = "cover",
  borderRadius = "20px",
}: RootProps) {
  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      style={{
        fontFamily: "Tajawal",
        backgroundColor: backgroundColor ?? "white",
        backgroundImage: backgroundImageUrl && `url("${backgroundImageUrl}")`,
        backgroundSize,
        borderRadius: borderRadius,
        marginBottom: "2rem",
      }}
      className="shadow"
    >
      {headerType !== "hidden" && (
        <>
          <div
            className="flex items-center justify-between p-16"
            style={{
              paddingLeft: "1.75rem",
              paddingRight: "1.75rem",
            }}
          >
            <h1
              style={{
                color: "#BA2025",
                fontWeight: "700",
              }}
            >
              {title}
            </h1>
            {closeIcon && (
              <IconButton>
                <FuseSvgIcon>material-solid:close</FuseSvgIcon>
              </IconButton>
            )}
          </div>
          {headerType === "textWithBorder" && (
            <div
              style={{
                marginLeft: "1.75rem",
                marginRight: "1.75rem",
                borderWidth: "1px",
                borderColor: "#BA2025",
              }}
            ></div>
          )}
        </>
      )}
      <div
        className="min-h-512"
        style={{
          paddingTop,
          paddingBottom,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default Root;
