import { Card, CardContent } from "@mui/material";

function OfficeViewer({ officeFileUrl, className = "" }) {
  const url = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    officeFileUrl
  )}`;

  return (
    <Card
      className={className}
      sx={{
        ".cui-toolbar-buttondock.alignright": {
          display: "none",
        },
        'div[aria-label="Pop-out"]': {
          display: "none",
        },
        //syntax
        'div[aria-label="toolbar"]': {
          width: "52px",
        },
      }}
    >
      <iframe
        src={url}
        width="100%"
        height="600px"
        frameBorder="8"
        onLoadedData={() => {
          document
            .querySelector("iframe")
            .contentWindow.document.querySelector(
              ".cui-toolbar-buttondock.alignright"
            ).style.display = "none";
        }}
      ></iframe>
    </Card>
  );
}

export default OfficeViewer;
