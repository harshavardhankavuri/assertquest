import { useEffect } from "react";
import { getDynamicIdSalt, getToggles } from "./practiceToggles.js";

// Appends a salt to `base` while dynamicIds is on, so ids/data-testids reshuffle
// each time the toggle is re-enabled — practice for brittle exact-match locators.
export function usePracticeTestId(base: string): string {
  const { dynamicIds } = getToggles();
  return dynamicIds ? `${base}-${getDynamicIdSalt()}` : base;
}

export function practiceDelay(ms = 1500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function networkDelayIfEnabled(): Promise<void> {
  if (getToggles().slowNetwork) {
    await practiceDelay(2000 + Math.random() * 1500);
  }
}

export function shuffleIfEnabled<T>(items: T[]): T[] {
  if (!getToggles().randomOrder) return items;
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const FAKE_CONSOLE_MESSAGES: Array<{ level: "warn" | "error"; message: string }> = [
  { level: "warn", message: "[SwiftCargo] Failed to prefetch route chunk, retrying…" },
  { level: "warn", message: "[SwiftCargo] WebSocket ping timeout, reconnecting…" },
  { level: "error", message: "[SwiftCargo] Uncaught (in promise) TypeError: cannot read properties of undefined" },
  { level: "warn", message: "[SwiftCargo] Deprecated API shape detected on /tracking response" },
  { level: "error", message: "[SwiftCargo] Failed to persist analytics beacon" },
];

// Periodic, harmless fake console noise — practice for console-assertion-based test
// failures (e.g. "test fails if console.error was called").
export function useConsoleNoise(enabled: boolean, sessionEpoch: number): void {
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(
      () => {
        const pick = FAKE_CONSOLE_MESSAGES[Math.floor(Math.random() * FAKE_CONSOLE_MESSAGES.length)];
        console[pick.level](pick.message);
      },
      8000 + Math.random() * 5000,
    );
    return () => clearInterval(interval);
  }, [enabled, sessionEpoch]);
}
