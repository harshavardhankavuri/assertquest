import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ROLES, type Role } from "@assertquest/shared";
import { Alert, Button, Card, FormField, SelectInput, TextInput } from "../ui/index.js";
import { useAuth, ApiRequestError } from "./AuthContext.js";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, password, role });
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="mb-7 flex items-center gap-2.5">
        <div className="h-[26px] w-[26px] rounded-md bg-brand-500" />
        <span className="text-lg font-bold tracking-tight text-ink-900">SwiftCargo</span>
      </div>
      <Card>
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-ink-900">Create an account</h1>
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
          <FormField label="Role" htmlFor="register-role">
            <SelectInput
              id="register-role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </SelectInput>
          </FormField>
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? "Creating account…" : "Register"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </main>
  );
}
