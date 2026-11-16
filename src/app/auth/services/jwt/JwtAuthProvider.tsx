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
import { isAxiosError } from "axios";
import { User } from "../../user";
import config from "./jwtAuthConfig";
import {
  getAccessToken,
  getRefreshToken,
  installAuthInterceptors,
  setSession,
} from "./session";
import type {
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
} from "./authContracts";
import { useAppDispatch } from "app/store/hooks";
import apiService from "app/store/apiService";
import { closeDialog } from "@fuse/core/FuseDialog/fuseDialogSlice";
import { resetUser } from "../../user/store/userSlice";
import { getDemoUser, isDemoMode } from "src/app/demo/demoMode";
import {
  assertVerifiedContact,
  emailVerificationProfile,
  normalizeContact,
  otpChallengeId,
  type ContactKind,
} from "./contactVerification";

export type JwtAuthStatus =
  | "configuring"
  | "authenticated"
  | "unauthenticated"
  | "unavailable";
export class ProfileCompletionError extends Error {
  constructor() {
    super("Account created; profile completion must be retried");
    this.name = "ProfileCompletionError";
  }
}
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
  retrySession: () => Promise<void>;
  signInWithEmailAndPassword: (
    email: string,
    password: string,
  ) => Promise<User>;
  signInWithPhoneNumber: (
    phone: string,
    code: string,
    messageId: string,
  ) => Promise<User>;
  signUpWithEmailAndPassword: (profile: Profile) => Promise<User>;
  completeSignUpProfile: (profile: Profile) => Promise<User>;
  sendOtpCode: (phone: string, type?: "signIn") => Promise<string>;
  updateMe: (profile: Profile) => Promise<User>;
  getUser: () => Promise<User>;
  sendPhoneVerificationCode: (phone: string) => Promise<string>;
  sendEmailVerificationCode: (email: string) => Promise<void>;
  linkWithPhoneNumber: (
    phone: string,
    code: string,
    messageId: string,
  ) => Promise<User>;
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
  const [user, setUser] = useState<User | null>(
    isDemoMode ? getDemoUser() : null,
  );
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
    if (isDemoMode) {
      const { data } = await axios.get<User>(`v1/users/${getDemoUser().id}`);
      return acceptUser(data);
    }
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
  const completeSignUpProfile = useCallback(
    async (profile: Profile) => {
      const { affiliateCode, password: _password, ...body } = profile;
      const next = await updateMe(body);
      if (affiliateCode)
        await axios
          .post(config.applyAffiliateCode, { affiliateCode })
          .catch(() => {});
      return next;
    },
    [updateMe],
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
      const body: LoginRequest = { email, password };
      const { data } = await axios.post<LoginResponse>(
        config.signInWithEmailAndPassword,
        body,
      );
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
  const signUpWithEmailAndPassword = useCallback(
    async (profile: Profile) => {
      const version = ++revision.current;
      const { affiliateCode, ...body } = profile;
      const { data } = await axios.post<LoginResponse>(config.signUp, {
        ...body,
        ...(affiliateCode ? { affiliateCode } : {}),
      });
      if (version !== revision.current) throw new Error("Session changed");
      // Retain the created account/session if the separate profile save fails.
      // /register can retry PATCH without ever repeating account creation.
      finishLogin(data);
      try {
        return await completeSignUpProfile(body);
      } catch {
        throw new ProfileCompletionError();
      }
    },
    [finishLogin, completeSignUpProfile],
  );
  const sendOtpCode = useCallback(
    async (phone: string, type: "signIn" = "signIn") => {
      const { data } = await axios.post(config.sendOtpCode, { phone, type });
      return otpChallengeId(data.msegatId);
    },
    [],
  );
  const sendPhoneVerificationCode = useCallback(
    async (phone: string) => {
      const version = revision.current,
        ownerId = user?.id;
      if (!ownerId) throw new Error("Missing account");
      const { data } = await axios.post(config.sendPhoneVerificationCode, {
        phone,
      });
      if (version !== revision.current) throw new Error("Session changed");
      const { data: current } = await axios.get<User>(config.accessToken);
      if (
        version !== revision.current ||
        current.id !== ownerId ||
        normalizeContact("phone", current.phone || "") !==
          normalizeContact("phone", phone)
      )
        throw new Error("Phone update was not confirmed");
      acceptUser(current);
      return otpChallengeId(data.msegatId);
    },
    [user?.id, acceptUser],
  );
  const sendEmailVerificationCode = useCallback(
    async (email: string) => {
      const version = revision.current,
        ownerId = user?.id;
      const { data: current } = await axios.get<User>(config.accessToken);
      if (version !== revision.current || !ownerId || current.id !== ownerId)
        throw new Error("Session changed");
      const contact = normalizeContact("email", email);
      if (current.email !== contact) {
        const { data: updated } = await axios.patch<User>(
          config.updateUser,
          emailVerificationProfile(current, contact),
        );
        if (
          version !== revision.current ||
          updated.id !== ownerId ||
          updated.email !== contact
        )
          throw new Error("Email update was not confirmed");
        acceptUser(updated);
      }
      await axios.post(config.sendEmailVerificationCode, { email: contact });
      if (version !== revision.current) throw new Error("Session changed");
    },
    [user?.id, acceptUser],
  );
  const confirmContact = useCallback(
    async (
      kind: ContactKind,
      contact: string,
      code: string,
      messageId?: string,
    ) => {
      const version = revision.current,
        ownerId = user?.id;
      if (!ownerId) throw new Error("Missing account");
      const { data } = await axios.post(
        kind === "phone" ? config.verifyOtpCode : config.verifyEmailCode,
        kind === "phone"
          ? {
              phone: contact,
              code,
              msegatId: Number(otpChallengeId(messageId)),
            }
          : { email: normalizeContact("email", contact), code },
      );
      if (version !== revision.current) throw new Error("Session changed");
      if (data.isVerified !== true || data.user?.id !== ownerId)
        throw new Error("Invalid verification code");
      // This is contact verification for the signed-in account, not another login.
      // Never replace its session with tokens returned by the public phone endpoint.
      const { data: current } = await axios.get<User>(config.accessToken);
      if (version !== revision.current) throw new Error("Session changed");
      return acceptUser(assertVerifiedContact(current, ownerId, kind, contact));
    },
    [user?.id, acceptUser],
  );
  const linkWithPhoneNumber = useCallback(
    (phone: string, code: string, messageId: string) =>
      confirmContact("phone", phone, code, messageId),
    [confirmContact],
  );
  const linkWithEmail = useCallback(
    (email: string, code: string) => confirmContact("email", email, code),
    [confirmContact],
  );
  const requestResetCode = useCallback(async (email: string) => {
    await axios.post(config.requestResetCode, { email });
  }, []);
  const verifyResetCode = useCallback(
    async (email: string, password: string, resetCode: string) => {
      const body: ResetPasswordRequest = {
        email,
        password,
        confirmPassword: password,
        token: resetCode,
      };
      await axios.post(config.verifyResetCode, body);
    },
    [],
  );
  const retrySession = useCallback(async () => {
    if (!getAccessToken()) {
      setAuthStatus("unauthenticated");
      return;
    }
    const version = revision.current;
    setAuthStatus("configuring");
    try {
      await getUser();
    } catch (error) {
      if (version !== revision.current) return;
      if (
        isAxiosError(error) &&
        [401, 403].includes(error.response?.status ?? 0)
      )
        signOut();
      else setAuthStatus("unavailable");
    }
  }, [getUser, signOut]);
  useEffect(() => {
    if (isDemoMode) return;
    const removeInterceptors = installAuthInterceptors(signOut);
    if (getAccessToken()) {
      setSession(getAccessToken(), getRefreshToken());
      void retrySession();
    } else setAuthStatus("unauthenticated");
    return () => {
      removeInterceptors();
      revision.current += 1;
    };
  }, [retrySession, signOut]);
  const value = useMemo(
    () => ({
      user,
      authStatus,
      isLoading: authStatus === "configuring",
      isAuthenticated: authStatus === "authenticated",
      signOut,
      retrySession,
      signInWithEmailAndPassword,
      signInWithPhoneNumber,
      signUpWithEmailAndPassword,
      completeSignUpProfile,
      sendOtpCode,
      sendPhoneVerificationCode,
      sendEmailVerificationCode,
      linkWithPhoneNumber,
      linkWithEmail,
      updateMe,
      getUser,
      requestResetCode,
      verifyResetCode,
    }),
    [
      user,
      authStatus,
      signOut,
      retrySession,
      signInWithEmailAndPassword,
      signInWithPhoneNumber,
      signUpWithEmailAndPassword,
      completeSignUpProfile,
      sendOtpCode,
      sendPhoneVerificationCode,
      sendEmailVerificationCode,
      linkWithPhoneNumber,
      linkWithEmail,
      updateMe,
      getUser,
      requestResetCode,
      verifyResetCode,
    ],
  );
  return (
    <JwtAuthContext.Provider value={value}>{children}</JwtAuthContext.Provider>
  );
}
export default JwtAuthProvider;
