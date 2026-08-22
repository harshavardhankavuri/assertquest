import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.js";
import { Footer } from "./Footer.js";

const NAV_LINKS = [
  { to: "/challenges", label: "Challenges" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/community", label: "Community" },
  { to: "/self-host", label: "Self-host" },
];

export function NavShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-foam-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-6 py-3.5">
          <Link to="/" className="flex items-center gap-2 font-display text-[15px] font-semibold tracking-tight text-white">
            <span className="h-[18px] w-[18px] shrink-0 rounded-md bg-teal-400" />
            AssertQuest
          </Link>
          <nav aria-label="Primary" className="flex-1">
            <ul className="flex flex-wrap gap-1">
              {NAV_LINKS.map((item) => {
                const active = location.pathname.startsWith(item.to);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      aria-current={active ? "page" : undefined}
                      className={`inline-block border-b-2 px-2 py-1.5 text-sm font-medium transition-colors ${
                        active
                          ? "border-teal-400 text-white"
                          : "border-transparent text-navy-200 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to={`/profile/${user.id}`} className="text-sm font-medium text-white hover:text-teal-300">
                  {user.displayName}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white transition-colors hover:border-white/30 hover:bg-white/5"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-1.5 text-sm text-navy-200 hover:text-white">
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-teal-500 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-teal-400"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
      <Footer />
    </div>
  );
}
