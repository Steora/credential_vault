-- Project hierarchy (subprojects)
ALTER TABLE "Project" ADD COLUMN "parentId" TEXT;

CREATE INDEX "Project_parentId_idx" ON "Project"("parentId");

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- User ↔ Project membership (User Management assignments)
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectMember_userId_projectId_key" ON "ProjectMember"("userId", "projectId");

CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

CREATE INDEX "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");

ALTER TABLE "ProjectMember"
  ADD CONSTRAINT "ProjectMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectMember"
  ADD CONSTRAINT "ProjectMember_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
