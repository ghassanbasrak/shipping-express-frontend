import { PDFDocument } from "pdf-lib";

interface MergePdfsOptions {
  pdfUrls?: string[]; // Optional array of PDF URLs
}

export async function mergePdfs({
  pdfUrls = [],
}: MergePdfsOptions): Promise<ArrayBuffer> {
  const pdfArrayBuffers: ArrayBuffer[] = [];
  for (const url of pdfUrls) {
    try {
      const arrayBuffer = await downloadFileAsArrayBuffer(url);
      pdfArrayBuffers.push(arrayBuffer);
    } catch (error) {
      // Handle download error gracefully (e.g., log error)
      console.error(`Error downloading PDF from ${url}:`, error);
    }
  }

  if (pdfArrayBuffers.length === 0) {
    throw new Error("No valid PDFs provided for merging");
  }

  const mergedPdf = await PDFDocument.create();
  const pdfDocuments: PDFDocument[] = [];
  for (const arrayBuffer of pdfArrayBuffers) {
    try {
      const pdfDocument = await PDFDocument.load(arrayBuffer);
      pdfDocuments.push(pdfDocument);
    } catch (error) {
      // Handle loading error gracefully (e.g., log error)
      console.error(`Error loading PDF:`, error);
    }
  }

  if (pdfDocuments.length === 0) {
    throw new Error("Failed to load any valid PDFs for merging");
  }

  for (const pdfDocument of pdfDocuments) {
    const copiedPages: any[] = await mergedPdf.copyPages(
      pdfDocument,
      pdfDocument.getPageIndices()
    );
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

async function downloadFileAsArrayBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download PDF from ${url} (status: ${response.status})`
    );
  }
  const blobData = await response.blob();
  return await blobData.arrayBuffer();
}
