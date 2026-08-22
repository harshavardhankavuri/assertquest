import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Alert, Button, FormField, TextInput } from "../ui/index.js";
import { useAuth, ApiRequestError } from "./AuthContext.js";
import { usePracticeTestId } from "../practice/helpers.js";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailTestId = usePracticeTestId("login-email");
  const passwordTestId = usePracticeTestId("login-password");
  const submitTestId = usePracticeTestId("login-submit");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="flex flex-col justify-center px-8 py-14 md:px-16">
        <div className="flex items-center gap-2.5">
          <div className="h-[26px] w-[26px] rounded-md bg-brand-500" />
          <span className="text-lg font-bold tracking-tight text-ink-900">SwiftCargo</span>
        </div>
        <h1 className="mt-7 text-[30px] font-bold tracking-tight text-ink-900">Sign in</h1>
        <p className="mt-1.5 text-sm text-muted">Auth practice module — four roles, JWT + refresh.</p>

        <form onSubmit={onSubmit} noValidate className="mt-6 flex max-w-sm flex-col gap-3">
          <FormField label="Email" htmlFor="login-email">
            <TextInput
              id="login-email"
              data-testid={emailTestId}
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <FormField label="Password" htmlFor="login-password">
            <TextInput
              id="login-password"
              data-testid={passwordTestId}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" data-testid={submitTestId} disabled={submitting} className="mt-1 w-full">
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          <p className="font-mono text-[11px] text-faint">401 on expired token &middot; 403 on insufficient role</p>
        </form>

        <p className="mt-6 text-sm text-muted">
          Need an account?{" "}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            Register
          </Link>
        </p>
      </div>

      <div className="hidden flex-col justify-center bg-ink-900 px-16 py-14 md:flex">
        <div className="font-mono text-[10.5px] tracking-[0.14em] text-muted">SWIFTCARGO &middot; RBAC PRACTICE</div>
        <div className="mt-5 flex max-w-sm flex-col gap-2.5">
          {["Admin", "Dispatcher", "Driver", "Customer"].map((role) => (
            <div key={role} className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-sm font-semibold text-white">{role}</div>
              <div className="mt-0.5 text-xs text-muted">Distinct route access &amp; UI affordances per role.</div>
            </div>
          ))}
        </div>
        <div className="mt-6 font-mono text-[11.5px] leading-7 text-white/30">
          POST /api/auth/login
          <br />
          &rarr; access 15m &middot; refresh 7d
        </div>
      </div>
    </div>
  );
}
