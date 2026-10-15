import { ComponentConfig } from "@measured/puck";
import { Box } from "@mui/material";
import { Section } from "../../components/Section";
type VideoProps = {
  width: "fullScreen" | "asLayout";
  borderRadius?: number;
  videoUrl: string;
};
export const Video: ComponentConfig<VideoProps> = {
  label: "Video",
  fields: {
    width: {
      label: "Width",
      type: "radio",
      options: [
        { label: "Full Screen", value: "fullScreen" },
        { label: "As Layout", value: "asLayout" },
      ],
    },
    borderRadius: { type: "number", label: "Border Radius (px)", min: 0 },
    videoUrl: {
      label: "Video URL Or YouTube ID",
      type: "text",
    },
  },
  defaultProps: { width: "asLayout", videoUrl: "", borderRadius: 4 },
  render: ({ id, width, borderRadius, videoUrl, puck }) => {
    const video = videoUrl ? (
      <div style={{ width: width === "fullScreen" ? "100vw" : undefined }}>
        <iframe
          src={`${
            videoUrl.toString().startsWith("https") ||
            videoUrl.toString().startsWith("https")
              ? `${videoUrl}`
              : `https://www.youtube.com/embed/${videoUrl}`
          }`}
          title="YouTube video"
          className="h-[240px] sm:h-96 md:h-[500px] shadow-md w-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            borderRadius: borderRadius ? `${borderRadius}px` : undefined,
          }}
        ></iframe>
      </div>
    ) : (
      <div className="flex items-center justify-center h-400 p-16 bg-grey-300">
        <Box
          component="div"
          className="flex flex-col items-center justify-center space-y-16 w-full h-full border-2 border-dashed rounded-lg"
          sx={{
            color: (theme) => theme.palette.primary.main,
            borderColor: (theme) => theme.palette.primary.main,
          }}
        >
          <div className="flex items-center space-x-8">
            <div className="text-2xl font-semibold">لا يوجد فيديو بعد</div>
          </div>
        </Box>
      </div>
    );
    return width === "fullScreen" ? video : <Section>{video}</Section>;
  },
};
