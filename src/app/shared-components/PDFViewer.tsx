import FuseLoading from "@fuse/core/FuseLoading";
import { Avatar, Card } from "@mui/material";
import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

function PDFViewer({
  pdfUrl,
  actions = { previous: "Prev", next: "Next" },
  onPageChanged,
  onPageLoaded,
  className = "w-full",
  pageClassName = "my-8",
}: {
  pdfUrl: string;
  actions?: { previous: string; next: string };
  onPageChanged?: (pageNumber: number, numPages: number) => void;
  onPageLoaded?: () => void;
  className?: string;
  pageClassName?: string;
}) {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    if (pageNumber && numPages && onPageChanged) {
      onPageChanged(pageNumber, numPages);
    }
  }, [pageNumber, pageNumber]);
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
    if (onPageLoaded) {
      onPageLoaded();
    }
  }

  function changePage(offset) {
    const newPage = pageNumber + offset;

    setPageNumber(newPage);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }
  return (
    <Card
      elevation={0}
      className={className}
      sx={{
        ".react-pdf__Page__canvas": {
          //   margin: "0 auto",
          width: "100% !important",
          height: "100% !important",
        },
        ".react-pdf__Page__annotations": {
          display: "none",
        },
        ".react-pdf__Page__textContent": {
          display: "none",
        },
      }}
    >
      <Document
        className="mb-32"
        file={pdfUrl}
        loading={
          <div className="w-full py-64">
            <FuseLoading />
          </div>
        }
        onLoadedData={() => {
          if (onPageLoaded) {
            onPageLoaded();
          }
        }}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(error) => console.log("Inside Error", error)}
        onError={(error) => console.log("Error", error)}
      >
        {Array.apply(null, Array(numPages))
          .map((x, i) => i + 1)
          .map((page) => (
            <Card className={pageClassName}>
              <Page
                pageNumber={page}
                scale={3}
                className="mb-16"
                onLoadSuccess={() => {
                  if (onPageLoaded) {
                    onPageLoaded();
                  }
                }}
              />
              <div className="flex justify-center w-full sticky bottom-0 p-16 pb-32 z-10">
                <Avatar
                  // component="div"
                  // className="p-8 rounded-full"
                  sx={{
                    bgcolor: (theme) => theme.palette.primary.main,
                    color: "white",
                  }}
                >
                  {page}
                </Avatar>
              </div>
            </Card>
          ))}
      </Document>
    </Card>
  );
}

export default PDFViewer;
