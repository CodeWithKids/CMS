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

const FOCUS_AREAS: Array<{ id: string; name: string; slug: string; order: number }> = [
  { id: "fa-foundational", name: "Foundational Skills", slug: "foundational-skills", order: 1 },
  { id: "fa-programming", name: "Programming & Development", slug: "programming-development", order: 2 },
  { id: "fa-emerging", name: "Emerging Technologies", slug: "emerging-technologies", order: 3 },
  { id: "fa-design", name: "Design & Creativity", slug: "design-creativity", order: 4 },
  { id: "fa-specialized", name: "Specialized Interests & Life Skills", slug: "specialized-interests-life-skills", order: 5 },
  { id: "fa-experiments", name: "Experiments & Applied Science", slug: "experiments-applied-science", order: 6 },
];

const LEARNING_TRACKS: Array<{ id: string; name: string; slug: string; focusAreaId: string; order: number }> = [
  { id: "computer_basics", name: "Computer Basics", slug: "computer-basics", focusAreaId: "fa-foundational", order: 1 },
  { id: "game_design", name: "Game Design (Scratch)", slug: "game-design", focusAreaId: "fa-programming", order: 1 },
  { id: "python", name: "Python", slug: "python", focusAreaId: "fa-programming", order: 2 },
  { id: "web_design", name: "Web Design", slug: "web-design", focusAreaId: "fa-programming", order: 3 },
  { id: "app_design", name: "App Design", slug: "app-design", focusAreaId: "fa-programming", order: 4 },
  { id: "ai", name: "Artificial Intelligence (AI)", slug: "ai", focusAreaId: "fa-emerging", order: 1 },
  { id: "blockchain", name: "BlockChain Technology", slug: "blockchain", focusAreaId: "fa-emerging", order: 2 },
  { id: "graphic_design", name: "Graphic Design", slug: "graphic-design", focusAreaId: "fa-design", order: 1 },
  { id: "3d_design", name: "3D Design", slug: "3d-design", focusAreaId: "fa-design", order: 2 },
  { id: "financial_literacy", name: "Financial Literacy", slug: "financial-literacy", focusAreaId: "fa-specialized", order: 1 },
  { id: "esports", name: "Esports", slug: "esports", focusAreaId: "fa-specialized", order: 2 },
  { id: "robotics", name: "Robotics", slug: "robotics", focusAreaId: "fa-experiments", order: 1 },
  { id: "microbit", name: "Micro:bit", slug: "microbit", focusAreaId: "fa-experiments", order: 2 },
  { id: "physical_computing", name: "Physical Computing", slug: "physical-computing", focusAreaId: "fa-experiments", order: 3 },
  { id: "science_experiments", name: "Science Experiments", slug: "science-experiments", focusAreaId: "fa-experiments", order: 4 },
];

async function main() {
  const adminEmail = "codewithkidsafrica@gmail.com";

  for (const fa of FOCUS_AREAS) {
    await prisma.focusArea.upsert({
      where: { id: fa.id },
      update: { name: fa.name, slug: fa.slug, order: fa.order },
      create: fa,
    });
  }
  for (const t of LEARNING_TRACKS) {
    await prisma.learningTrack.upsert({
      where: { id: t.id },
      update: { name: t.name, slug: t.slug, focusAreaId: t.focusAreaId, order: t.order },
      create: t,
    });
  }

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
