export default async function downloadFile(options: {
  url: string;
  fileName: string;
}): Promise<void> {
  try {
    const response = await fetch(options.url, {
      method: "GET",
      headers: {
        "Content-Type": "application/pdf",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const blob = await response.blob();

    if (!blob) {
      throw new Error("Failed to create blob from response");
    }

    // Create blob link to download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", options.fileName);
    link.style.display = "none"; // Hide the link element

    // Append to html link element page (hidden)
    document.body.appendChild(link);

    // Start download
    link.click();

    // Wait for download to finish (optional)
    // await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate a delay

    // Clean up and remove the link
    document.body.removeChild(link);

    URL.revokeObjectURL(url); // Revoke the object URL for cleanup
  } catch (error) {
    console.error("Error downloading file:", error);
    // Handle download error (e.g., show user notification)
  }
}
