import type { User } from "src/app/auth/user";
import type { MerchantStatisticsForm } from "./models/MerchantStatisticsSchema";
export const statisticsUserLabel = (user?: User) =>
  user
    ? [[user.firstName, user.lastName].filter(Boolean).join(" "), user.email]
        .filter(Boolean)
        .join(" / ") || user.id
    : "";
export const statisticsUserSnapshot = (user?: User): User =>
  user
    ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }
    : null;
export const statisticsRequest = (values: MerchantStatisticsForm) => ({
  userId: values.userId,
  ...(values.dateFrom && Number.isFinite(values.dateFrom.getTime())
    ? { dateFrom: values.dateFrom.toISOString() }
    : {}),
  ...(values.dateTo && Number.isFinite(values.dateTo.getTime())
    ? { dateTo: values.dateTo.toISOString() }
    : {}),
});
export const financialAssetRows = [
  ["shipments", "SHIPMENT_FEES"],
  ["codShipments", "COD_FEES"],
  ["extraWeight", "EXTRA_WEIGHT_FEES"],
  ["updateByAdministrator", "MANAGER_FEES"],
  ["bankTransferFees", "BANK_TRANSFER_FEES"],
  ["others", "OTHER_FEES"],
] as const;
export const currentObligationRows = [
  ["planBalance", "PLAN_BALANCE"],
  ["balanceCharge", "BALANCE_CHARGE"],
  ["canceledShipments", "CANCELLED_SHIPMENTS"],
  ["codBalance", "COD_BALANCE"],
  ["others", "OTHER_BALANCE"],
] as const;
export const bankTransferRows = [
  ["cod", "COD_BANK_TRANSFERS"],
  ["others", "OTHER_BANK_TRANSFERS"],
] as const;
export const codObligationRows = [
  ["total", "TOTAL_COD"],
  ["block", "BLOCK_COD"],
  ["pending", "PENDING_COD"],
  ["paid", "CURRENT_COD"],
] as const;
export async function downloadStatisticsPdf(
  element: HTMLElement,
  fileName: string,
) {
  await document.fonts.ready;
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    logging: false,
    useCORS: true,
  });
  if (!canvas.width || !canvas.height) throw new Error("Empty report");
  const pdf = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const width = pdf.internal.pageSize.getWidth() - 20;
  const pagePixels = Math.floor(
    ((pdf.internal.pageSize.getHeight() - 20) * canvas.width) / width,
  );
  // Copy every page of a long report, rather than clipping it to the first A4 sheet.
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
  pdf.save(fileName.replace(/[<>:"/\\|?*]/g, "-") + ".pdf");
}
