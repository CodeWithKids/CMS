-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "status" TEXT DEFAULT 'active',
    "organizationId" TEXT,
    "membershipStatus" TEXT,
    "avatarId" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learners" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "enrolmentType" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "membershipStatus" TEXT,
    "userId" TEXT,
    "parentName" TEXT,
    "parentPhone" TEXT,
    "parentEmail" TEXT,
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "gender" TEXT,
    "joinedAt" TEXT,

    CONSTRAINT "learners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "educatorId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "learnerIds" TEXT[],
    "capacity" INTEGER,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    "durationHours" DOUBLE PRECISION NOT NULL,
    "learningTrack" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "leadEducatorId" TEXT NOT NULL,
    "assistantEducatorIds" TEXT[],

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "location" TEXT NOT NULL,

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_invoices" (
    "id" TEXT NOT NULL,
    "payerType" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "learnerId" TEXT,
    "organisationId" TEXT,
    "termId" TEXT NOT NULL,
    "programmeId" TEXT,
    "trackId" TEXT,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "issueDate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3),
    "updatedBy" TEXT,

    CONSTRAINT "finance_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "date" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "finance_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
