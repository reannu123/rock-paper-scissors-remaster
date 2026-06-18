import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../api";
import { EMOJI, MOVES, Move } from "../moves";

type Phase = "searching" | "playing" | "revealed" | "over" | "left";

type RoundResult = {
  yourMove: Move;
  opponentMove: Move;
  outcome: "win" | "loss" | "draw";
};

export default function Match({ mode }: { mode: "casual" | "ranked" }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("searching");
  const [opponent, setOpponent] = useState("");
  const [scores, setScores] = useState({ you: 0, opp: 0 });
  const [round, setRound] = useState(1);
  const [yourMove, setYourMove] = useState<Move | null>(null);
  const [opponentMoved, setOpponentMoved] = useState(false);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [final, setFinal] = useState<{ won: boolean; eloDelta: number | null } | null>(null);
  const [oppRematch, setOppRematch] = useState(false);
  const [youRematch, setYouRematch] = useState(false);
  const [leftReason, setLeftReason] = useState("");

  const overRef = useRef(false);
  const leftRef = useRef(false);

  useEffect(() => {
    const socket = getSocket();
    overRef.current = false;
    leftRef.current = false;

    const onWaiting = () => setPhase("searching");
    const onFound = (snap: any) => {
      overRef.current = false;
      leftRef.current = false;
      setOpponent(snap.opponent.username);
      setScores({ you: snap.you.score, opp: snap.opponent.score });
      setRound(snap.round);
      setYourMove(null);
      setOpponentMoved(false);
      setResult(null);
      setFinal(null);
      setOppRematch(false);
      setYouRematch(false);
      setPhase("playing");
    };
    const onOpponentMoved = () => setOpponentMoved(true);
    const onRoundResult = (r: any) => {
      setScores({ you: r.yourScore, opp: r.opponentScore });
      setResult({ yourMove: r.yourMove, opponentMove: r.opponentMove, outcome: r.outcome });
      setPhase("revealed");
      setTimeout(() => {
        if (overRef.current || leftRef.current) return;
        setYourMove(null);
        setOpponentMoved(false);
        setResult(null);
        setRound((n) => n + 1);
        setPhase("playing");
      }, 1700);
    };
    const onOver = (o: any) => {
      overRef.current = true;
      setFinal({ won: o.youWon, eloDelta: o.eloDelta });
      setScores({ you: o.yourScore, opp: o.opponentScore });
      setPhase("over");
    };
    const onOppLeft = (e: any) => {
      leftRef.current = true;
      setLeftReason(e.reason || "left");
      setPhase("left");
    };
    const onOppRematch = () => setOppRematch(true);

    socket.on("queue:waiting", onWaiting);
    socket.on("match:found", onFound);
    socket.on("opponent:moved", onOpponentMoved);
    socket.on("round:result", onRoundResult);
    socket.on("match:over", onOver);
    socket.on("opponent:left", onOppLeft);
    socket.on("opponent:rematch", onOppRematch);

    socket.emit("queue:join", { mode });

    return () => {
      socket.emit("match:leave");
      socket.emit("queue:leave");
      socket.off("queue:waiting", onWaiting);
      socket.off("match:found", onFound);
      socket.off("opponent:moved", onOpponentMoved);
      socket.off("round:result", onRoundResult);
      socket.off("match:over", onOver);
      socket.off("opponent:left", onOppLeft);
      socket.off("opponent:rematch", onOppRematch);
    };
  }, [mode]);

  function play(m: Move) {
    if (phase !== "playing" || yourMove) return;
    setYourMove(m);
    getSocket().emit("move:submit", { move: m });
  }
  function rematch() {
    setYouRematch(true);
    getSocket().emit("match:rematch");
  }

  const title = mode === "ranked" ? "Ranked" : "Casual";

  return (
    <div className="w-full max-w-lg text-center">
      <div className="flex items-center justify-between mb-4 text-sm text-white/50">
        <button onClick={() => navigate("/")} className="hover:text-white">← Leave</button>
        <span className="uppercase tracking-wide">{title} · Best of 5</span>
      </div>

      {phase === "searching" && (
        <div className="card p-10">
          <div className="text-2xl mb-2 animate-pulse">Finding an opponent…</div>
          <p className="text-white/50 text-sm">
            Open a second window and queue as another user to get matched.
          </p>
        </div>
      )}

      {phase === "left" && (
        <div className="card p-10">
          <div className="text-2xl mb-3">Opponent {leftReason} 🚪</div>
          <button className="btn-primary" onClick={() => navigate("/")}>Back to menu</button>
        </div>
      )}

      {(phase === "playing" || phase === "revealed" || phase === "over") && (
        <div className="card p-6">
          <Scoreboard you={scores.you} opp={scores.opp} opponent={opponent} round={round} />

          <div className="my-6 min-h-[7rem] flex items-center justify-center">
            {phase === "revealed" && result ? (
              <div className="flex items-center justify-center gap-8 animate-pop">
                <div className="text-center">
                  <div className="text-6xl">{EMOJI[result.yourMove]}</div>
                  <div className="text-xs text-white/50 mt-1">you</div>
                </div>
                <div
                  className={
                    result.outcome === "win"
                      ? "text-green-400 font-bold"
                      : result.outcome === "loss"
                      ? "text-red-400 font-bold"
                      : "text-yellow-300 font-bold"
                  }
                >
                  {result.outcome === "win" ? "WIN" : result.outcome === "loss" ? "LOSE" : "DRAW"}
                </div>
                <div className="text-center">
                  <div className="text-6xl">{EMOJI[result.opponentMove]}</div>
                  <div className="text-xs text-white/50 mt-1">{opponent}</div>
                </div>
              </div>
            ) : phase === "over" && final ? (
              <div className="text-center animate-pop">
                <div className={`text-4xl font-extrabold ${final.won ? "text-green-400" : "text-red-400"}`}>
                  {final.won ? "You win! 🏆" : "You lose 😵"}
                </div>
                {final.eloDelta != null && (
                  <div className="text-white/60 mt-1">
                    ELO {final.eloDelta >= 0 ? "+" : ""}
                    {final.eloDelta}
                  </div>
                )}
              </div>
            ) : yourMove ? (
              <div className="text-white/60">
                You played {EMOJI[yourMove]} —{" "}
                {opponentMoved ? "resolving…" : "waiting for opponent…"}
              </div>
            ) : (
              <div className="text-white/60">Make your move</div>
            )}
          </div>

          {phase === "playing" && (
            <div className="flex justify-center gap-3">
              {MOVES.map((m) => (
                <button
                  key={m}
                  disabled={!!yourMove}
                  onClick={() => play(m)}
                  className="btn-ghost text-4xl px-5 py-3 disabled:opacity-30"
                  title={m}
                >
                  {EMOJI[m]}
                </button>
              ))}
            </div>
          )}

          {phase === "over" && (
            <div className="flex flex-col items-center gap-2 mt-2">
              <button className="btn-primary" onClick={rematch} disabled={youRematch}>
                {youRematch ? "Waiting for opponent…" : "Rematch"}
              </button>
              {oppRematch && !youRematch && (
                <p className="text-teal-300 text-sm">Opponent wants a rematch!</p>
              )}
              <button className="text-white/50 hover:text-white text-sm" onClick={() => navigate("/")}>
                Back to menu
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Scoreboard({ you, opp, opponent, round }: { you: number; opp: number; opponent: string; round: number }) {
  return (
    <div className="flex items-center justify-between text-lg">
      <div className="flex-1 text-left">
        <div className="text-white/50 text-xs">You</div>
        <div className="text-3xl font-bold">{you}</div>
      </div>
      <div className="text-white/40 text-sm">Round {round}</div>
      <div className="flex-1 text-right">
        <div className="text-white/50 text-xs">{opponent}</div>
        <div className="text-3xl font-bold">{opp}</div>
      </div>
    </div>
  );
}
