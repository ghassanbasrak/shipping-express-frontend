import axios from "axios";

// Environment overrides take precedence over the configured Ashamco development API.
export const API_BASE_URL = (
  import.meta.env.VITE_BASE_URL || "https://api.v1.dev.e5hh6.ashamcoexpress.com"
).replace(/\/$/, "");
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common.platform = "web";
export default axios;
