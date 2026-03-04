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
  await prisma.user.deleteMany();
  await prisma.term.deleteMany();
  await prisma.learner.deleteMany();
  await prisma.class.deleteMany();
  await prisma.session.deleteMany();
  await prisma.organisation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.financeInvoice.deleteMany();

  await prisma.user.createMany({
    data: [
      { id: "u1", name: "Sarah Admin (Super admin)", role: "admin", email: "admin@codewithkids.afrika", status: "active", passwordHash },
      { id: "u2", name: "Vivian Cheboi (Educator)", role: "educator", email: "vivian@codewithkids.afrika", status: "active", passwordHash },
      { id: "u3", name: "Lisa Finance (Finance)", role: "finance", email: "lisa@codewithkids.afrika", status: "active", passwordHash },
      { id: "u4", name: "Patricia Wanja (Member learner)", role: "student", email: "patricia.wanja@mail.com", status: "active", avatarId: "avatar-1", passwordHash },
      { id: "u5", name: "Lucy Njeri (Parent)", role: "parent", email: "lucy.njeri@mail.com", status: "active", membershipStatus: "active", passwordHash },
      { id: "u10", name: "Greenfield Primary (School)", role: "organisation", email: "office@greenfield.edu", status: "active", organizationId: "org1", passwordHash },
      { id: "u9", name: "Spur Afrika (Organisation)", role: "organisation", email: "admin@spurafrika.org", status: "active", organizationId: "org3", passwordHash },
      { id: "u8", name: "Compassion Miradi (Miradi)", role: "organisation", email: "miradi@compassion.org", status: "active", organizationId: "org2", passwordHash },
      { id: "u11", name: "Tonny Ndare (Partnerships)", role: "partnerships", email: "tonny@codewithkids.afrika", status: "active", passwordHash },
    ],
  });

  await prisma.term.createMany({
    data: [
      { id: "t1", name: "Term 1 2026", startDate: "2026-01-15", endDate: "2026-04-15", isCurrent: true },
      { id: "t2", name: "Term 2 2026", startDate: "2026-05-01", endDate: "2026-08-15", isCurrent: false },
    ],
  });

  await prisma.learner.createMany({
    data: [
      { id: "l1", firstName: "Patricia", lastName: "Wanja", dateOfBirth: "2014-03-15", school: "Greenfield Primary", enrolmentType: "member", programType: "MAKERSPACE", membershipStatus: "active", userId: "u4", parentName: "Lucy Njeri", parentPhone: "+254 7XX XXX XXXX", parentEmail: "lucy.njeri@mail.com", status: "active", gender: "female", joinedAt: "2026-01-15" },
      { id: "l2", firstName: "Maya", lastName: "Patel", dateOfBirth: "2013-07-22", school: "Riverside Academy", enrolmentType: "member", programType: "SCHOOL_CLUB", parentName: "Mr. Patel", parentPhone: "+27 83 234 5678", parentEmail: "patel@mail.com", status: "active", gender: "female", joinedAt: "2026-01-20" },
      { id: "l3", firstName: "Ethan", lastName: "Williams", dateOfBirth: "2012-11-08", school: "Oakwood School", enrolmentType: "member", programType: "SCHOOL_CLUB", parentName: "Mrs. Williams", parentPhone: "+27 84 345 6789", parentEmail: "williams@mail.com", status: "active", gender: "male", joinedAt: "2026-01-22" },
      { id: "l4", firstName: "Zara", lastName: "Nkosi", dateOfBirth: "2015-01-30", school: "Sunshine Primary", enrolmentType: "partner_org", programType: "ORGANISATION", organizationId: "org2", parentName: "Mrs. Nkosi", status: "active", gender: "female", joinedAt: "2026-01-10" },
      { id: "l5", firstName: "Liam", lastName: "Brown", dateOfBirth: "2011-09-12", school: "Greenfield Primary", enrolmentType: "member", programType: "MAKERSPACE", membershipStatus: "expired", userId: null, parentName: "Mr. Brown", parentPhone: "+27 86 567 8901", parentEmail: "brown@mail.com", status: "alumni", gender: "male", joinedAt: "2026-01-05" },
      { id: "l6", firstName: "Sofia", lastName: "Garcia", dateOfBirth: "2014-05-18", school: "Riverside Academy", enrolmentType: "partner_org", programType: "ORGANISATION", organizationId: "org3", status: "active", gender: "female", joinedAt: "2026-01-18" },
    ],
  });

  await prisma.class.createMany({
    data: [
      { id: "c1", name: "Code With Kids - Makerspace", program: "Makerspace Session", ageGroup: "8-13", location: "Makerspace", educatorId: "u2", termId: "t1", learnerIds: ["l1", "l2", "l4"], capacity: 30 },
      { id: "c2", name: "Code With Kids - Virtual", program: "Virtual Session", ageGroup: "8-13", location: "Online", educatorId: "u2", termId: "t1", learnerIds: ["l3", "l5", "l6"], capacity: 25 },
      { id: "c3", name: "Code With Kids - Home Sessions", program: "Home Sessions", ageGroup: "8-13", location: "Home", educatorId: "u2", termId: "t1", learnerIds: ["l1", "l3", "l6"], capacity: 20 },
    ],
  });

  const today = new Date().toISOString().slice(0, 10);
  await prisma.session.createMany({
    data: [
      { id: "s1", classId: "c1", date: today, startTime: "09:00", endTime: "10:00", topic: "Introduction to Loops", sessionType: "makerspace", durationHours: 1, learningTrack: "game_design", termId: "t1", leadEducatorId: "u2", assistantEducatorIds: [] },
      { id: "s2", classId: "c2", date: today, startTime: "10:30", endTime: "11:30", topic: "Functions & Parameters", sessionType: "school_stem_club", durationHours: 1, learningTrack: "python", termId: "t1", leadEducatorId: "u2", assistantEducatorIds: [] },
      { id: "s3", classId: "c1", date: "2026-01-22", startTime: "09:00", endTime: "10:00", topic: "Variables & Data Types", sessionType: "virtual", durationHours: 1, learningTrack: "game_design", termId: "t1", leadEducatorId: "u2", assistantEducatorIds: [] },
      { id: "s4", classId: "c3", date: today, startTime: "14:00", endTime: "15:30", topic: "Building a Robot Arm", sessionType: "organization", durationHours: 1.5, learningTrack: "robotics", termId: "t1", leadEducatorId: "u2", assistantEducatorIds: [] },
    ],
  });

  await prisma.organisation.createMany({
    data: [
      { id: "org1", name: "Greenfield Primary", type: "school", contactPerson: "Mr. Principal", contactPhone: "+27 11 100 1000", contactEmail: "office@greenfield.edu", location: "Johannesburg" },
      { id: "org2", name: "Compassion Miradi", type: "church", contactPerson: "Pastor Sarah", contactPhone: "+27 11 200 2000", contactEmail: "miradi@compassion.org", location: "Nairobi" },
      { id: "org3", name: "Spur Afrika", type: "organisation", contactPerson: "Ms. Director", contactPhone: "+27 11 300 3000", contactEmail: "admin@spurafrika.org", location: "Cape Town" },
    ],
  });

  const now = new Date();
  const iso = now.toISOString();
  const dateStr = iso.slice(0, 10);

  await prisma.financeInvoice.createMany({
    data: [
      { id: "fin-inv-1", payerType: "parent", payerId: "l1", learnerId: "l1", termId: "t1", programmeId: "prog1", trackId: "game_design", grossAmount: 3000, discountAmount: 0, netAmount: 3000, amountPaid: 1500, balance: 1500, currency: "KES", dueDate: "2026-03-31", issueDate: "2026-01-20", status: "partially_paid", createdAt: now, createdBy: "u3" },
      { id: "fin-inv-2", payerType: "parent", payerId: "l2", learnerId: "l2", termId: "t1", programmeId: "prog1", grossAmount: 2500, discountAmount: 250, netAmount: 2250, amountPaid: 2250, balance: 0, currency: "KES", dueDate: "2026-02-28", issueDate: "2026-01-18", status: "paid", createdAt: now, createdBy: "u3" },
      { id: "fin-inv-3", payerType: "organisation", payerId: "org2", organisationId: "org2", termId: "t1", programmeId: "prog1", grossAmount: 5000, discountAmount: 0, netAmount: 5000, amountPaid: 0, balance: 5000, currency: "KES", dueDate: "2026-02-15", issueDate: "2026-01-25", status: "issued", createdAt: now, createdBy: "u3" },
      { id: "fin-inv-4", payerType: "organisation", payerId: "org3", organisationId: "org3", termId: "t1", grossAmount: 2500, discountAmount: 0, netAmount: 2500, amountPaid: 2500, balance: 0, currency: "KES", dueDate: "2026-02-28", issueDate: "2026-01-20", status: "paid", createdAt: now, createdBy: "u3" },
      { id: "fin-inv-5", payerType: "parent", payerId: "l3", learnerId: "l3", termId: "t1", grossAmount: 2600, discountAmount: 0, netAmount: 2600, amountPaid: 0, balance: 2600, currency: "KES", dueDate: "2026-03-15", issueDate: "2026-01-22", status: "issued", createdAt: now, createdBy: "u3" },
    ],
  });

  await prisma.payment.createMany({
    data: [
      { id: "pay-1", invoiceId: "fin-inv-1", amount: 1500, method: "mpesa", reference: "MPESA-XX", date: "2026-01-25", recordedBy: "u3", createdAt: new Date("2026-01-25T09:00:00Z") },
      { id: "pay-2", invoiceId: "fin-inv-2", amount: 2250, method: "bank_transfer", date: "2026-01-20", recordedBy: "u3", createdAt: new Date("2026-01-20T10:00:00Z") },
    ],
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
