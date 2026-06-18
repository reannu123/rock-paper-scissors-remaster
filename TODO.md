# Rock Paper Scissors Remaster — TODO

Status: **complete** (flagship remaster — verified end-to-end 2026-06-20).
Central direction lives in `~/Freelance/NOW.md`; this file tracks the build.

## Now

Build complete — see Done. Remaining ideas are all in Later (parked).

## Next

- [ ] (Optional) Automated test suite — promote `gameLogic.js` unit tests +
      a Socket.IO integration test (the manual `/tmp` harness already proves the
      flow; worth formalizing).

## Later (parked, do not block revival)

- [ ] Admin surface (port `RPS-Admin`): user/match moderation dashboard.
- [ ] Redis adapter for multi-instance Socket.IO scaling.
- [ ] Spectator mode, in-match chat, friend invites / private rooms.
- [ ] Cosmetics / avatars; sound effects.
- [ ] CI (lint/build/test) — aligns with the inbox "GitHub Actions" idea.

## Done

- [x] Diagnose source repos (`rps-firebase`, `RPS-server`, `RPS-Admin`); confirm
      `rock-paper-scissors-remaster` GitHub repo is empty.
- [x] Lock remaster architecture (Postgres + Socket.IO + session auth; no Google).
- [x] Scaffold monorepo: docker-compose, server/client Dockerfiles, nginx,
      Prisma schema, Vite/TS/Tailwind config, env example.
- [x] Server game engine: Socket.IO matchmaking, best-of-5, authoritative
      resolution, score, rematch, opponent-left handling.
- [x] Session auth (express-session + Postgres store + bcrypt + guest),
      shared with the Socket.IO handshake.
- [x] Full client on Socket.IO: Login/guest, Menu, PlayMenu, realtime Match,
      local VS-AI, Leaderboard.
- [x] Ranked ELO + `Match`/round-history persistence; casual persists without ELO.
- [x] Fixed Vite env typing + Prisma-on-Alpine OpenSSL (musl binary target).
- [x] Verified end-to-end: `docker compose up --build` boots all three services;
      ranked match plays to 3-0 with correct ±16 ELO persisted; casual leaves ELO
      unchanged; REST (auth/guest/leaderboard/history) verified; no Firebase refs.
- [x] README screenshots (login, menu, vs-ai, leaderboard) via headless Chrome.

## Known limitations to document, not fix now

- Single server instance only (in-memory active-match state) — Redis is the
  documented scale path.
- No automated tests yet (manual verification + documented smoke test).
- Admin app deferred.
