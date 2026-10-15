import { BaseQueryFn, createApi } from "@reduxjs/toolkit/query/react";
import { AxiosError, AxiosRequestConfig } from "axios";
import axios from "app/configs/apiConfig";

export type ApiError = {
  status: number | "NETWORK_ERROR";
  data: unknown;
  message: string;
};
export const axiosBaseQuery =
  (): BaseQueryFn<AxiosRequestConfig, unknown, ApiError> =>
  async (request, { signal }) => {
    try {
      // Preserve headers, binary responses, multipart data and upload progress options.
      const response = await axios.request({ ...request, signal });
      return { data: response.data };
    } catch (failure) {
      const error = failure as AxiosError;
      return {
        error: {
          status: error.response?.status ?? "NETWORK_ERROR",
          data: error.response?.data,
          message: error.message,
        },
      };
    }
  };

export const apiService = createApi({
  reducerPath: "apiService",
  baseQuery: axiosBaseQuery(),
  endpoints: () => ({}),
});
export default apiService;
