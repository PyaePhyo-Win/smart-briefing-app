"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type AuthSuccessTransitionMode = "login" | "register";

export const AUTH_SUCCESS_TRANSITION_STORAGE_KEY = "smart-briefing-auth-success-transition";
export const AUTH_SUCCESS_TRANSITION_DURATION_MS = 1800;

type AuthSuccessTransitionContextValue = {
  isPlaying: boolean;
  mode: AuthSuccessTransitionMode | null;
  playAuthSuccessTransition: (mode: AuthSuccessTransitionMode) => void;
};

const AuthSuccessTransitionContext = createContext<AuthSuccessTransitionContextValue | null>(null);

type AuthSuccessTransitionProviderProps = {
  children: ReactNode;
};

export function AuthSuccessTransitionProvider({ children }: AuthSuccessTransitionProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<AuthSuccessTransitionMode | null>(null);

  const playAuthSuccessTransition = useCallback((nextMode: AuthSuccessTransitionMode) => {
    setMode(nextMode);
    setIsPlaying(true);
  }, []);

  const value = useMemo(
    () => ({ isPlaying, mode, playAuthSuccessTransition }),
    [isPlaying, mode, playAuthSuccessTransition]
  );

  return (
    <AuthSuccessTransitionContext.Provider value={value}>
      {children}
    </AuthSuccessTransitionContext.Provider>
  );
}

export function useAuthSuccessTransition() {
  const context = useContext(AuthSuccessTransitionContext);
  if (!context) {
    throw new Error("useAuthSuccessTransition must be used inside AuthSuccessTransitionProvider");
  }

  return context;
}
