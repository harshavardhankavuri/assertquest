import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Alert, Button, Card, FormField, TextInput } from "@assertquest/shared/ui";
import { useAuth, ApiRequestError } from "./AuthContext.js";

export function RegisterPage() {
  const { register } = useAuth();
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
      await register({ email, password });
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
        <h1 className="mb-2 font-display text-2xl font-semibold text-navy-900">Create a AssertQuest account</h1>
        <p className="mb-6 text-sm text-navy-500">
          Free, tracks your cleared challenges across modules. No real personal data required.
        </p>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <FormField label="Email" htmlFor="register-email">
            <TextInput
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <FormField label="Password" htmlFor="register-password">
            <TextInput
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? "Creating account…" : "Register"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-navy-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-teal-700 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </main>
  );
}
