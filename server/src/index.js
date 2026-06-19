import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "./db.js";
import {
  sessionMiddleware,
  authRouter,
  getSessionUser,
  publicUser,
} from "./auth.js";
import { registerGame } from "./game.js";

const PORT = process.env.SERVER_PORT || 4000;
const ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:8080";

const app = express();
app.set("trust proxy", 1);
// Secure headers. Allow cross-origin resource policy because the client is
// served from a different origin (nginx :8080) than this API (:4000).
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "10kb" })); // cap body size
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(sessionMiddleware);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Throttle auth endpoints to blunt credential stuffing / guest-spam.
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please slow down." },
});
app.use("/api/auth", authLimiter, authRouter);

app.get("/api/me", async (req, res) => {
  const user = await getSessionUser(req);
  res.json({ user: publicUser(user) });
});

app.get("/api/leaderboard", async (_req, res) => {
  const users = await prisma.user.findMany({
    where: { isGuest: false },
    orderBy: { elo: "desc" },
    take: 20,
    select: { username: true, elo: true, wins: true, losses: true, draws: true },
  });
  res.json({ leaderboard: users });
});

app.get("/api/history", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated." });
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ player1Id: user.id }, { player2Id: user.id }],
      endedAt: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      player1: { select: { username: true } },
      player2: { select: { username: true } },
    },
  });
  res.json({ history: matches });
});

// Record a finished VS-AI game (client-resolved, unranked).
app.post("/api/match/ai", async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Not authenticated." });
  const { playerScore, aiScore, rounds } = req.body || {};
  const match = await prisma.match.create({
    data: {
      mode: "ai",
      player1Id: user.id,
      player2Id: null,
      player1Score: Number(playerScore) || 0,
      player2Score: Number(aiScore) || 0,
      winnerId: (Number(playerScore) || 0) > (Number(aiScore) || 0) ? user.id : null,
      rounds: Array.isArray(rounds) ? rounds : null,
      endedAt: new Date(),
    },
  });
  res.json({ match });
});

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: ORIGIN, credentials: true },
});
// Share the express session with every socket handshake.
io.engine.use(sessionMiddleware);
registerGame(io);

server.listen(PORT, () => {
  console.log(`RPS server listening on :${PORT} (client origin ${ORIGIN})`);
});
