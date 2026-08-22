import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import {
  applyPreset,
  getSessionEpoch,
  getToggles,
  resetAllToggles,
  resetSession,
  setToggle,
  subscribe,
  type PracticeToggleKey,
  type PracticeToggles,
} from "./practiceToggles.js";

interface PracticeModeValue {
  toggles: PracticeToggles;
  sessionEpoch: number;
  setToggle: (key: PracticeToggleKey, value: boolean) => void;
  resetAll: () => void;
  resetSession: () => void;
  applyPreset: (enabledKeys: readonly PracticeToggleKey[]) => void;
}

const PracticeModeCtx = createContext<PracticeModeValue | null>(null);

export function PracticeModeProvider({ children }: { children: ReactNode }) {
  const toggles = useSyncExternalStore(subscribe, getToggles, getToggles);
  const sessionEpoch = useSyncExternalStore(subscribe, getSessionEpoch, getSessionEpoch);

  // Pure-CSS toggles are applied globally rather than threaded through every
  // component's className.
  useEffect(() => {
    document.documentElement.classList.toggle("thb-practice-broken-ui", toggles.brokenUi);
    document.documentElement.classList.toggle("thb-practice-slow-motion", toggles.slowAnimations);
  }, [toggles.brokenUi, toggles.slowAnimations]);

  const value: PracticeModeValue = {
    toggles,
    sessionEpoch,
    setToggle: useCallback((key, val) => setToggle(key, val), []),
    resetAll: useCallback(() => resetAllToggles(), []),
    resetSession: useCallback(() => resetSession(), []),
    applyPreset: useCallback((enabledKeys: readonly PracticeToggleKey[]) => applyPreset(enabledKeys), []),
  };

  return <PracticeModeCtx.Provider value={value}>{children}</PracticeModeCtx.Provider>;
}

export function usePracticeMode(): PracticeModeValue {
  const ctx = useContext(PracticeModeCtx);
  if (!ctx) throw new Error("usePracticeMode must be used within a PracticeModeProvider");
  return ctx;
}
