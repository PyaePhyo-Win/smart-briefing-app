"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  setAuthUser: (user: AuthUser | null) => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
let initialUser: AuthUser | null = null;
let hasLoadedInitialUser = false;
let initialUserPromise: Promise<AuthUser | null> | null = null;

async function loadInitialUser() {
  if (hasLoadedInitialUser) {
    return initialUser;
  }

  if (!initialUserPromise) {
    initialUserPromise = fetchCurrentUser().then((currentUser) => {
      initialUser = currentUser;
      hasLoadedInitialUser = true;
      initialUserPromise = null;
      return currentUser;
    });
  }

  return initialUserPromise;
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!hasLoadedInitialUser);

  const setAuthUser = useCallback((nextUser: AuthUser | null) => {
    initialUser = nextUser;
    hasLoadedInitialUser = true;
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await fetchCurrentUser();
      setAuthUser(currentUser);
      return currentUser;
    } finally {
      setIsLoading(false);
    }
  }, [setAuthUser]);

  useEffect(() => {
    let isMounted = true;

    const initializeUser = async () => {
      if (hasLoadedInitialUser) {
        setUser(initialUser);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const currentUser = await loadInitialUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initializeUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const authenticatedUser = await loginUser(email, password);
    setAuthUser(authenticatedUser);
    return authenticatedUser;
  }, [setAuthUser]);

  const register = useCallback(async (email: string, password: string) => {
    const authenticatedUser = await registerUser(email, password);
    setAuthUser(authenticatedUser);
    return authenticatedUser;
  }, [setAuthUser]);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      initialUser = null;
      hasLoadedInitialUser = true;
      initialUserPromise = null;
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, refreshUser, setAuthUser, login, register, logout }),
    [user, isLoading, refreshUser, setAuthUser, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
