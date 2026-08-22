import { useState } from "react";
import { Button, Switch } from "../ui/index.js";
import {
  BoltIcon,
  ClickInterceptedIcon,
  CloneIcon,
  DialogIcon,
  FingerprintIcon,
  FlaskIcon,
  HourglassIcon,
  IframeIcon,
  LayoutShiftIcon,
  LinkSlashIcon,
  ResetAllIcon,
  ResetSessionIcon,
  ShadowDomIcon,
  ShuffleIcon,
  SlowMotionIcon,
  StaleElementIcon,
  TerminalIcon,
  WifiIcon,
} from "../ui/icons.js";
import { usePracticeMode } from "./PracticeModeContext.js";
import {
  PRACTICE_DIFFICULTY_PRESETS,
  PRACTICE_TOGGLE_META,
  type PracticeToggleIcon,
  type PracticeToggleKey,
  type PracticeToggleMeta,
  type PracticeToggles,
} from "./practiceToggles.js";

const GROUP_ORDER: PracticeToggleMeta["group"][] = [
  "Locators",
  "Timing & loading",
  "Visual",
  "Network & links",
  "DOM & dialogs",
];

const TOGGLE_ICONS: Record<PracticeToggleIcon, (props: { className?: string; "aria-hidden"?: boolean }) => JSX.Element> = {
  fingerprint: FingerprintIcon,
  clone: CloneIcon,
  shuffle: ShuffleIcon,
  hourglass: HourglassIcon,
  layoutShift: LayoutShiftIcon,
  turtle: SlowMotionIcon,
  bolt: BoltIcon,
  wifi: WifiIcon,
  linkSlash: LinkSlashIcon,
  terminal: TerminalIcon,
  iframe: IframeIcon,
  shadowDom: ShadowDomIcon,
  clickIntercepted: ClickInterceptedIcon,
  staleElement: StaleElementIcon,
  dialog: DialogIcon,
};

function matchesPreset(toggles: PracticeToggles, presetKeys: PracticeToggleKey[]): boolean {
  const enabledSet = new Set(presetKeys);
  return (Object.keys(toggles) as PracticeToggleKey[]).every((key) => toggles[key] === enabledSet.has(key));
}

// Floating, globally-visible drawer of client-only "chaos" toggles for practicing
// automation testing against SwiftCargo. State lives in localStorage (see
// practiceToggles.ts) — separate from the env-driven, backend FeatureFlags shown
// read-only in the Admin console.
export function PracticeToolbar() {
  const [open, setOpen] = useState(false);
  const { toggles, setToggle, resetAll, resetSession, applyPreset } = usePracticeMode();
  const activeCount = Object.values(toggles).filter(Boolean).length;
  const activePreset = PRACTICE_DIFFICULTY_PRESETS.find((p) => matchesPreset(toggles, p.toggles))?.key;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[320px] rounded-xl border border-hairline bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-bold tracking-tight text-ink-900">Practice toggles</h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={resetSession}
                title="Reset session: re-arm timer-based widgets (stale elements, click-intercepted, layout shift, console noise) without changing toggles"
                aria-label="Reset session"
                className="flex h-6 w-6 items-center justify-center rounded-md text-faint hover:bg-surface-subtle hover:text-ink-600"
              >
                <ResetSessionIcon className="w-[12px]" aria-hidden={true} />
              </button>
              <button
                type="button"
                onClick={resetAll}
                title="Reset all: switch every toggle off"
                aria-label="Reset all"
                className="flex h-6 w-6 items-center justify-center rounded-md text-faint hover:bg-surface-subtle hover:text-ink-600"
              >
                <ResetAllIcon className="w-[12px]" aria-hidden={true} />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">Difficulty preset</div>
            <div className="grid grid-cols-2 gap-1.5">
              {PRACTICE_DIFFICULTY_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  title={preset.description}
                  onClick={() => applyPreset(preset.toggles)}
                  className={`rounded-lg border px-2 py-1.5 text-center text-[10.5px] font-semibold leading-tight transition-colors ${
                    activePreset === preset.key
                      ? "border-negative-600 bg-negative-50 text-negative-700"
                      : "border-hairline bg-white text-ink-600 hover:bg-surface-subtle"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
            {GROUP_ORDER.map((group) => (
              <div key={group}>
                <div className="mb-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">{group}</div>
                <div className="flex flex-col gap-2.5">
                  {PRACTICE_TOGGLE_META.filter((meta) => meta.group === group).map((meta) => {
                    const Icon = TOGGLE_ICONS[meta.icon];
                    return (
                      <div key={meta.key} className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-negative-50 text-negative-600">
                            <Icon className="w-[12px]" aria-hidden={true} />
                          </span>
                          <div>
                            <div className="text-[12.5px] font-medium text-ink-900">{meta.label}</div>
                            <div className="text-[11px] leading-snug text-muted">{meta.description}</div>
                            <div className="mt-0.5 text-[10.5px] italic leading-snug text-brand-600">{meta.tip}</div>
                          </div>
                        </div>
                        <Switch
                          checked={toggles[meta.key]}
                          onChange={(val) => setToggle(meta.key, val)}
                          label={meta.label}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <Button
        type="button"
        variant="danger"
        onClick={() => setOpen((v) => !v)}
        className="shadow-card"
        aria-expanded={open}
      >
        <FlaskIcon className="w-[13px]" aria-hidden={true} />
        {activeCount > 0 ? `Practice mode · ${activeCount} on` : "Practice mode"}
      </Button>
    </div>
  );
}
