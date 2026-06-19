# Case Study — Rock Paper Scissors, Remastered

**One line:** Took a 2023 student project that only ran against a personal
Firebase account and rebuilt it into a self-hostable realtime multiplayer game
that anyone can clone and run with a single command.

---

## The problem

The original Rock Paper Scissors was a fun idea with a fragile foundation:

- It **couldn't run without my Firebase project** — the config (and an API key)
  was hardcoded into the client and a standalone worker. Clone it and it did
  nothing.
- The **client judged its own moves**, so the "multiplayer" game was trivially
  cheatable.
- **Matchmaking was a separate Node script** polling Firebase Realtime Database
  listeners — a second moving part with no clear ownership of game state.
- Two of the three game modes (Ranked, Vs AI) were **unfinished stubs**.

As a portfolio piece it had a fatal flaw: a prospective client or employer
couldn't actually *run it*, and the parts they could see didn't demonstrate
sound engineering.

## The goal

Rebuild it so that:

1. **Anyone can run it in one command**, with no cloud account or paid service.
2. The **server is authoritative** — it owns matchmaking and the rules.
3. It demonstrates a **credible production stack** end-to-end: realtime,
   relational data, authentication, and containerized delivery.

## Approach

I treated this as a **remaster, not a port** — keep the game feel, replace the
foundation. The original three repos (`rps-firebase` client, `RPS-server`
worker, `RPS-Admin`) were consolidated into one monorepo.

| Concern | Before (2023) | After (remaster) |
| --- | --- | --- |
| Realtime sync | Firebase Realtime DB | **Socket.IO** (WebSockets) |
| Matchmaking | Standalone polling worker | Folded into the **authoritative server** |
| Persistence | Firestore | **PostgreSQL + Prisma** |
| Auth | Firebase Auth | **express-session + Postgres + bcrypt**, plus guest play |
| Move resolution | On the client | **On the server** |
| Delivery | `gh-pages` static deploy | **Docker Compose** (db + server + client) |
| Hosting requirement | A Google Cloud project | **None** — fully local |

## Key decisions & trade-offs

- **Socket.IO over a cloud realtime DB.** WebSockets give the same realtime push
  without renting infrastructure, and let the *server* be the single source of
  truth for the queue and every match. Trade-off: active-match state lives in
  server memory, so it's single-instance. I documented the scale path (Socket.IO
  Redis adapter) rather than over-engineering for a problem this app doesn't yet
  have.
- **Session auth instead of JWT or a BaaS.** A previous project used hand-rolled
  JWT; here I chose library-managed server-side sessions (httpOnly cookie, hash
  in Postgres). They're simpler to reason about, store nothing sensitive in the
  browser, and — crucially — the **same session is shared with the Socket.IO
  handshake**, so realtime connections are authenticated for free. Guest accounts
  make the app demoable in one click.
- **A local Vs-AI mode.** Beyond finishing a stubbed feature, this guarantees a
  solo visitor always gets a working game even with no second player online — an
  important property for a portfolio demo.
- **Best-of-5 with server-side ELO.** Turns "click a button" into a game with
  progression worth showing: ranked results move both players' ratings and are
  persisted with per-round history.

## Outcome

- `docker compose up --build` brings up Postgres, the server, and the nginx-served
  client. Open two browser windows and you can play a real match.
- Verified end-to-end: a ranked match resolves correctly and moves ELO by the
  expected ±16, persisted to Postgres; casual leaves ratings untouched; auth,
  guest play, and the leaderboard all work; **zero Firebase remains**.
- Unit tests cover the rules and ELO; CI runs tests, a client build, and compose
  validation on every push.

## What this demonstrates

- **Realtime systems** — WebSocket protocol design, server-authoritative state,
  matchmaking, reconnection/forfeit handling.
- **Full-stack delivery** — React/TypeScript front end, Node/Express API,
  relational modeling with Prisma, and a reproducible Docker deployment.
- **Engineering judgment** — migrating off a vendor without gold-plating,
  documenting limitations and scale paths instead of hiding them.
- **Turning legacy code into a maintainable product** — exactly the work a
  client paying for a "revive/modernize this app" engagement needs.

## If this were a paid engagement, next up

- A hosted live demo (Fly.io / Render + managed Postgres) — see
  [`DEPLOY.md`](DEPLOY.md).
- Redis adapter to run multiple server instances behind a load balancer.
- The admin dashboard (moderation, match inspection) from the original
  `RPS-Admin`.
- Reconnect-into-match, private rooms / friend invites, and a short gameplay
  recording for the README.
