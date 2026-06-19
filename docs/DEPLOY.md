# Deployment Guide

The app is local-first, but nothing about it is tied to localhost. This covers
taking it to a public URL.

## Production checklist

Before exposing it to the internet:

- [ ] Set a strong, random `SESSION_SECRET`.
- [ ] Serve over **HTTPS** and set `COOKIE_SECURE=true` (the session cookie is
      `SameSite=Lax`; with a split client/API origin you may also move to
      `SameSite=None; Secure`).
- [ ] Point `DATABASE_URL` at a **managed Postgres** instance (not the bundled
      container) and keep automated backups.
- [ ] Set `CLIENT_ORIGIN` and `VITE_SERVER_URL` to the real public URLs.
- [ ] Run migrations with `prisma migrate deploy` (already the container's boot
      step); do **not** run the demo seed in production.
- [ ] Put the API behind the same domain as the client (or a subdomain) to keep
      cookies first-party.

## Option A — One host, Docker Compose (simplest)

Any VPS with Docker (a $5–6/mo box is plenty):

```bash
git clone https://github.com/reannu123/rock-paper-scissors-remaster
cd rock-paper-scissors-remaster
cp .env.example .env   # then edit the values per the checklist above
docker compose up -d --build
```

Front it with a reverse proxy (Caddy or nginx) that terminates TLS and routes
`/` to the client and `/api` + `/socket.io` to the server. Caddy gives you
automatic HTTPS in a few lines.

## Option B — Managed platform (Render / Railway / Fly.io)

Deploy the two images as separate services plus a managed Postgres add-on:

- **server** — build `./server`, expose port 4000, attach the Postgres URL as
  `DATABASE_URL`, set `SESSION_SECRET`, `CLIENT_ORIGIN`, `COOKIE_SECURE=true`.
- **client** — build `./client` with `VITE_SERVER_URL` set to the server's
  public URL (it's baked in at build time).
- Enable sticky sessions / WebSocket support on the server service.

## Scaling beyond one instance

Active-match state currently lives in the server's memory, so it's
single-instance by design. To run multiple instances behind a load balancer:

1. Add the **Socket.IO Redis adapter** so events fan out across instances.
2. Move queue + active-match state into Redis (or a small authoritative
   matchmaking service) so any instance can serve any socket.

This is deliberately deferred — see [`DECISIONS.md`](DECISIONS.md).
