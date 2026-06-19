// Unit tests for the pure game rules + ELO. Run with: npm test  (node --test)
import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveRound,
  computeElo,
  isValidMove,
  randomMove,
  MOVES,
  ROUNDS_TO_WIN,
} from "../src/gameLogic.js";

test("rock/paper/scissors beat relationships", () => {
  assert.equal(resolveRound("rock", "scissors"), "p1");
  assert.equal(resolveRound("scissors", "paper"), "p1");
  assert.equal(resolveRound("paper", "rock"), "p1");
  assert.equal(resolveRound("scissors", "rock"), "p2");
  assert.equal(resolveRound("paper", "scissors"), "p2");
  assert.equal(resolveRound("rock", "paper"), "p2");
});

test("identical moves draw", () => {
  for (const m of MOVES) assert.equal(resolveRound(m, m), "draw");
});

test("resolveRound is consistent across all 9 combinations", () => {
  let p1 = 0,
    p2 = 0,
    draw = 0;
  for (const a of MOVES)
    for (const b of MOVES) {
      const r = resolveRound(a, b);
      if (r === "p1") p1++;
      else if (r === "p2") p2++;
      else draw++;
    }
  // Symmetric game: equal wins each side, one draw per move.
  assert.equal(p1, 3);
  assert.equal(p2, 3);
  assert.equal(draw, 3);
});

test("isValidMove guards input", () => {
  assert.ok(isValidMove("rock"));
  assert.ok(!isValidMove("dynamite"));
  assert.ok(!isValidMove(""));
  assert.ok(!isValidMove(undefined));
});

test("randomMove always returns a legal move", () => {
  for (let i = 0; i < 50; i++) assert.ok(MOVES.includes(randomMove()));
});

test("ELO is zero-sum and symmetric for equal ratings", () => {
  const win = computeElo(1000, 1000, 1);
  assert.equal(win.delta, 16); // K=32, expected 0.5 => 32*0.5
  assert.equal(win.a, 1016);
  assert.equal(win.b, 984);
  assert.equal(win.a + win.b, 2000); // conserved
});

test("ELO rewards beating a stronger opponent more", () => {
  const upset = computeElo(1000, 1400, 1); // weak beats strong
  const expected = computeElo(1400, 1000, 1); // strong beats weak
  assert.ok(upset.delta > expected.delta);
});

test("ELO draw nudges toward the stronger player's expectation", () => {
  const draw = computeElo(1000, 1400, 0.5); // underdog draws
  assert.ok(draw.delta > 0); // underdog gains on a draw
});

test("best-of-5 target is 3", () => {
  assert.equal(ROUNDS_TO_WIN, 3);
});
