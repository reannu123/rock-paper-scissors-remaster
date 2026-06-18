import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-white/10">
      <Link to="/" className="text-lg font-bold tracking-tight">
        ✊✋✌️ RPS
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link to="/leaderboard" className="text-white/70 hover:text-white">
          Leaderboard
        </Link>
        <span className="hidden sm:inline text-white/50">
          {user.username}
          {user.isGuest ? " (guest)" : ` · ${user.elo}`}
        </span>
        <button
          className="btn-ghost text-sm py-1"
          onClick={async () => {
            await logout();
            navigate("/");
          }}
        >
          Sign out
        </button>
      </nav>
    </header>
  );
}
