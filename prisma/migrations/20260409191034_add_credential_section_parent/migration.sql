-- AlterTable
ALTER TABLE "CredentialSection" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "CredentialSection_parentId_idx" ON "CredentialSection"("parentId");

-- AddForeignKey
ALTER TABLE "CredentialSection" ADD CONSTRAINT "CredentialSection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CredentialSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
