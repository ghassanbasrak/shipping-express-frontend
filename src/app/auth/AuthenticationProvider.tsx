import React, { createContext, useCallback, useMemo, useState } from "react";
import { PartialDeep } from "type-fest";
import { User } from "./user";
import Authentication from "./Authentication";
import JwtAuthProvider from "./services/jwt/JwtAuthProvider";
import { useAppDispatch } from "app/store/hooks";

export type AuthContextType = {
  updateUser?: (U: PartialDeep<User>) => Promise<User>;
  isAuthenticated: boolean;
  setIsAuthenticated: (T: boolean) => void;
  setAuthProvider: (T: string) => void;
  getAuthProvider: () => string | null;
  resetAuthProvider: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  setAuthProvider: () => {},
  getAuthProvider: () => null,
  resetAuthProvider: () => {},
});

const authProviderLocalStorageKey = "fuseReactAuthProvider";

type AuthenticationProviderProps = { children: React.ReactNode };

function AuthenticationProvider(props: AuthenticationProviderProps) {
  const { children } = props;
  const dispatch = useAppDispatch();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Get auth provider
   */
  const getAuthProvider = useCallback(() => {
    return localStorage.getItem(authProviderLocalStorageKey);
  }, []);

  /**
   * Set auth provider
   */
  const setAuthProvider = useCallback((authProvider: string) => {
    if (authProvider) {
      localStorage.setItem(authProviderLocalStorageKey, authProvider);
    }
  }, []);

  /**
   * Remove auth provider
   */
  const resetAuthProvider = useCallback(() => {
    localStorage.removeItem(authProviderLocalStorageKey);
  }, []);

  //! TODO: uncomment to implement FCM
  /**
   * Push notifications from FCM
   */
  // const onNewNotification = useCallback((notification: INotification) => {
  //   dispatch(addNotification(notification));
  // }, [dispatch]);

  const contextValue = useMemo(
    () =>
      ({
        setIsAuthenticated,
        isAuthenticated,
        getAuthProvider,
        setAuthProvider,
        resetAuthProvider,
      }) as AuthContextType,
    [
      getAuthProvider,
      setAuthProvider,
      resetAuthProvider,
      setIsAuthenticated,
      isAuthenticated,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      <JwtAuthProvider>
        <Authentication>{children}</Authentication>
      </JwtAuthProvider>
    </AuthContext.Provider>
  );
}

export default AuthenticationProvider;
