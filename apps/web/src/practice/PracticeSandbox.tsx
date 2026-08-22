import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card } from "../ui/index.js";
import { usePracticeMode } from "./PracticeModeContext.js";

function IframeWidget() {
  const doc = `<!doctype html><html><body style="margin:0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100%;background:#f6f7f9">
    <button id="iframe-confirm-btn" onclick="this.textContent='Confirmed inside iframe ✓'"
      style="padding:8px 14px;border-radius:8px;border:1px solid #d8dbe0;background:#fff;cursor:pointer;font-size:13px">
      Confirm pickup
    </button>
  </body></html>`;
  return (
    <iframe
      title="Pickup confirmation widget"
      data-testid="practice-iframe"
      srcDoc={doc}
      className="h-[64px] w-full rounded-lg border border-hairline"
    />
  );
}

function ShadowDomWidget() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || host.shadowRoot) return;
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        button { padding: 8px 14px; border-radius: 8px; border: 1px solid #d8dbe0; background: #fff; cursor: pointer; font-size: 13px; }
      </style>
      <button id="shadow-confirm-btn" data-testid="practice-shadow-btn">Confirm delivery</button>
    `;
    root.querySelector("button")?.addEventListener("click", (e) => {
      (e.target as HTMLButtonElement).textContent = "Confirmed in shadow root ✓";
    });
  }, []);

  return <div ref={hostRef} data-testid="practice-shadow-host" className="rounded-lg border border-hairline p-2" />;
}

function ClickInterceptedWidget() {
  const { sessionEpoch } = usePracticeMode();
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    setOverlayVisible(true);
    setClicked(false);
    const timer = setTimeout(() => setOverlayVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [sessionEpoch]);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        data-testid="practice-intercepted-btn"
        onClick={() => setClicked(true)}
        className="rounded-lg border border-hairline bg-white px-3.5 py-2 text-[13px] text-ink-900"
      >
        {clicked ? "Assigned ✓" : "Assign driver"}
      </button>
      {overlayVisible && (
        <div
          data-testid="practice-intercepted-overlay"
          className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 text-[10px] font-mono uppercase tracking-wide text-faint"
        >
          syncing…
        </div>
      )}
    </div>
  );
}

function StaleElementWidget() {
  const { sessionEpoch } = usePracticeMode();
  const [remountKey, setRemountKey] = useState(0);

  useEffect(() => {
    setRemountKey(0);
    const interval = setInterval(() => setRemountKey((k) => k + 1), 3000);
    return () => clearInterval(interval);
  }, [sessionEpoch]);

  return (
    <button
      key={remountKey}
      type="button"
      data-testid="practice-stale-btn"
      className="rounded-lg border border-hairline bg-white px-3.5 py-2 text-[13px] text-ink-900"
    >
      Track shipment
    </button>
  );
}

function NativeDialogWidget() {
  const [result, setResult] = useState<"confirmed" | "cancelled" | null>(null);

  function onDelete() {
    const ok = window.confirm("Delete this practice shipment? This cannot be undone.");
    setResult(ok ? "confirmed" : "cancelled");
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="danger" data-testid="practice-dialog-btn" onClick={onDelete}>
        Delete shipment
      </Button>
      {result && (
        <Badge tone={result === "confirmed" ? "danger" : "neutral"}>
          {result === "confirmed" ? "Deleted" : "Cancelled"}
        </Badge>
      )}
    </div>
  );
}

const WIDGETS: Array<{
  toggle: "iframeContent" | "shadowDom" | "clickIntercepted" | "staleElements" | "nativeDialogs";
  title: string;
  render: () => JSX.Element;
}> = [
  { toggle: "iframeContent", title: "Iframe content", render: IframeWidget },
  { toggle: "shadowDom", title: "Shadow DOM", render: ShadowDomWidget },
  { toggle: "clickIntercepted", title: "Click intercepted", render: ClickInterceptedWidget },
  { toggle: "staleElements", title: "Stale elements (remounts every ~3s)", render: StaleElementWidget },
  { toggle: "nativeDialogs", title: "Native dialogs", render: NativeDialogWidget },
];

// Demo widgets for the "DOM & dialogs" practice toggles — each only renders while
// its own toggle is on, so the dashboard stays clean by default.
export function PracticeSandbox() {
  const { toggles } = usePracticeMode();
  const active = WIDGETS.filter((w) => toggles[w.toggle]);

  if (active.length === 0) return null;

  return (
    <Card className="mt-6">
      <h2 className="mb-1 text-[15px] font-bold tracking-tight text-ink-900">Practice sandbox</h2>
      <p className="mb-4 text-sm text-muted">Widgets for the DOM & dialogs toggles you have switched on.</p>
      <div className="flex flex-col gap-5">
        {active.map(({ toggle, title, render: Widget }) => (
          <div key={toggle}>
            <div className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">{title}</div>
            <Widget />
          </div>
        ))}
      </div>
    </Card>
  );
}
