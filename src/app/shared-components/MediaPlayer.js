import { useThemeMediaQuery } from "@fuse/hooks";
import { Card } from "@mui/material";
import ReactPlayer from "react-player";

function MediaPlayer({ mediaUrl, className = "", hidden = false }) {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("md"));
  return (
    <Card
      className={className}
      //   sx={{
      //     ".player-wrapper": {
      //       width: "auto", // Reset width
      //       height: "auto", // Reset height
      //     },
      //     ".react-player": {
      //       paddingTop: "56.25%", // Percentage ratio for 16:9
      //       position: "relative", // Set to relative
      //     },

      //     ".react-player > div": {
      //       position: "absolute", // Scaling will occur since parent is relative now
      //     },
      //   }}
    >
      <ReactPlayer
        stopOnUnmount
        url={mediaUrl}
        controls
        playing={!hidden}
        width="100%"
        height={isMobile ? 250 : 600}
        onContextMenu={(e) => e.preventDefault()}
        style={{ display: hidden && "none", width: "100%" }}
        config={{
          file: {
            attributes: {
              controlsList: "nodownload",
            },
          },
        }}
      />
    </Card>
  );
}

export default MediaPlayer;
