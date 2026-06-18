// Pure, framework-free Rock Paper Scissors rules + ELO. Easy to unit-test and
// the single source of truth for who-beats-whom on the server.

export const MOVES = ["rock", "paper", "scissors"];
export const WINS_AGAINST = { rock: "scissors", paper: "rock", scissors: "paper" };

/** Best-of-5 => first to 3 round wins. */
export const ROUNDS_TO_WIN = 3;

export function isValidMove(move) {
  return MOVES.includes(move);
}

/**
 * Resolve one round.
 * @returns {"p1"|"p2"|"draw"}
 */
export function resolveRound(p1Move, p2Move) {
  if (p1Move === p2Move) return "draw";
  return WINS_AGAINST[p1Move] === p2Move ? "p1" : "p2";
}

/** A random legal move — used by the VS-AI opponent and as a fallback. */
export function randomMove() {
  return MOVES[Math.floor(Math.random() * MOVES.length)];
}

/**
 * Standard ELO update.
 * @param {number} ratingA  current rating of player A
 * @param {number} ratingB  current rating of player B
 * @param {number} scoreA   1 = A won, 0 = A lost, 0.5 = draw
 * @param {number} k        K-factor (volatility)
 * @returns {{ a: number, b: number, delta: number }} new ratings + points moved
 */
export function computeElo(ratingA, ratingB, scoreA, k = 32) {
  const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
  const delta = Math.round(k * (scoreA - expectedA));
  return { a: ratingA + delta, b: ratingB - delta, delta };
}
