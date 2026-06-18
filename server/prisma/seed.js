// Idempotent seed: a demo account to log into immediately, plus a few rated
// players so the leaderboard isn't empty on first boot. Safe to run every start.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const demoHash = bcrypt.hashSync("demo1234", 10);

  await prisma.user.upsert({
    where: { username: "demo" },
    update: {},
    create: {
      username: "demo",
      email: "demo@example.com",
      password: demoHash,
      elo: 1000,
    },
  });

  const ladder = [
    { username: "Ada", elo: 1320, wins: 24, losses: 9, draws: 3 },
    { username: "Lin", elo: 1185, wins: 15, losses: 12, draws: 5 },
    { username: "Mei", elo: 1090, wins: 9, losses: 8, draws: 2 },
    { username: "Kofi", elo: 980, wins: 6, losses: 11, draws: 1 },
  ];

  for (const p of ladder) {
    await prisma.user.upsert({
      where: { username: p.username },
      update: {},
      create: { ...p, password: bcrypt.hashSync("demo1234", 10) },
    });
  }

  console.log("Seed complete: demo account (demo / demo1234) + sample ladder.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
