-- CreateEnum
CREATE TYPE "PendingSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "PendingSecretSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PendingSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "submitterId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionNote" TEXT,

    CONSTRAINT "PendingSecretSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingNoteSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PendingSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "submitterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "NoteType" NOT NULL,
    "projectId" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionNote" TEXT,

    CONSTRAINT "PendingNoteSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingSecretSubmission_status_idx" ON "PendingSecretSubmission"("status");

-- CreateIndex
CREATE INDEX "PendingSecretSubmission_submitterId_idx" ON "PendingSecretSubmission"("submitterId");

-- CreateIndex
CREATE INDEX "PendingNoteSubmission_status_idx" ON "PendingNoteSubmission"("status");

-- CreateIndex
CREATE INDEX "PendingNoteSubmission_submitterId_idx" ON "PendingNoteSubmission"("submitterId");

-- AddForeignKey
ALTER TABLE "PendingSecretSubmission" ADD CONSTRAINT "PendingSecretSubmission_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingSecretSubmission" ADD CONSTRAINT "PendingSecretSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingSecretSubmission" ADD CONSTRAINT "PendingSecretSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingNoteSubmission" ADD CONSTRAINT "PendingNoteSubmission_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingNoteSubmission" ADD CONSTRAINT "PendingNoteSubmission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingNoteSubmission" ADD CONSTRAINT "PendingNoteSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
