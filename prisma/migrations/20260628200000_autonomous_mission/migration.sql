-- CreateEnum
CREATE TYPE "MissionMode" AS ENUM ('FOUNDER', 'ADVANCED');

-- CreateEnum
CREATE TYPE "MissionAutonomy" AS ENUM ('MANUAL', 'SUPERVISED', 'AUTONOMOUS');

-- CreateEnum
CREATE TYPE "MissionPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MissionStageType" AS ENUM ('PLANNING', 'ARCHITECTURE', 'TASK_BREAKDOWN', 'WORKER_ASSIGNMENT', 'EXECUTION', 'REVIEW', 'FIX', 'COMMIT', 'DEPLOY', 'RELEASE_NOTES', 'DONE');

-- CreateEnum
CREATE TYPE "MissionStageStatus" AS ENUM ('PENDING', 'ACTIVE', 'WAITING_APPROVAL', 'COMPLETED', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "missions" ADD COLUMN     "autonomy" "MissionAutonomy" NOT NULL DEFAULT 'SUPERVISED',
ADD COLUMN     "mode" "MissionMode" NOT NULL DEFAULT 'FOUNDER';

-- CreateTable
CREATE TABLE "mission_plans" (
    "id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "status" "MissionPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "current_stage" "MissionStageType",
    "summary" TEXT,
    "memory" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mission_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_stages" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "type" "MissionStageType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "MissionStageStatus" NOT NULL DEFAULT 'PENDING',
    "position" INTEGER NOT NULL DEFAULT 0,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "output" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mission_stages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mission_plans_mission_id_key" ON "mission_plans"("mission_id");

-- CreateIndex
CREATE INDEX "mission_stages_plan_id_position_idx" ON "mission_stages"("plan_id", "position");

-- CreateIndex
CREATE INDEX "mission_stages_mission_id_idx" ON "mission_stages"("mission_id");

-- AddForeignKey
ALTER TABLE "mission_plans" ADD CONSTRAINT "mission_plans_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_stages" ADD CONSTRAINT "mission_stages_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "mission_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_stages" ADD CONSTRAINT "mission_stages_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

