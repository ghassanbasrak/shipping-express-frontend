import i18next from "i18next";
import en from "./i18n/en";
import ar from "./i18n/ar";
i18next.addResourceBundle("en", "ashamcoAuth", en);
i18next.addResourceBundle("ar", "ashamcoAuth", ar);
import SignInConfig from "./sign-in/SignInConfig";
import SignInPhoneConfig from "./sign-in-phone/SignInPhoneConfig";
import OtpCodeSentConfig from "./otp-code-sent/OtpCodeSentConfig";
import SignUpConfig from "./sign-up/SignUpConfig";
import RegisterProfileConfig from "./register-profile/RegisterProfileConfig";
import ForgotPasswordConfig from "./forgot-password/ForgotPasswordConfig";
import SignOutConfig from "./sign-out/SignOutConfig";
import DeleteAccountConfig from "./delete-account/DeleteAccountConfig";
import BlockedConfig from "./blocked/BlockedConfig";
import VerifyAccountConfig from "./verify-account/VerifyAccountConfig";
import MaintenanceConfig from "./maintenance/MaintenanceConfig";
import AffiliateSignUpConfig from "./affiliate-sign-up/AffiliateSignUpConfig";
export default [
  SignInConfig,
  SignInPhoneConfig,
  OtpCodeSentConfig,
  SignUpConfig,
  RegisterProfileConfig,
  ForgotPasswordConfig,
  SignOutConfig,
  DeleteAccountConfig,
  BlockedConfig,
  VerifyAccountConfig,
  MaintenanceConfig,
  AffiliateSignUpConfig,
];
