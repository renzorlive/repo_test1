-- CreateTable
CREATE TABLE "resume_snapshots" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_snapshots_workspace_id_created_at_idx" ON "resume_snapshots"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "resume_snapshots_project_id_created_at_idx" ON "resume_snapshots"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "resume_snapshots_mission_id_created_at_idx" ON "resume_snapshots"("mission_id", "created_at");

-- AddForeignKey
ALTER TABLE "resume_snapshots" ADD CONSTRAINT "resume_snapshots_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

