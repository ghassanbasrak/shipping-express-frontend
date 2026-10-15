const jwtAuthConfig = {
  signInWithEmailAndPassword: "v1/auth-sessions/login",
  signInWithRefreshToken: "v1/auth-sessions/refresh",
  accessToken: "v1/users/me",
  updateUser: "v1/users/me",
  sendOtpCode: "v1/users/send-codes",
  sendPhoneCode: "v1/users/send-phone-code",
  verifyOtpCode: "v1/users/verify-codes",
  sendEmailCode: "v1/users/send-email-otp",
  verifyEmailCode: "v1/users/verify-email-otp",
  requestResetCode: "v1/users/forgot-password",
  verifyResetCode: "v1/users/reset-password",
  applyAffiliateCode: "v1/users/apply-affiliate-code",
};
export default jwtAuthConfig;
