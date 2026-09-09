import { WellnessType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const TEST_PASSWORD = "password";

const TEST_ACCOUNTS = [
  { email: "alice@email.net", name: "Alice" },
  { email: "bob@email.net", name: "Bob" },
  { email: "ming@email.net", name: "Ming" },
] as const;

const WELLNESS_SEED_OFFSETS: Record<(typeof TEST_ACCOUNTS)[number]["email"], number> = {
  "alice@email.net": 0,
  "bob@email.net": 2,
  "ming@email.net": 4,
};

function daysAgo(n: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - n);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

async function seedWellnessEntries(userId: string, offset = 0) {
  await prisma.wellnessEntry.deleteMany({ where: { userId } });
  await prisma.customActivityType.deleteMany({ where: { userId } });

  await prisma.customActivityType.createMany({
    data: [
      { userId, name: "Meditation", unit: "minutes" },
      { userId, name: "Mood", unit: "score" },
    ],
  });

  const entries = [];

  for (let i = 0; i < 21; i += 1) {
    const date = daysAgo(i);

    entries.push(
      {
        userId,
        type: WellnessType.water,
        label: "Water",
        value: 6 + ((i + offset) % 4),
        unit: "glasses",
        date,
      },
      {
        userId,
        type: WellnessType.calories,
        label: "Calories",
        value: 1800 + ((i + offset) % 5) * 75,
        unit: "kcal",
        date,
      },
      {
        userId,
        type: WellnessType.custom,
        label: "Meditation",
        value: 10 + ((i + offset) % 3) * 5,
        unit: "minutes",
        date,
      },
      {
        userId,
        type: WellnessType.custom,
        label: "Mood",
        value: 6 + ((i + offset) % 4),
        unit: "score",
        date,
      },
    );
  }

  await prisma.wellnessEntry.createMany({ data: entries });
  return entries.length;
}

async function upsertCredentialAccount(userId: string, passwordHash: string) {
  const existingAccount = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
  });

  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { password: passwordHash, accountId: userId },
    });
    return;
  }

  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  for (const account of TEST_ACCOUNTS) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, emailVerified: true },
      create: {
        email: account.email,
        name: account.name,
        emailVerified: true,
      },
    });

    await upsertCredentialAccount(user.id, passwordHash);

    const count = await seedWellnessEntries(user.id, WELLNESS_SEED_OFFSETS[account.email]);
    console.log(`Seeded ${account.email} with ${count} wellness entries.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
