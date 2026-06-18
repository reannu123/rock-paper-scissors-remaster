// Server-authoritative realtime RPS over Socket.IO. Replaces the old Firebase
// Realtime DB + standalone matchmaking worker. All live state (queues, active
// matches) lives in memory; only finished matches + ELO are persisted.
import { prisma } from "./db.js";
import {
  isValidMove,
  resolveRound,
  computeElo,
  ROUNDS_TO_WIN,
} from "./gameLogic.js";

// mode -> array of waiting { socketId, userId, username }
const queues = { casual: [], ranked: [] };
// matchId -> match state
const matches = new Map();
// socketId -> matchId (fast lookup for moves/disconnect)
const socketMatch = new Map();

let matchCounter = 0;
const newMatchId = () => `m${++matchCounter}_${Date.now()}`;

function removeFromQueues(socketId) {
  for (const mode of Object.keys(queues)) {
    queues[mode] = queues[mode].filter((p) => p.socketId !== socketId);
  }
}

function matchSnapshot(match, forUserId) {
  const me = match.players.find((p) => p.userId === forUserId);
  const opp = match.players.find((p) => p.userId !== forUserId);
  return {
    matchId: match.id,
    mode: match.mode,
    roundsToWin: ROUNDS_TO_WIN,
    you: { username: me.username, score: me.score },
    opponent: { username: opp.username, score: opp.score },
    round: match.roundNum,
  };
}

export function registerGame(io) {
  // Each socket carries the express session (shared via io.engine.use).
  io.on("connection", async (socket) => {
    const userId = socket.request.session?.userId;
    if (!userId) {
      socket.emit("error:auth", "Not authenticated.");
      socket.disconnect(true);
      return;
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      socket.disconnect(true);
      return;
    }

    socket.on("queue:join", ({ mode }) => {
      if (!queues[mode]) return;
      if (socketMatch.has(socket.id)) return; // already in a match
      removeFromQueues(socket.id);
      // Guard against queueing twice from two tabs of the same account.
      if (queues[mode].some((p) => p.userId === userId)) return;
      queues[mode].push({ socketId: socket.id, userId, username: user.username });
      socket.emit("queue:waiting", { mode });
      tryMatch(io, mode);
    });

    socket.on("queue:leave", () => {
      removeFromQueues(socket.id);
      socket.emit("queue:left");
    });

    socket.on("move:submit", ({ move }) => {
      const matchId = socketMatch.get(socket.id);
      if (!matchId || !isValidMove(move)) return;
      const match = matches.get(matchId);
      if (!match) return;
      const player = match.players.find((p) => p.socketId === socket.id);
      if (!player || player.currentMove) return; // already moved this round
      player.currentMove = move;
      socket.emit("move:locked", { move });
      const opp = match.players.find((p) => p.socketId !== socket.id);
      io.to(opp.socketId).emit("opponent:moved");
      if (match.players.every((p) => p.currentMove)) {
        resolveAndAdvance(io, match);
      }
    });

    socket.on("match:rematch", () => {
      const matchId = socketMatch.get(socket.id);
      const match = matches.get(matchId);
      if (!match) return;
      const player = match.players.find((p) => p.socketId === socket.id);
      player.wantsRematch = true;
      const opp = match.players.find((p) => p.socketId !== socket.id);
      io.to(opp.socketId).emit("opponent:rematch");
      if (match.players.every((p) => p.wantsRematch)) {
        resetMatch(io, match);
      }
    });

    socket.on("match:leave", () => leaveMatch(io, socket.id, "left"));

    socket.on("disconnect", () => {
      removeFromQueues(socket.id);
      leaveMatch(io, socket.id, "disconnected");
    });
  });
}

function tryMatch(io, mode) {
  const q = queues[mode];
  while (q.length >= 2) {
    const a = q.shift();
    const b = q.shift();
    const match = {
      id: newMatchId(),
      mode,
      players: [
        { ...a, score: 0, currentMove: null, wantsRematch: false },
        { ...b, score: 0, currentMove: null, wantsRematch: false },
      ],
      rounds: [],
      roundNum: 1,
      over: false,
    };
    matches.set(match.id, match);
    socketMatch.set(a.socketId, match.id);
    socketMatch.set(b.socketId, match.id);
    io.sockets.sockets.get(a.socketId)?.join(match.id);
    io.sockets.sockets.get(b.socketId)?.join(match.id);
    io.to(a.socketId).emit("match:found", matchSnapshot(match, a.userId));
    io.to(b.socketId).emit("match:found", matchSnapshot(match, b.userId));
  }
}

