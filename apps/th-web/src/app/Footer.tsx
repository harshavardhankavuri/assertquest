import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-mist-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="font-display text-base font-semibold tracking-tight text-navy-900">AssertQuest</span>
          <p className="mt-2 max-w-xs text-sm text-navy-500">
            Free, self-hostable practice for automation testers — API, DB, and UI, against a realistic enterprise app.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-wide text-navy-400">Practice</span>
            <Link to="/challenges" className="text-navy-600 hover:text-teal-700">
              Challenge Board
            </Link>
            <Link to="/leaderboard" className="text-navy-600 hover:text-teal-700">
              Leaderboard
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-wide text-navy-400">Community</span>
            <Link to="/community" className="text-navy-600 hover:text-teal-700">
              Community
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-wide text-navy-400">Reference</span>
            <a href="/docs" target="_blank" rel="noreferrer" className="text-navy-600 hover:text-teal-700">
              API docs
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-wide text-navy-400">Run it yourself</span>
            <Link to="/self-host" className="text-navy-600 hover:text-teal-700">
              Self-host guide
            </Link>
          </div>
        </nav>
      </div>
    </footer>
  );
}
