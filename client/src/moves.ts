// Shared move metadata + the same rules the server uses (for local VS-AI).
export type Move = "rock" | "paper" | "scissors";
export const MOVES: Move[] = ["rock", "paper", "scissors"];
export const EMOJI: Record<Move, string> = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
};
const WINS_AGAINST: Record<Move, Move> = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
};

export function resolveRound(a: Move, b: Move): "win" | "loss" | "draw" {
  if (a === b) return "draw";
  return WINS_AGAINST[a] === b ? "win" : "loss";
}
export function randomMove(): Move {
  return MOVES[Math.floor(Math.random() * MOVES.length)];
}
