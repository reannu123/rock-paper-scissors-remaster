import { Link } from "react-router-dom";

export default function PlayMenu() {
  return (
    <div className="w-full max-w-md text-center">
      <h1 className="text-2xl font-bold mb-6">Play online</h1>
      <div className="grid gap-4">
        <Link to="/play/casual" className="card p-6 hover:bg-white/10 transition-all text-left">
          <div className="text-xl font-semibold">Casual 🎲</div>
          <div className="text-white/50 text-sm">
            Just for fun. Results are saved but don't affect your rating.
          </div>
        </Link>
        <Link to="/play/ranked" className="card p-6 hover:bg-white/10 transition-all text-left">
          <div className="text-xl font-semibold">Ranked 📈</div>
          <div className="text-white/50 text-sm">
            Win to climb the ELO ladder. Losses cost rating.
          </div>
        </Link>
      </div>
      <Link to="/" className="inline-block mt-6 text-white/50 hover:text-white text-sm">
        ← Back
      </Link>
    </div>
  );
}
