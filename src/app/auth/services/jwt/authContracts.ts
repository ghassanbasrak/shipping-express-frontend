import type { User } from "../../user";

/** Transport contracts documented by Ashamco OpenAPI. */
export type LoginRequest = { password: string; email?: string; phone?: string };
export type LoginResponse = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: User;
};
export type RefreshRequest = { refreshToken: string };
export type RefreshResponse = {
  accessToken: string;
  accessTokenExpiresAt: string;
};
export type DestroyRequest = RefreshRequest;
export type ResetPasswordRequest = {
  email: string;
  password: string;
  confirmPassword: string;
  token: string;
};
export type AuthApiError = {
  statusCode: number;
  type: string;
  message: string;
  errors?: unknown[];
};

/** These success bodies are observed by the existing client, but absent from OpenAPI. */
export type ObservedOtpSendResponse = { msegatId?: number | string };
export type ObservedOtpVerifyResponse = {
  isVerified?: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
};
