// The native storage routes are provided by the backend develop branch.
export const storageEnabled =
  import.meta.env.VITE_DEMO_MODE === "true" ||
  import.meta.env.VITE_STORAGE_API_ENABLED !== "false";
