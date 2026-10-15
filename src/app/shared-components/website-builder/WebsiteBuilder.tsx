import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { WebsiteBuilderProps, generateDefaultBuilderConfig } from "./Utils";
import { Puck } from "@measured/puck";
import "@measured/puck/dist/index.css";
import { Box } from "@mui/material";
import headingAnalyzer from "@measured/puck-plugin-heading-analyzer";
import "@measured/puck-plugin-heading-analyzer/dist/index.css";
import { useState } from "react";
import clsx from "clsx";

function WebsiteBuilder({
  config,
  title,
  initialData,
  onSave,
  loadingSave,
  onExit,
  header,
  footer,
}: WebsiteBuilderProps) {
  const [language, setLanguage] = useState("ar");
  return (
    <Box
      component="div"
      sx={{
        "--puck-font-size-s":
          "calc(1rem * var(--puck-font-size-s-unitless) / 10)",
        "--puck-font-size-m":
          "calc(1rem * var(--puck-font-size-m-unitless) / 10)",
        "--puck-font-size-l":
          "calc(1rem * var(--puck-font-size-l-unitless) / 10)",
        "--puck-font-size-xl":
          "calc(1rem * var(--puck-font-size-xl-unitless) / 10)",
        "--puck-font-size-xxl":
          "calc(1rem * var(--puck-font-size-xxl-unitless) / 10)",
        "--puck-font-size-xxxl":
          "calc(1rem * var(--puck-font-size-xxxl-unitless) / 10)",
        "--puck-font-size-xxxxl":
          "calc(1rem * var(--puck-font-size-xxxxl-unitless) / 10)",
        "--puck-font-size-xs":
          "calc(1rem * var(--puck-font-size-xs-unitless) / 10)",
        "--puck-font-size-xxs":
          "calc(1rem * var(--puck-font-size-xxs-unitless) / 10)",
        "--puck-font-size-xxxs":
          "calc(1rem * var(--puck-font-size-xxxs-unitless) / 10)",
        "--puck-color-azure-01": "#75060A",
        "--puck-color-azure-02": "#900A0F",
        "--puck-color-azure-03": "#A51116",
        "--puck-color-azure-04": "#BA2025", //
        "--puck-color-azure-05": "#CD3338",
        "--puck-color-azure-06": "#DD4146",
        "--puck-color-azure-07": "#EF6166", //
        "--puck-color-azure-08": "#F4979A",
        "--puck-color-azure-09": "#F0B7B8",
        "--puck-color-azure-10": "#F4D5D5",
        "--puck-color-azure-11": "#f3f6fb",
        "--puck-color-azure-12": "#f7faff",
        "._Button--white_1t64k_48": {
          // backgroundColor: "red",
          color: (theme) => theme.palette.info.main,
          borderWidth: "1px",
          borderColor: (theme) => theme.palette.info.main,
        },
        "._Button--secondary_1t64k_48": {
          // backgroundColor: "red",
          bgcolor: (theme) => theme.palette.secondary.main,
          ":hover": {
            bgcolor: (theme) => theme.palette.secondary.dark,
          },
          ":active": {
            bgcolor: (theme) => theme.palette.secondary.dark,
          },
        },
        "._Button--info_1t64k_48": {
          // backgroundColor: "red",
          bgcolor: (theme) => theme.palette.info.main,
          ":hover": {
            bgcolor: (theme) => theme.palette.info.dark,
          },
          ":active": {
            bgcolor: (theme) => theme.palette.info.dark,
          },
        },
        "& ._Button--primary_1t64k_48": loadingSave
          ? {
              pointerEvents: "none",
              bgcolor: (theme) => theme.palette.text.disabled,
              ":hover": {
                bgcolor: (theme) => theme.palette.text.disabled,
              },
              ":active": {
                bgcolor: (theme) => theme.palette.text.disabled,
              },
            }
          : undefined,
      }}
    >
      <Puck
        config={{
          ...generateDefaultBuilderConfig(header, footer, language),
          ...(config ?? {}),
        }}
        data={initialData}
        onPublish={onSave}
        headerTitle={title}
        plugins={[headingAnalyzer]}
        overrides={{
          headerActions: ({ children }) => (
            <>
              <Box
                component="span"
                className={clsx(
                  "_Button_1t64k_1 _Button--medium_1t64k_29",
                  language === "en"
                    ? "_Button--info_1t64k_48"
                    : "_Button--white_1t64k_48"
                )}
                onClick={() =>
                  setLanguage((old) => (old === "ar" ? "en" : "ar"))
                }
              >
                {/* <FuseSvgIcon className="_Button-icon_1t64k_44" size={16}>
                  material-solid:arrow_back
                </FuseSvgIcon> */}
                EN
              </Box>
              <Box
                component="span"
                className="_Button_1t64k_1 _Button--secondary_1t64k_48 _Button--medium_1t64k_29"
                onClick={() => onExit()}
              >
                <FuseSvgIcon className="_Button-icon_1t64k_44" size={16}>
                  material-solid:arrow_back
                </FuseSvgIcon>
                Exit
              </Box>
              {children}
            </>
          ),
        }}
        // iframe={{ enabled: false, }}
      />
    </Box>
  );
}

export default WebsiteBuilder;
