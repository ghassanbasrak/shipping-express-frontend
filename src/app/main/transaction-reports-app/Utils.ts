export async function downloadTransactionReport(url: string, fileName: string) {
  const response = await fetch(url, { credentials: "omit" });
  if (!response.ok) throw new Error("Report download failed");
  const blob = await response.blob(),
    objectUrl = URL.createObjectURL(blob),
    link = document.createElement("a");
  try {
    link.href = objectUrl;
    link.download = fileName.replace(/[<>:"/\\|?*]/g, "-");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }
}
