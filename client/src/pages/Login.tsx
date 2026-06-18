import { useState } from "react";
import { useAuth } from "../auth";

export default function Login() {
  const { login, register, guest } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(username, password);
      else await register(username, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-5xl mb-2">✊✋✌️</div>
      <h1 className="text-3xl font-bold mb-1">Rock Paper Scissors</h1>
      <p className="text-white/50 mb-6">Realtime multiplayer · self-hosted</p>

      <form onSubmit={submit} className="card p-6 w-full max-w-sm flex flex-col gap-3">
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-1 rounded ${mode === "login" ? "bg-white/15" : "bg-transparent text-white/50"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 py-1 rounded ${mode === "register" ? "bg-white/15" : "bg-transparent text-white/50"}`}
          >
            Create account
          </button>
        </div>

        <input
          className="bg-black/30 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-teal-500"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <input
          className="bg-black/30 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-teal-500"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button className="btn-primary" disabled={busy}>
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="mt-4 flex items-center gap-3 text-white/40 text-sm">
        <span>or</span>
      </div>
      <button
        className="btn-ghost mt-3"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await guest();
          } catch (err: any) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Play as guest
      </button>
      <p className="text-white/30 text-xs mt-6">Demo account: demo / demo1234</p>
    </div>
  );
}
