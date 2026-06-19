# Rock Paper Scissors Remaster — TODO

Status: **complete** (flagship remaster — verified end-to-end 2026-06-20).
Central direction lives in `~/Freelance/NOW.md`; this file tracks the build.

## Now

Build complete — see Done. Remaining ideas are all in Later (parked).

## Next (flagship polish — optional)

- [ ] Hosted live demo (Fly.io / Render + managed Postgres) — see docs/DEPLOY.md.
- [ ] Short gameplay GIF/recording for the README (needs ffmpeg or a gif lib;
      native `canvas` build wasn't available in the build env).
- [ ] Socket.IO integration test in CI (a real two-client match assertion).

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
- [x] Flagship-proof pass: MIT license; game-rules + ELO unit tests (`npm test`);
      GitHub Actions CI (tests + client build + compose validation); security
      hardening (helmet, auth rate-limiting, body limits, env-driven secure
      cookie) verified (429 on abuse, browser auth still works); case study +
      deploy guide; README badges. Pushed public to GitHub.

## Known limitations to document, not fix now

- Single server instance only (in-memory active-match state) — Redis is the
  documented scale path.
- No automated tests yet (manual verification + documented smoke test).
- Admin app deferred.
