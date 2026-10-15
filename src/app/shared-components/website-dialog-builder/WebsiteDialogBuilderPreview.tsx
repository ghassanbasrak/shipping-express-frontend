import {
  WebsiteDialogBuilderPreviewProps,
  generateDefaultBuilderConfig,
} from "./Utils";
import { Render } from "@measured/puck";
import "@measured/puck/puck.css";

function WebsiteDialogBuilderPreview({
  config,
  data,
  title,
  closeIcon,
}: WebsiteDialogBuilderPreviewProps) {
  return (
    <Render
      config={{
        ...generateDefaultBuilderConfig(undefined, title, closeIcon),
        ...(config ?? {}),
      }}
      data={data}
    />
  );
}

export default WebsiteDialogBuilderPreview;
