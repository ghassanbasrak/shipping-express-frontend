const jwtAuthConfig = {
  signUp: "v1/users",
  signInWithEmailAndPassword: "v1/auth-sessions/login",
  signInWithRefreshToken: "v1/auth-sessions/refresh",
  destroySession: "v1/auth-sessions/destroy",
  accessToken: "v1/users/me",
  updateUser: "v1/users/me",
  sendOtpCode: "v1/users/send-codes",
  verifyOtpCode: "v1/users/verify-codes",
  requestResetCode: "v1/users/forgot-password",
  verifyResetCode: "v1/users/reset-password",
  applyAffiliateCode: "v1/users/apply-affiliate-code",
};
export default jwtAuthConfig;
