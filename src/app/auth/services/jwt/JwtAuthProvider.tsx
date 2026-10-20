import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PartialDeep } from "type-fest";
import axios from "app/configs/apiConfig";
import { User } from "../../user";
import config from "./jwtAuthConfig";
import {
  getAccessToken,
  getRefreshToken,
  installAuthInterceptors,
  setSession,
} from "./session";
import { useAppDispatch } from "app/store/hooks";
import apiService from "app/store/apiService";
import { closeDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import { resetUser } from "../../user/store/userSlice";
import { demoUser, isDemoMode } from "src/app/demo/demoMode";

export type JwtAuthStatus = "configuring" | "authenticated" | "unauthenticated";
export type JwtAuthConfig = typeof config;
type Profile = PartialDeep<User> & {
  password?: string;
  affiliateCode?: string;
};
export type JwtAuthContextType = {
  user: User | null;
  authStatus: JwtAuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => void;
  signInWithEmailAndPassword: (
    email: string,
    password: string,
  ) => Promise<User>;
  signInWithPhoneNumber: (
    phone: string,
    code: string,
    messageId: string,
  ) => Promise<User>;
  signUpWithPhoneNumber: (
    phone: string,
    code: string,
    messageId: string,
    profile: Profile,
  ) => Promise<User>;
  sendOtpCode: (
    phone: string,
    type?: "signIn" | "signUp" | "link",
    email?: string,
  ) => Promise<string>;
  updateMe: (profile: Profile) => Promise<User>;
  getUser: () => Promise<User>;
  linkWithPhoneNumber: (
    phone: string,
    code: string,
    messageId: string,
  ) => Promise<User>;
  sendEmailVerificationCode: (email: string) => Promise<void>;
  linkWithEmail: (email: string, code: string) => Promise<User>;
  requestResetCode: (email: string) => Promise<void>;
  verifyResetCode: (
    email: string,
    password: string,
    resetCode: string,
  ) => Promise<void>;
};
export const JwtAuthContext = createContext<JwtAuthContextType | undefined>(
  undefined,
);

function JwtAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(isDemoMode ? demoUser : null);
  const [authStatus, setAuthStatus] = useState<JwtAuthStatus>(
    isDemoMode ? "authenticated" : "configuring",
  );
  const dispatch = useAppDispatch();
  const revision = useRef(0);
  const acceptUser = useCallback((next: User) => {
    if (!next?.id || !["admin", "employee", "user"].includes(next.role))
      throw new Error("Invalid account response");
    setUser(next);
    setAuthStatus("authenticated");
    return next;
  }, []);
  const signOut = useCallback(() => {
    if (isDemoMode) return;
    revision.current += 1;
    setSession(null);
    setUser(null);
    setAuthStatus("unauthenticated");
    dispatch(apiService.util.resetApiState());
    dispatch(closeDialog());
    dispatch(resetUser());
  }, [dispatch]);
  const getUser = useCallback(async () => {
    if (isDemoMode) return demoUser;
    const version = revision.current;
    const { data } = await axios.get<User>(config.accessToken);
    if (version !== revision.current) throw new Error("Session changed");
    return acceptUser(data);
  }, [acceptUser]);
  const updateMe = useCallback(
    async (profile: Profile) => {
      const version = revision.current;
      const { data } = await axios.patch<User>(config.updateUser, profile);
      if (version !== revision.current) throw new Error("Session changed");
      return acceptUser(data);
    },
    [acceptUser],
  );
  const finishLogin = useCallback(
    (data: {
      user: User;
      accessToken: string | { token: string };
      refreshToken?: string | { token: string };
    }) => {
      if (
        !data.user?.id ||
        !["admin", "employee", "user"].includes(data.user.role) ||
        !data.accessToken
      )
        throw new Error("Invalid account response");
      setSession(null);
      dispatch(apiService.util.resetApiState());
      setSession(data.accessToken, data.refreshToken);
      return acceptUser(data.user);
    },
    [acceptUser, dispatch],
  );
  const signInWithEmailAndPassword = useCallback(
    async (email: string, password: string) => {
      const version = ++revision.current;
      const { data } = await axios.post(config.signInWithEmailAndPassword, {
        email,
        password,
      });
      if (version !== revision.current) throw new Error("Session changed");
      return finishLogin(data);
    },
    [finishLogin],
  );
  const verifyPhone = useCallback(
    async (phone: string, code: string, messageId: string) => {
      const { data } = await axios.post(config.verifyOtpCode, {
        phone,
        code,
        msegatId: +messageId,
      });
      if (!data.isVerified || !data.user)
        throw new Error("Invalid verification code");
      return data;
    },
    [],
  );
  const signInWithPhoneNumber = useCallback(
    async (phone: string, code: string, messageId: string) => {
      const version = ++revision.current;
      const data = await verifyPhone(phone, code, messageId);
      if (version !== revision.current) throw new Error("Session changed");
      return finishLogin(data);
    },
    [finishLogin, verifyPhone],
  );
  const signUpWithPhoneNumber = useCallback(
    async (
      phone: string,
      code: string,
      messageId: string,
      profile: Profile,
    ) => {
      const version = ++revision.current;
      const data = await verifyPhone(phone, code, messageId);
      if (version !== revision.current) throw new Error("Session changed");
      setSession(null);
      dispatch(apiService.util.resetApiState());
      setSession(data.accessToken, data.refreshToken);
      const { affiliateCode, ...body } = profile;
      try {
        const next = await updateMe(body);
        if (affiliateCode) {
          // Referral failure must not discard a successfully created account.
          await axios
            .post(config.applyAffiliateCode, { affiliateCode })
            .catch(() => {});
        }
        return next;
      } catch (error) {
        signOut();
        throw error;
      }
    },
    [verifyPhone, updateMe, signOut, dispatch],
  );
  const sendOtpCode = useCallback(
    async (
      phone: string,
      type: "signIn" | "signUp" | "link" = "signIn",
      email?: string,
    ) => {
      const { data } = await axios.post(
        type === "link" ? config.sendPhoneCode : config.sendOtpCode,
        type === "link" ? { phone } : { phone, type, email },
      );
      if (!data.msegatId) throw new Error("Unable to send verification code");
      return String(data.msegatId);
    },
    [],
  );
  const linkWithPhoneNumber = useCallback(
    async (phone: string, code: string, messageId: string) => {
      const data = await verifyPhone(phone, code, messageId);
      setSession(data.accessToken, data.refreshToken);
      return updateMe({ phone, phoneVerified: true });
    },
    [verifyPhone, updateMe],
  );
  const sendEmailVerificationCode = useCallback(async (email: string) => {
    await axios.post(config.sendEmailCode, { email });
  }, []);
  const linkWithEmail = useCallback(
    async (email: string, code: string) => {
      const { data } = await axios.post(config.verifyEmailCode, {
        email,
        code,
      });
      if (!data.isVerified || !data.user)
        throw new Error("Invalid verification code");
      return updateMe({ email, emailVerified: true });
    },
    [updateMe],
  );
  const requestResetCode = useCallback(async (email: string) => {
    await axios.post(config.requestResetCode, { email });
  }, []);
  const verifyResetCode = useCallback(
    async (email: string, password: string, resetCode: string) => {
      await axios.post(config.verifyResetCode, {
        email,
        password,
        confirmPassword: password,
        token: resetCode,
      });
    },
    [],
  );
  useEffect(() => {
    if (isDemoMode) return;
    let active = true;
    const removeInterceptors = installAuthInterceptors(signOut);
    if (getAccessToken()) {
      setSession(getAccessToken(), getRefreshToken());
      getUser().catch(() => {
        if (active) signOut();
      });
    } else setAuthStatus("unauthenticated");
    return () => {
      active = false;
      removeInterceptors();
      revision.current += 1;
    };
  }, [getUser, signOut]);
  const value = useMemo(
    () => ({
      user,
      authStatus,
      isLoading: authStatus === "configuring",
      isAuthenticated: authStatus === "authenticated",
      signOut,
      signInWithEmailAndPassword,
      signInWithPhoneNumber,
      signUpWithPhoneNumber,
      sendOtpCode,
      updateMe,
      getUser,
      linkWithPhoneNumber,
      sendEmailVerificationCode,
      linkWithEmail,
      requestResetCode,
      verifyResetCode,
    }),
    [
      user,
      authStatus,
      signOut,
      signInWithEmailAndPassword,
      signInWithPhoneNumber,
      signUpWithPhoneNumber,
      sendOtpCode,
      updateMe,
      getUser,
      linkWithPhoneNumber,
      sendEmailVerificationCode,
      linkWithEmail,
      requestResetCode,
      verifyResetCode,
    ],
  );
  return (
    <JwtAuthContext.Provider value={value}>{children}</JwtAuthContext.Provider>
  );
}
export default JwtAuthProvider;
