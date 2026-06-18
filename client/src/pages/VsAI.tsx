import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { EMOJI, MOVES, Move, randomMove, resolveRound } from "../moves";

const TARGET = 3; // best of 5

export default function VsAI() {
  const navigate = useNavigate();
  const [you, setYou] = useState(0);
  const [ai, setAi] = useState(0);
  const [round, setRound] = useState(1);
  const [reveal, setReveal] = useState<{ you: Move; ai: Move; outcome: string } | null>(null);
  const [over, setOver] = useState<null | boolean>(null);
  const [rounds, setRounds] = useState<any[]>([]);
  const [recorded, setRecorded] = useState(false);

  function play(move: Move) {
    if (reveal || over !== null) return;
    const aiMove = randomMove();
    const outcome = resolveRound(move, aiMove);
    const nextYou = you + (outcome === "win" ? 1 : 0);
    const nextAi = ai + (outcome === "loss" ? 1 : 0);
    const history = [...rounds, { p1: move, p2: aiMove, result: outcome }];
    setReveal({ you: move, ai: aiMove, outcome });
    setRounds(history);

    setTimeout(() => {
      setYou(nextYou);
      setAi(nextAi);
      setReveal(null);
      if (nextYou >= TARGET || nextAi >= TARGET) {
        const won = nextYou > nextAi;
        setOver(won);
        // Persist the AI match (unranked) — best effort.
        if (!recorded) {
          setRecorded(true);
          api("/api/match/ai", {
            method: "POST",
            body: JSON.stringify({ playerScore: nextYou, aiScore: nextAi, rounds: history }),
          }).catch(() => {});
        }
      } else {
        setRound((r) => r + 1);
      }
    }, 1200);
  }

  function reset() {
    setYou(0); setAi(0); setRound(1); setReveal(null); setOver(null);
    setRounds([]); setRecorded(false);
  }

  return (
    <div className="w-full max-w-lg text-center">
      <div className="flex items-center justify-between mb-4 text-sm text-white/50">
        <button onClick={() => navigate("/")} className="hover:text-white">← Leave</button>
        <span className="uppercase tracking-wide">Vs AI 🤖 · Best of 5</span>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between text-lg">
          <div className="flex-1 text-left">
            <div className="text-white/50 text-xs">You</div>
            <div className="text-3xl font-bold">{you}</div>
          </div>
          <div className="text-white/40 text-sm">Round {round}</div>
          <div className="flex-1 text-right">
            <div className="text-white/50 text-xs">AI</div>
            <div className="text-3xl font-bold">{ai}</div>
          </div>
        </div>

        <div className="my-6 min-h-[7rem] flex items-center justify-center">
          {reveal ? (
            <div className="flex items-center justify-center gap-8 animate-pop">
              <div><div className="text-6xl">{EMOJI[reveal.you]}</div><div className="text-xs text-white/50 mt-1">you</div></div>
              <div className={reveal.outcome === "win" ? "text-green-400 font-bold" : reveal.outcome === "loss" ? "text-red-400 font-bold" : "text-yellow-300 font-bold"}>
                {reveal.outcome === "win" ? "WIN" : reveal.outcome === "loss" ? "LOSE" : "DRAW"}
              </div>
              <div><div className="text-6xl">{EMOJI[reveal.ai]}</div><div className="text-xs text-white/50 mt-1">AI</div></div>
            </div>
          ) : over !== null ? (
            <div className={`text-4xl font-extrabold animate-pop ${over ? "text-green-400" : "text-red-400"}`}>
              {over ? "You win! 🏆" : "You lose 😵"}
            </div>
          ) : (
            <div className="text-white/60">Make your move</div>
          )}
        </div>

        {over === null ? (
          <div className="flex justify-center gap-3">
            {MOVES.map((m) => (
              <button key={m} disabled={!!reveal} onClick={() => play(m)} className="btn-ghost text-4xl px-5 py-3 disabled:opacity-30" title={m}>
                {EMOJI[m]}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button className="btn-primary" onClick={reset}>Play again</button>
            <button className="text-white/50 hover:text-white text-sm" onClick={() => navigate("/")}>Back to menu</button>
          </div>
        )}
      </div>
    </div>
  );
}
