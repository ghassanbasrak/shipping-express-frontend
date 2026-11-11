import { PDFDocument } from "pdf-lib";
export function downloadShipmentBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  try {
    link.href = url;
    link.download = name.replace(/[<>:"/\\|?*]/g, "-");
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
export async function shipmentDocumentBlob(url: string) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Document download failed (${response.status})`);
  return response.blob();
}
// A failed label aborts the entire merge; never silently download an incomplete batch.
export async function mergeShipmentLabels(urls: string[]) {
  if (!urls.length) throw new Error("No shipment labels");
  const merged = await PDFDocument.create();
  for (const url of urls) {
    const blob = await shipmentDocumentBlob(url),
      bytes = await blob.arrayBuffer();
    if (blob.type.startsWith("image/")) {
      const image = blob.type.includes("png")
        ? await merged.embedPng(bytes)
        : await merged.embedJpg(bytes);
      const page = merged.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    } else {
      const document = await PDFDocument.load(bytes);
      for (const page of await merged.copyPages(
        document,
        document.getPageIndices(),
      ))
        merged.addPage(page);
    }
  }
  return new Blob([new Uint8Array(await merged.save())], {
    type: "application/pdf",
  });
}
export async function downloadShipmentInvoice(
  element: HTMLElement,
  name: string,
) {
  await document.fonts.ready;
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
  if (!canvas.width || !canvas.height) throw new Error("Empty invoice");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true }),
    width = 190,
    pagePixels = Math.floor((277 * canvas.width) / width);
  for (let offset = 0; offset < canvas.height; offset += pagePixels) {
    if (offset) pdf.addPage();
    const page = document.createElement("canvas");
    page.width = canvas.width;
    page.height = Math.min(pagePixels, canvas.height - offset);
    const context = page.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(
      canvas,
      0,
      offset,
      page.width,
      page.height,
      0,
      0,
      page.width,
      page.height,
    );
    pdf.addImage(
      page.toDataURL("image/png"),
      "PNG",
      10,
      10,
      width,
      (page.height * width) / page.width,
      undefined,
      "FAST",
    );
  }
  pdf.save(name.replace(/[<>:"/\\|?*]/g, "-") + ".pdf");
}
