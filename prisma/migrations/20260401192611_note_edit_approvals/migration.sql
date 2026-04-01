-- AlterTable
ALTER TABLE "PendingNoteSubmission" ADD COLUMN     "originalNoteId" TEXT;

-- AddForeignKey
ALTER TABLE "PendingNoteSubmission" ADD CONSTRAINT "PendingNoteSubmission_originalNoteId_fkey" FOREIGN KEY ("originalNoteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
