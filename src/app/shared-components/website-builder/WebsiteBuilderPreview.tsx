import {
  WebsiteBuilderPreviewProps,
  generateDefaultBuilderConfig,
} from "./Utils";
import { Render } from "@measured/puck";
import "@measured/puck/puck.css";
import { Card } from "@mui/material";

function WebsiteBuilderPreview({
  config,
  data,
  title,
  header,
  footer,
}: WebsiteBuilderPreviewProps) {
  return (
    <Card>
      <Render
        config={{
          ...generateDefaultBuilderConfig(header, footer),
          ...(config ?? {}),
        }}
        data={data}
      />
    </Card>
  );
}

export default WebsiteBuilderPreview;
