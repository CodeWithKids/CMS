/**
 * Seed PostgreSQL with initial data. Run after migrate:
 *   npx prisma db seed
 * or: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEV_PASSWORD = "password";
const passwordHash = bcrypt.hashSync(DEV_PASSWORD, 10);

async function main() {
  const adminEmail = "codewithkidsafrica@gmail.com";

  // Upsert by id so we always have one admin, whether or not they already exist
  await prisma.user.upsert({
    where: { id: "u1" },
    update: {
      name: "Sarah Admin (Super admin)",
      role: "admin",
      email: adminEmail,
      status: "active",
      passwordHash,
    },
    create: {
      id: "u1",
      name: "Sarah Admin (Super admin)",
      role: "admin",
      email: adminEmail,
      status: "active",
      passwordHash,
    },
  });

  console.log(`Seed completed. Admin: ${adminEmail} / ${DEV_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
