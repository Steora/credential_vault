-- CreateEnum
CREATE TYPE "VaultEntityStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "status" "VaultEntityStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Note" ADD COLUMN "status" "VaultEntityStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Note_status_idx" ON "Note"("status");
