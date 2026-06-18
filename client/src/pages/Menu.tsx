import { Link } from "react-router-dom";
import { useAuth } from "../auth";

export default function Menu() {
  const { user } = useAuth();
  return (
    <div className="w-full max-w-md text-center">
      <h1 className="text-3xl font-bold mb-1">Hi, {user?.username} 👋</h1>
      <p className="text-white/50 mb-8">Pick a mode and throw down.</p>
      <div className="grid gap-4">
        <Link to="/play" className="card p-6 hover:bg-white/10 transition-all text-left">
          <div className="text-xl font-semibold">Play online ⚔️</div>
          <div className="text-white/50 text-sm">
            Get matched with another player — Casual or Ranked, best of 5.
          </div>
        </Link>
        <Link to="/play/ai" className="card p-6 hover:bg-white/10 transition-all text-left">
          <div className="text-xl font-semibold">Vs AI 🤖</div>
          <div className="text-white/50 text-sm">
            Instant single-player match. No opponent needed.
          </div>
        </Link>
        <Link to="/leaderboard" className="card p-6 hover:bg-white/10 transition-all text-left">
          <div className="text-xl font-semibold">Leaderboard 🏆</div>
          <div className="text-white/50 text-sm">Top ranked players by ELO.</div>
        </Link>
      </div>
    </div>
  );
}
