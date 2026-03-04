-- CreateTable
CREATE TABLE "session_reports" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "leadEducatorId" TEXT NOT NULL,
    "assistantEducatorIds" TEXT[],
    "date" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    "schoolOrOrganizationName" TEXT NOT NULL,
    "totalLearners" INTEGER NOT NULL,
    "learningTrack" TEXT NOT NULL,
    "durationHours" DOUBLE PRECISION NOT NULL,
    "femaleCount" INTEGER NOT NULL,
    "maleCount" INTEGER NOT NULL,
    "highlights" TEXT[],
    "objectivesMet" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stars" INTEGER,
    "notes" TEXT,
    "markedAt" TIMESTAMP(3),
    "markedBy" TEXT,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_reports_sessionId_key" ON "session_reports"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_sessionId_learnerId_key" ON "attendance_records"("sessionId", "learnerId");

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
