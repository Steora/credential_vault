-- AlterTable
ALTER TABLE "PendingSecretSubmission" ADD COLUMN     "environment" TEXT NOT NULL DEFAULT 'Default';

-- AlterTable
ALTER TABLE "Secret" ADD COLUMN     "environment" TEXT NOT NULL DEFAULT 'Default';
