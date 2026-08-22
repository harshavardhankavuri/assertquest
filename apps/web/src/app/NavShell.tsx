import type { ComponentType, ReactNode } from "react";
import type { FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import { Link, useLocation } from "react-router-dom";
import type { Role } from "@assertquest/shared";
import { useAuth } from "../auth/AuthContext.js";
import { NotificationBell } from "../notifications/NotificationBell.js";
import { usePracticeMode } from "../practice/PracticeModeContext.js";
import { PracticeToolbar } from "../practice/PracticeToolbar.js";
import { LayoutShiftBanner } from "../practice/LayoutShiftBanner.js";
import { usePracticeTestId, useConsoleNoise } from "../practice/helpers.js";
import {
  BarChartIcon,
  CreditCardIcon,
  DashboardIcon,
  LogoutIcon,
  MapPinIcon,
  PackageIcon,
  ShieldIcon,
  TruckIcon,
} from "../ui/icons.js";

interface NavItem {
  label: string;
  roles: Role[];
  href: string;
  icon: ComponentType<Omit<FontAwesomeIconProps, "icon">>;
}

const PUBLIC_ONLY_PATHS = new Set(["/login", "/register"]);

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", roles: ["admin", "dispatcher", "driver", "customer"], href: "/", icon: DashboardIcon },
  { label: "Book a shipment", roles: ["admin", "dispatcher", "customer"], href: "/book", icon: PackageIcon },
  { label: "Tracking", roles: ["admin", "dispatcher", "driver", "customer"], href: "/tracking", icon: MapPinIcon },
  { label: "Fleet & scheduling", roles: ["admin", "dispatcher"], href: "/fleet", icon: TruckIcon },
  { label: "Billing", roles: ["admin", "customer"], href: "/billing", icon: CreditCardIcon },
  { label: "Admin console", roles: ["admin"], href: "/admin", icon: ShieldIcon },
  { label: "Reporting", roles: ["admin", "dispatcher"], href: "/reporting", icon: BarChartIcon },
];

// Nav items whose href gets swapped for a dead route when `brokenLinks` is on —
// a small, fixed set so the rest of the nav stays navigable.
const BROKEN_LINK_LABELS = new Set(["Tracking", "Billing"]);

function NavLinkItem({ item, active }: { item: NavItem; active: boolean }) {
  const { toggles } = usePracticeMode();
  const testId = usePracticeTestId(`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`);
  const href = toggles.brokenLinks && BROKEN_LINK_LABELS.has(item.label) ? "/practice-broken-link" : item.href;
  const Icon = item.icon;
  return (
    <Link
      to={href}
      data-testid={testId}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="w-[15px] shrink-0" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function Logomark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-[22px] w-[22px] shrink-0 rounded-md bg-brand-500" />
      <span className={`text-[15.5px] font-bold tracking-tight ${light ? "text-white" : "text-ink-900"}`}>
        SwiftCargo
      </span>
    </div>
  );
}

export function NavShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { toggles, sessionEpoch } = usePracticeMode();
  useConsoleNoise(toggles.consoleNoise, sessionEpoch);

  if (!user || PUBLIC_ONLY_PATHS.has(location.pathname)) {
    return (
      <div className="min-h-screen bg-surface">
        {children}
        <PracticeToolbar />
      </div>
    );
  }

  const crumb = NAV_ITEMS.find((item) => item.href === location.pathname)?.label ?? "dashboard";

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-[208px] flex-col overflow-y-auto bg-ink-900 py-4">
        <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 pb-4">
          <Logomark light />
        </div>
        <nav aria-label="Primary" className="flex flex-col gap-0.5 px-2.5 py-3">
          {NAV_ITEMS.filter((item) => item.roles.includes(user.role)).map((item) => (
            <NavLinkItem key={item.href} item={item} active={location.pathname === item.href} />
          ))}
        </nav>
        <div className="mt-auto border-t border-white/[0.08] px-4 pt-3.5">
          <div className="font-mono text-[9.5px] tracking-[0.12em] text-white/40">ROLE</div>
          <div className="mt-1 text-xs font-medium text-white/80">
            {user.role} &middot; {user.email}
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-2 flex items-center gap-1.5 rounded-md bg-brand-500 px-2.5 py-1.5 font-mono text-[10.5px] text-white transition-colors hover:bg-brand-600"
          >
            <LogoutIcon className="w-[11px]" aria-hidden="true" />
            log out
          </button>
        </div>
      </aside>

      <div className="flex h-screen min-w-0 flex-col pl-[208px]">
        <header className="flex h-[50px] shrink-0 items-center gap-4 border-b border-hairline bg-white px-6">
          <span className="font-mono text-[11.5px] text-muted">swiftcargo / {crumb}</span>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>
        <LayoutShiftBanner />
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
      <PracticeToolbar />
    </div>
  );
}
