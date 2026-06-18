# Architecture Decisions — RPS Remaster

Short ADR-style log of the choices made turning the 2023 Firebase prototype into
a self-hostable flagship. Context: the original was a React/Vite client backed by
Firebase Auth + Realtime Database, plus a standalone Node worker (`RPS-server`)
that watched the Firebase `queue/` node and paired players into `lobbies/`.

## 1. Move off Firebase entirely

**Decision:** Remove all Firebase/Google dependencies. The app must run fully
local with no cloud account or subscription.

**Why:** Portfolio piece must be clonable and runnable by anyone via Docker, and
demonstrate owning the full stack rather than renting a BaaS.

## 2. Postgres + Prisma for persistence

**Decision:** Postgres stores users, sessions, match history, and ELO. Prisma is
the ORM; migrations run automatically on container boot.

**Why:** Relational data (accounts, ranked stats, match records) fits SQL well,
and Postgres + Prisma is a credible, common production stack to showcase.

## 3. Socket.IO for realtime (replaces Realtime Database)

**Decision:** A Socket.IO server holds the live queue and active matches in
memory and pushes state to clients over WebSockets. The old standalone
matchmaking worker is folded into this server.

**Why:** The original leaned on Firebase RTDB listeners for queueing, lobby
state, ready flags, and moves. Socket.IO gives the same realtime push without a
cloud DB, with authoritative server-side game logic (the old client compared
moves itself — easy to cheat). One process now owns matchmaking + rules.

**Trade-off:** In-memory match state means a single instance. Documented scale
path: the Socket.IO Redis adapter + moving active-match state to Redis.

## 4. Session auth (replaces Firebase Auth; not hand-rolled JWT)

**Decision:** `express-session` with a Postgres session store
(`connect-pg-simple`) and bcrypt password hashing. Supports register / login /
logout and one-click **guest** accounts. The same session is shared with the
Socket.IO handshake so realtime connections are authenticated.

**Why:** The brief was to move away from Firebase Auth *and* away from the
manual-JWT approach used in BoredApp. Library-managed server-side sessions are
reliable, integrate cleanly with Socket.IO, store no secrets in the browser
(httpOnly cookie), and need no third-party service. `better-auth` was considered
but session middleware was chosen for a simpler, more robust single-instance
local-first setup and clean socket session sharing.

## 5. Authoritative server, best-of-5 matches, server-side ELO

**Decision:** The server resolves each round (standard rock/paper/scissors),
tracks score to a best-of-5, decides the winner, and — for ranked — updates ELO
for both players and writes a `Match` record with per-round history.

**Why:** Upgrades the prototype (where Casual was the only working mode and the
client judged its own moves) into a real, fair game with progression worth
showing. Ranked/VS-AI were stubs originally; both are implemented here.

## 6. Monorepo, admin deferred

**Decision:** One repo with `client/` + `server/`. The separate `RPS-Admin` app
is deferred and documented as a planned surface.

**Why:** Matches the revival-queue rule of shipping the main user-facing
workflow first, and keeps the flagship focused on the playable game.
