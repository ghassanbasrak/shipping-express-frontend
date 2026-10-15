import { Box, Card } from "@mui/material";
import ReactJWPlayer from "react-jw-player";

function JWPlayer({ jwId, className = "", hidden = false, onJWLoaded }) {
  return (
    <Card className={className}>
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: hidden && "none",
        }}
      >
        <ReactJWPlayer
          playerId={jwId}
          playerScript={`https://content.jwplatform.com/libraries/j9BLvpMc.js`}
          playlist={!hidden && `https://cdn.jwplayer.com/v2/media/${jwId}`}
          aspectRatio="inherit"
          onReady={onJWLoaded}
        />
      </Box>
    </Card>
  );
}

export default JWPlayer;
