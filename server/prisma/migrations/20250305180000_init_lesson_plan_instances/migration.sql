-- CreateTable
CREATE TABLE "lesson_plan_templates" (
    "id" TEXT NOT NULL,
    "learningTrackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_plan_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_plan_instances" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "templateId" TEXT,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "educatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_plan_instances_pkey" PRIMARY KEY ("id")
);
