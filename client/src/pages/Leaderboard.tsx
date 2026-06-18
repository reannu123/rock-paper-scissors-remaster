import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

type Row = { username: string; elo: number; wins: number; losses: number; draws: number };

export default function Leaderboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ leaderboard: Row[] }>("/api/leaderboard")
      .then((d) => setRows(d.leaderboard))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Leaderboard 🏆</h1>
        <button onClick={() => navigate("/")} className="text-white/50 hover:text-white text-sm">← Menu</button>
      </div>
      {error && <p className="text-red-400">{error}</p>}
      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead className="text-white/40 text-xs uppercase">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Player</th>
              <th className="px-4 py-2 text-right">ELO</th>
              <th className="px-4 py-2 text-right">W/L/D</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.username} className="border-t border-white/5">
                <td className="px-4 py-2 text-white/50">{i + 1}</td>
                <td className="px-4 py-2 font-medium">{r.username}</td>
                <td className="px-4 py-2 text-right font-bold">{r.elo}</td>
                <td className="px-4 py-2 text-right text-white/60 text-sm">
                  {r.wins}/{r.losses}/{r.draws}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !error && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-white/40">No ranked players yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
