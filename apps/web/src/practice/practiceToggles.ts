// Client-only "chaos toolbar" for practicing automation testing against SwiftCargo.
// State is per-browser (localStorage) — there is no server-side concept of these
// toggles, unlike the env-driven FeatureFlags in @assertquest/shared.
export const PRACTICE_TOGGLE_KEYS = [
  "dynamicIds",
  "slowLoadingElements",
  "brokenUi",
  "slowNetwork",
  "slowAnimations",
  "brokenLinks",
  "duplicateIds",
  "layoutShift",
  "randomOrder",
  "consoleNoise",
  "iframeContent",
  "shadowDom",
  "clickIntercepted",
  "staleElements",
  "nativeDialogs",
] as const;

export type PracticeToggleKey = (typeof PRACTICE_TOGGLE_KEYS)[number];
export type PracticeToggles = Record<PracticeToggleKey, boolean>;

export type PracticeToggleIcon =
  | "fingerprint"
  | "clone"
  | "shuffle"
  | "hourglass"
  | "layoutShift"
  | "turtle"
  | "bolt"
  | "wifi"
  | "linkSlash"
  | "terminal"
  | "iframe"
  | "shadowDom"
  | "clickIntercepted"
  | "staleElement"
  | "dialog";

export interface PracticeToggleMeta {
  key: PracticeToggleKey;
  label: string;
  description: string;
  group: "Locators" | "Timing & loading" | "Visual" | "Network & links" | "DOM & dialogs";
  icon: PracticeToggleIcon;
  /** Short note on the robust-test approach — shown as a hint in the drawer. */
  tip: string;
}

export const PRACTICE_TOGGLE_META: PracticeToggleMeta[] = [
  {
    key: "dynamicIds",
    label: "Dynamic ids",
    description: "Element ids/data-testids change each time this is switched on.",
    group: "Locators",
    icon: "fingerprint",
    tip: "Prefer role/text-based locators (getByRole, getByLabel) over exact id matches.",
  },
  {
    key: "duplicateIds",
    label: "Duplicate ids",
    description: "Two rows in a list share the same id/data-testid.",
    group: "Locators",
    icon: "clone",
    tip: "Scope your locator to a parent/row container instead of a bare #id selector.",
  },
  {
    key: "randomOrder",
    label: "Random list order",
    description: "List rows shuffle on every reload.",
    group: "Locators",
    icon: "shuffle",
    tip: "Assert by content/text, not by row index — index-based locators will flake.",
  },
  {
    key: "slowLoadingElements",
    label: "Slow loading elements",
    description: "Some pages take an extra ~1.5s to render their data.",
    group: "Timing & loading",
    icon: "hourglass",
    tip: "Use an explicit wait for the element/state, not a fixed sleep().",
  },
  {
    key: "layoutShift",
    label: "Layout shift",
    description: "A banner pops in ~1.5s after load and pushes content down.",
    group: "Timing & loading",
    icon: "layoutShift",
    tip: "Wait for the page to settle (or the specific target) before clicking by coordinates.",
  },
  {
    key: "slowAnimations",
    label: "Slow animations",
    description: "All transitions/animations are stretched to ~2s.",
    group: "Visual",
    icon: "turtle",
    tip: "Wait on the post-animation state (attribute/class), not a timeout guess.",
  },
  {
    key: "brokenUi",
    label: "Broken UI",
    description: "Cards and rows get skewed, offset, or overlapping.",
    group: "Visual",
    icon: "bolt",
    tip: "Interact via locator API clicks, not raw x/y coordinates — those break under layout shifts.",
  },
  {
    key: "slowNetwork",
    label: "Slow network",
    description: "Every API request gets an extra 2-3.5s of latency.",
    group: "Network & links",
    icon: "wifi",
    tip: "Raise your framework's default timeout, or wait on the specific network response.",
  },
  {
    key: "brokenLinks",
    label: "Broken links",
    description: "A couple of nav links point at a page that doesn't exist.",
    group: "Network & links",
    icon: "linkSlash",
    tip: "Add a link-checker pass (assert response status) alongside your UI navigation tests.",
  },
  {
    key: "consoleNoise",
    label: "Console noise",
    description: "Periodic harmless fake console.warn/console.error messages.",
    group: "Network & links",
    icon: "terminal",
    tip: "If you assert on console output, filter by message pattern, not \"any error fired\".",
  },
  {
    key: "iframeContent",
    label: "Iframe content",
    description: "A widget on the dashboard renders inside an <iframe>.",
    group: "DOM & dialogs",
    icon: "iframe",
    tip: "Switch into the frame's context first (frameLocator in Playwright, driver.switch_to.frame in Selenium).",
  },
  {
    key: "shadowDom",
    label: "Shadow DOM",
    description: "A widget on the dashboard renders inside a shadow root.",
    group: "DOM & dialogs",
    icon: "shadowDom",
    tip: "Playwright pierces shadow DOM automatically; Selenium needs element.shadowRoot to reach inside.",
  },
  {
    key: "clickIntercepted",
    label: "Click intercepted",
    description: "A transparent overlay sits above a button for a few seconds.",
    group: "DOM & dialogs",
    icon: "clickIntercepted",
    tip: "Wait for the overlay to be gone/not-visible before clicking, rather than retrying blindly.",
  },
  {
    key: "staleElements",
    label: "Stale elements",
    description: "A button unmounts and remounts every few seconds (same look, new DOM node).",
    group: "DOM & dialogs",
    icon: "staleElement",
    tip: "Re-query the element right before acting on it instead of caching the handle.",
  },
  {
    key: "nativeDialogs",
    label: "Native dialogs",
    description: "A delete action opens a native window.confirm() dialog.",
    group: "DOM & dialogs",
    icon: "dialog",
    tip: "Register a dialog handler before the action (page.on('dialog') / driver.switch_to.alert).",
  },
];