function resolveAndAdvance(io, match) {
  const [p1, p2] = match.players;
  const result = resolveRound(p1.currentMove, p2.currentMove); // p1 | p2 | draw
  if (result === "p1") p1.score++;
  else if (result === "p2") p2.score++;

  match.rounds.push({ p1: p1.currentMove, p2: p2.currentMove, result });

  // Per-player view of the round result.
  for (const p of match.players) {
    const opp = match.players.find((x) => x !== p);
    const youWon = (result === "p1" && p === p1) || (result === "p2" && p === p2);
    io.to(p.socketId).emit("round:result", {
      yourMove: p.currentMove,
      opponentMove: opp.currentMove,
      outcome: result === "draw" ? "draw" : youWon ? "win" : "loss",
      yourScore: p.score,
      opponentScore: opp.score,
      round: match.roundNum,
    });
  }

  p1.currentMove = null;
  p2.currentMove = null;

  if (p1.score >= ROUNDS_TO_WIN || p2.score >= ROUNDS_TO_WIN) {
    endMatch(io, match);
  } else {
    match.roundNum++;
  }
}

async function endMatch(io, match) {
  match.over = true;
  const [p1, p2] = match.players;
  const winner = p1.score > p2.score ? p1 : p2;

  let eloDelta = null;
  if (match.mode === "ranked") {
    try {
      const u1 = await prisma.user.findUnique({ where: { id: p1.userId } });
      const u2 = await prisma.user.findUnique({ where: { id: p2.userId } });
      const scoreP1 = winner === p1 ? 1 : 0;
      const elo = computeElo(u1.elo, u2.elo, scoreP1);
      eloDelta = elo.delta;
      await prisma.user.update({
        where: { id: p1.userId },
        data: {
          elo: elo.a,
          wins: { increment: winner === p1 ? 1 : 0 },
          losses: { increment: winner === p1 ? 0 : 1 },
        },
      });
      await prisma.user.update({
        where: { id: p2.userId },
        data: {
          elo: elo.b,
          wins: { increment: winner === p2 ? 1 : 0 },
          losses: { increment: winner === p2 ? 0 : 1 },
        },
      });
    } catch (e) {
      console.error("ELO update failed:", e);
    }
  }

  try {
    await prisma.match.create({
      data: {
        mode: match.mode,
        player1Id: p1.userId,
        player2Id: p2.userId,
        player1Score: p1.score,
        player2Score: p2.score,
        winnerId: winner.userId,
        rounds: match.rounds,
        eloDelta,
        endedAt: new Date(),
      },
    });
  } catch (e) {
    console.error("Match persist failed:", e);
  }

  for (const p of match.players) {
    io.to(p.socketId).emit("match:over", {
      youWon: p === winner,
      yourScore: p.score,
      opponentScore: match.players.find((x) => x !== p).score,
      eloDelta:
        match.mode === "ranked" && eloDelta != null
          ? p === p1
            ? eloDelta
            : -eloDelta
          : null,
    });
  }
}

function resetMatch(io, match) {
  for (const p of match.players) {
    p.score = 0;
    p.currentMove = null;
    p.wantsRematch = false;
  }
  match.rounds = [];
  match.roundNum = 1;
  match.over = false;
  for (const p of match.players) {
    io.to(p.socketId).emit("match:found", matchSnapshot(match, p.userId));
  }
}

function leaveMatch(io, socketId, reason) {
  const matchId = socketMatch.get(socketId);
  if (!matchId) return;
  const match = matches.get(matchId);
  socketMatch.delete(socketId);
  if (!match) return;
  const opp = match.players.find((p) => p.socketId !== socketId);
  if (opp && !match.over) {
    io.to(opp.socketId).emit("opponent:left", { reason });
  }
  // Tear the match down; both players return to the menu.
  for (const p of match.players) {
    socketMatch.delete(p.socketId);
    io.sockets.sockets.get(p.socketId)?.leave(match.id);
  }
  matches.delete(match.id);
}
