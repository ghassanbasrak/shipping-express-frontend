import axios, { API_BASE_URL } from "app/configs/apiConfig";
import { AxiosError, InternalAxiosRequestConfig, isAxiosError } from "axios";
import config from "./jwtAuthConfig";

type Token = string | { token: string };
export const tokenString = (token?: Token): string | undefined =>
  typeof token === "string" ? token : token?.token;
export const getAccessToken = () => localStorage.getItem("jwt_access_token");
export const getRefreshToken = () => localStorage.getItem("jwt_refresh_token");
let generation = 0;
let refreshing: Promise<string> | null = null;
export function setSession(accessToken: Token | null, refreshToken?: Token) {
  const access = tokenString(accessToken);
  if (access) {
    localStorage.setItem("jwt_access_token", access);
    if (refreshToken)
      localStorage.setItem("jwt_refresh_token", tokenString(refreshToken));
    axios.defaults.headers.common.Authorization = `Bearer ${access}`;
  } else {
    generation += 1;
    refreshing = null;
    [
      "jwt_access_token",
      "jwt_refresh_token",
      "access_token",
      "refresh_token",
      "fcm_token",
    ].forEach((key) => localStorage.removeItem(key));
    delete axios.defaults.headers.common.Authorization;
  }
}
type RetryRequest = InternalAxiosRequestConfig & { _retry?: boolean };
const isServiceRequest = (request: RetryRequest) => {
  const base = new URL(`${API_BASE_URL}/`, window.location.origin);
  const requestBase = new URL(
    request.baseURL || `${API_BASE_URL}/`,
    window.location.origin,
  );
  const url = new URL(request.url || "", requestBase);
  return url.origin === base.origin && url.pathname.startsWith(base.pathname);
};

export function installAuthInterceptors(onUnauthorized: () => void) {
  const requestId = axios.interceptors.request.use((request) => {
    if (!isServiceRequest(request)) {
      request.headers.delete("Authorization");
      request.headers.delete("platform");
    }
    return request;
  });
  const responseId = axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const request = error.config as RetryRequest;
      if (
        !request ||
        error.response?.status !== 401 ||
        !isServiceRequest(request)
      )
        throw error;
      const path = new URL(request.url || "", `${API_BASE_URL}/`).pathname;
      const publicEndpoints = [
        config.signInWithEmailAndPassword,
        config.verifyOtpCode,
        config.sendOtpCode,
        config.requestResetCode,
        config.verifyResetCode,
      ];
      if (publicEndpoints.some((endpoint) => path.endsWith(`/${endpoint}`)))
        throw error;
      if (!request.headers.get("Authorization")) throw error;
      if (
        request._retry ||
        path.endsWith(`/${config.signInWithRefreshToken}`) ||
        !getRefreshToken()
      ) {
        onUnauthorized();
        throw error;
      }
      request._retry = true;
      const requestGeneration = generation;
      // A late 401 may belong to a token that another request already refreshed.
      const current = getAccessToken();
      if (
        current &&
        request.headers.get("Authorization") !== `Bearer ${current}`
      ) {
        request.headers.set("Authorization", `Bearer ${current}`);
        return axios.request(request);
      }
      if (!refreshing) {
        const task = axios
          .post(
            config.signInWithRefreshToken,
            { refreshToken: getRefreshToken() },
            { headers: { Authorization: null } },
          )
          .then((response) => {
            const token = tokenString(response.data.accessToken);
            if (!token || requestGeneration !== generation)
              throw new Error("Session changed during token refresh");
            setSession(token, response.data.refreshToken);
            return token;
          });
        refreshing = task;
        task
          .finally(() => {
            if (refreshing === task) refreshing = null;
          })
          .catch(() => {});
      }
      try {
        const token = await refreshing;
        if (requestGeneration !== generation)
          throw new Error("Session changed");
        request.headers.set("Authorization", `Bearer ${token}`);
        // Preserve the original response type and upload options when retrying.
        return await axios.request(request);
      } catch (failure) {
        if (
          requestGeneration === generation &&
          (!isAxiosError(failure) ||
            failure.response?.status === 401 ||
            failure.response?.status === 403)
        )
          onUnauthorized();
        throw failure;
      }
    },
  );
  return () => {
    axios.interceptors.request.eject(requestId);
    axios.interceptors.response.eject(responseId);
  };
}