export interface PracticeDifficultyPreset {
  key: "off" | "beginner" | "intermediate" | "chaos";
  label: string;
  description: string;
  toggles: PracticeToggleKey[];
}

// One-click bundles, ordered easiest to hardest — handy for an instructor setting
// a specific exercise, or a learner ramping up gradually instead of flipping ten
// individual switches.
export const PRACTICE_DIFFICULTY_PRESETS: PracticeDifficultyPreset[] = [
  { key: "off", label: "Off", description: "Everything switched off.", toggles: [] },
  {
    key: "beginner",
    label: "Beginner",
    description: "A few obvious issues: dynamic ids, one broken link, slow loads.",
    toggles: ["dynamicIds", "brokenLinks", "slowLoadingElements"],
  },
  {
    key: "intermediate",
    label: "Intermediate",
    description: "Beginner set plus timing/order flakiness and an intercepted click.",
    toggles: [
      "dynamicIds",
      "brokenLinks",
      "slowLoadingElements",
      "duplicateIds",
      "layoutShift",
      "slowNetwork",
      "clickIntercepted",
      "randomOrder",
    ],
  },
  { key: "chaos", label: "Chaos", description: "Every toggle on at once.", toggles: [...PRACTICE_TOGGLE_KEYS] },
];

const STORAGE_KEY = "swiftcargo:practiceToggles";

const DEFAULTS: PracticeToggles = PRACTICE_TOGGLE_KEYS.reduce((acc, key) => {
  acc[key] = false;
  return acc;
}, {} as PracticeToggles);

function readFromStorage(): PracticeToggles {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<PracticeToggles>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

let current: PracticeToggles = readFromStorage();
let dynamicIdSalt = Math.random().toString(36).slice(2, 8);
// Bumped by resetSession() — timer-driven widgets/effects (stale elements, click
// intercepted, layout shift, console noise) key off this to re-arm on demand,
// independent of which toggles are actually on.
let sessionEpoch = 0;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
  for (const listener of listeners) listener();
}

export function getToggles(): PracticeToggles {
  return current;
}

export function getDynamicIdSalt(): string {
  return dynamicIdSalt;
}

export function setToggle(key: PracticeToggleKey, value: boolean): void {
  current = { ...current, [key]: value };
  if (key === "dynamicIds" && value) {
    dynamicIdSalt = Math.random().toString(36).slice(2, 8);
  }
  persist();
}

export function resetAllToggles(): void {
  current = { ...DEFAULTS };
  sessionEpoch++;
  persist();
}

export function applyPreset(enabledKeys: readonly PracticeToggleKey[]): void {
  current = PRACTICE_TOGGLE_KEYS.reduce((acc, key) => {
    acc[key] = enabledKeys.includes(key);
    return acc;
  }, {} as PracticeToggles);
  if (enabledKeys.includes("dynamicIds")) {
    dynamicIdSalt = Math.random().toString(36).slice(2, 8);
  }
  sessionEpoch++;
  persist();
}

export function getSessionEpoch(): number {
  return sessionEpoch;
}

// Re-arms timer-driven practice widgets (stale elements, click-intercepted
// overlay, layout shift banner, console noise) without changing which toggles
// are on — for when a learner opens the drawer mid-cycle and wants a clean run.
export function resetSession(): void {
  sessionEpoch++;
  persist();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
