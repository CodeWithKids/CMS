-- CreateTable
CREATE TABLE "pending_signups" (
    "id" TEXT NOT NULL,
    "signupType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "pending_signups_pkey" PRIMARY KEY ("id")
);
