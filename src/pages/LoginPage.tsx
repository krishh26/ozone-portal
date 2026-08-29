import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { IconButton } from "../components/IconButton";
import { LogInIcon } from "../components/icons";
import { Footer } from "../layout/Footer";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate("/inquiries", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="grid flex-1 place-items-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5"
      >
        <p className="text-sm font-semibold tracking-wide text-amber-800">
          MADHURAM OZONE
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Clinic portal</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in to view website contact inquiries and appointment requests.
        </p>

        {error ? (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <label className="mt-6 block text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-amber-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-amber-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <IconButton
          type="submit"
          variant="primary"
          icon={<LogInIcon />}
          label={loading ? "Signing in…" : "Sign in"}
          disabled={loading}
          className="mt-6 w-full"
        />
      </form>
      </div>
      <Footer />
    </div>
  );
}
