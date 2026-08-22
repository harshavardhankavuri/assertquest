import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Alert, Button, Card, FormField, TextInput } from "@assertquest/shared/ui";
import { useAuth, ApiRequestError } from "./AuthContext.js";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <Card className="motion-safe:animate-fade-in-up">
        <h1 className="mb-6 font-display text-2xl font-semibold text-navy-900">Log in to AssertQuest</h1>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <FormField label="Email" htmlFor="login-email">
            <TextInput
              id="login-email"
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
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-navy-500">
          Need an account?{" "}
          <Link to="/register" className="font-medium text-teal-700 hover:underline">
            Register
          </Link>
        </p>
      </Card>
    </main>
  );
}
