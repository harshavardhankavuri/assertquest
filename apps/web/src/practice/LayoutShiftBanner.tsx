import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePracticeMode } from "./PracticeModeContext.js";

// When `layoutShift` is on, pops in a banner ~1.5s after each route load and
// pushes page content down — practice for click targets that move under you.
export function LayoutShiftBanner() {
  const { toggles, sessionEpoch } = usePracticeMode();
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    if (!toggles.layoutShift) return;
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [toggles.layoutShift, location.pathname, sessionEpoch]);

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-negative-100 bg-negative-50 px-6 py-2.5 text-sm text-negative-700">
      <span>System notice: scheduled maintenance window Saturday 02:00–04:00 UTC.</span>
      <button type="button" onClick={() => setVisible(false)} className="font-mono text-[11px] uppercase tracking-[0.1em]">
        Dismiss
      </button>
    </div>
  );
}
