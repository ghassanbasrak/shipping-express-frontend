import axios from "axios";

// Keep the existing service connection until an Ashamco backend is provisioned.
export const API_BASE_URL = (
  import.meta.env.VITE_BASE_URL || "https://api.dev.gayahex.com"
).replace(/\/$/, "");
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common.platform = "web";
export default axios;
