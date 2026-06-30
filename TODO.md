# Rock Paper Scissors Remaster — TODO

Status: **complete** (flagship remaster — verified end-to-end 2026-06-20).
Central direction lives in `~/Freelance/NOW.md`; this file tracks the build.

## Now

Build complete, pushed, and publicly deployed at `https://rps.reannu.dev`.
All further ideas are optional flagship polish/features.

## Next

- No active work. The flagship remaster now has CI, GHCR image publishing, and
  a verified pm-docker public demo.

## Flagship polish — high leverage (ordered by impact)

- [x] **Live hosted demo** — deployed on pm-docker at `https://rps.reannu.dev`
      with GHCR client/server images, persisted Postgres volume, NPM proxy
      host `id=31`, public `/api/health` 200, public homepage 200, and public
      guest-session smoke passing.
- [ ] **Gameplay GIF/recording in the README** — couldn't build one in the dev
      env (no ffmpeg; native `canvas` wouldn't compile). A ~5s screen capture of a
      live match would make the repo pop.
- [ ] **Socket.IO integration test in CI** — boot server + a test Postgres, run a
      real two-client match assertion (formalizes the manual `/tmp` proof).
- [ ] **Reconnect-into-match** + opponent-disconnect grace timer — makes
      multiplayer feel production-grade (currently a disconnect tears the match down).

## Flagship features — bigger builds

- [ ] **Port the `RPS-Admin` surface** — moderation + match inspection dashboard.
      Maps directly to the target "internal tools / dashboards" client work.
- [ ] **Private rooms / friend invites** — share a code to play a specific person.
- [ ] Spectator mode; in-match chat.
- [ ] **Redis adapter** for multi-instance Socket.IO scaling (documented scale path).
- [ ] Cosmetics / avatars; sound effects.

## Nice polish

- [ ] Favicon + Open Graph meta tags (shared links render a preview card).
- [ ] Persist and show each player's recent match history on a profile page.

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
- [x] Added GHCR publishing and pm-docker deployment config on 2026-07-01:
      commit `5003b63`; CI run `28464303820` passed and Docker Image CD run
      `28464303773` published client/server images.

## Known limitations to document, not fix now

- Single server instance only (in-memory active-match state) — Redis is the
  documented scale path.
- Unit tests cover game rules + ELO; realtime flow is covered by a manual
  harness, not yet an automated integration test in CI.
- CI workflow is active on GitHub; its first run passed 2026-06-24.
- Public demo is live at `https://rps.reannu.dev`; same-origin API and
  Socket.IO proxying are configured through the client nginx container.
- Admin app deferred.
