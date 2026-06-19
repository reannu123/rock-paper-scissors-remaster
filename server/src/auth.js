// Session-based auth: express-session backed by Postgres (connect-pg-simple),
// bcrypt password hashing, and one-click guest accounts. No JWT, no Firebase.
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import bcrypt from "bcryptjs";
import express from "express";
import { prisma } from "./db.js";

const PgStore = connectPgSimple(session);

// A small pg pool just for the session store (Prisma owns the rest).
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const sessionMiddleware = session({
  store: new PgStore({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || "dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    // false for local http; set COOKIE_SECURE=true when serving over HTTPS.
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
});

// Public shape of a user (never leak the password hash).
export function publicUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

export async function getSessionUser(req) {
  const id = req.session?.userId;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

const GUEST_ADJ = ["Quick", "Lucky", "Sly", "Bold", "Calm", "Wily", "Brave"];
const GUEST_NOUN = ["Fox", "Crane", "Tiger", "Otter", "Hawk", "Panda", "Wolf"];
function guestName() {
  const a = GUEST_ADJ[Math.floor(Math.random() * GUEST_ADJ.length)];
  const n = GUEST_NOUN[Math.floor(Math.random() * GUEST_NOUN.length)];
  return `${a}${n}${Math.floor(1000 + Math.random() * 9000)}`;
}

export const authRouter = express.Router();

authRouter.post("/register", async (req, res) => {
  const { username, password, email } = req.body || {};
  if (!username || !password || username.length < 2 || password.length < 6) {
    return res
      .status(400)
      .json({ error: "Username (2+) and password (6+) required." });
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return res.status(409).json({ error: "Username taken." });
  const user = await prisma.user.create({
    data: {
      username,
      email: email || null,
      password: bcrypt.hashSync(password, 10),
    },
  });
  req.session.userId = user.id;
  res.json({ user: publicUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid username or password." });
  }
  req.session.userId = user.id;
  res.json({ user: publicUser(user) });
});

authRouter.post("/guest", async (req, res) => {
  let username = guestName();
  // Retry once on the (very unlikely) name collision.
  if (await prisma.user.findUnique({ where: { username } })) {
    username = guestName();
  }
  const user = await prisma.user.create({
    data: { username, isGuest: true },
  });
  req.session.userId = user.id;
  res.json({ user: publicUser(user) });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});
