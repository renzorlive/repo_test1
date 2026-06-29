-- CreateEnum
CREATE TYPE "AiProviderType" AS ENUM ('OPENAI', 'ANTHROPIC', 'GOOGLE', 'OLLAMA', 'OPENROUTER', 'LOCAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AiWorkerStatus" AS ENUM ('ACTIVE', 'IDLE', 'BUSY', 'DRAINING', 'DISABLED', 'ERROR');

-- CreateEnum
CREATE TYPE "AiWorkerHealth" AS ENUM ('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AiCapabilityKind" AS ENUM ('TEXT_GENERATION', 'CODE_GENERATION', 'REASONING', 'VISION', 'EMBEDDING', 'FUNCTION_CALLING', 'WEB_SEARCH', 'STRUCTURED_OUTPUT', 'SUMMARIZATION', 'CLASSIFICATION');

-- CreateEnum
CREATE TYPE "AiExecutionState" AS ENUM ('QUEUED', 'PREPARING', 'BUILDING_CONTEXT', 'RUNNING', 'WAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRYING');

-- CreateEnum
CREATE TYPE "AiExecutionEventType" AS ENUM ('QUEUED', 'STARTED', 'CONTEXT_READY', 'PROMPT_GENERATED', 'PROVIDER_SELECTED', 'RUNNING', 'WAITING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRY_SCHEDULED');

-- CreateEnum
CREATE TYPE "AiQueueStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DRAINING');

-- CreateEnum
CREATE TYPE "AiLogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "ai_providers" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AiProviderType" NOT NULL,
    "base_url" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_models" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "context_window" INTEGER NOT NULL DEFAULT 8192,
    "max_output_tokens" INTEGER NOT NULL DEFAULT 4096,
    "input_cost_per_1k" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "output_cost_per_1k" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_capabilities" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "kind" "AiCapabilityKind" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_workers" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "description" TEXT,
    "status" "AiWorkerStatus" NOT NULL DEFAULT 'IDLE',
    "health" "AiWorkerHealth" NOT NULL DEFAULT 'UNKNOWN',
    "context_window" INTEGER NOT NULL DEFAULT 8192,
    "max_tokens" INTEGER NOT NULL DEFAULT 4096,
    "input_cost_per_1k" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "output_cost_per_1k" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "concurrency" INTEGER NOT NULL DEFAULT 1,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "timeout_ms" INTEGER NOT NULL DEFAULT 60000,
    "max_retries" INTEGER NOT NULL DEFAULT 2,
    "version" TEXT NOT NULL DEFAULT '1',
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_queues" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "AiQueueStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 50,
    "concurrency" INTEGER NOT NULL DEFAULT 4,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_executions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "state" "AiExecutionState" NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 50,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION,
    "input" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "mission_id" TEXT,
    "task_id" TEXT,
    "project_id" TEXT,
    "worker_id" TEXT,
    "queue_id" TEXT,
    "requested_by_id" TEXT,
    "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preparing_at" TIMESTAMP(3),
    "context_built_at" TIMESTAMP(3),
    "running_at" TIMESTAMP(3),
    "waiting_approval_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "retrying_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_prompts" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "system_instructions" TEXT,
    "user_request" TEXT,
    "output_format" TEXT,
    "constraints" JSONB NOT NULL DEFAULT '[]',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "context_package" JSONB NOT NULL DEFAULT '{}',
    "tokens_estimated" INTEGER NOT NULL DEFAULT 0,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_results" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "content" TEXT,
    "structured" JSONB,
    "finish_reason" TEXT,
    "model" TEXT,
    "confidence" DOUBLE PRECISION,
    "raw" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_costs" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "input_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "output_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usages" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "latency_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_execution_events" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "type" "AiExecutionEventType" NOT NULL,
    "message" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_execution_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_execution_logs" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "level" "AiLogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_execution_artifacts" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ArtifactType" NOT NULL DEFAULT 'DOCUMENT',
    "url" TEXT,
    "content" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_execution_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WorkerCapabilities" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WorkerCapabilities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "ai_providers_workspace_id_idx" ON "ai_providers"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_providers_workspace_id_name_key" ON "ai_providers"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "ai_models_provider_id_idx" ON "ai_models"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_models_provider_id_name_key" ON "ai_models"("provider_id", "name");

-- CreateIndex
CREATE INDEX "ai_capabilities_workspace_id_idx" ON "ai_capabilities"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_capabilities_workspace_id_kind_key" ON "ai_capabilities"("workspace_id", "kind");

-- CreateIndex
CREATE INDEX "ai_workers_workspace_id_status_idx" ON "ai_workers"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "ai_workers_workspace_id_health_idx" ON "ai_workers"("workspace_id", "health");

-- CreateIndex
CREATE UNIQUE INDEX "ai_workers_workspace_id_name_key" ON "ai_workers"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "ai_queues_workspace_id_idx" ON "ai_queues"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_queues_workspace_id_name_key" ON "ai_queues"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "ai_executions_workspace_id_state_idx" ON "ai_executions"("workspace_id", "state");

-- CreateIndex
CREATE INDEX "ai_executions_workspace_id_created_at_idx" ON "ai_executions"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_executions_mission_id_idx" ON "ai_executions"("mission_id");

-- CreateIndex
CREATE INDEX "ai_executions_queue_id_idx" ON "ai_executions"("queue_id");

-- CreateIndex
CREATE INDEX "ai_executions_worker_id_idx" ON "ai_executions"("worker_id");

-- CreateIndex
CREATE INDEX "ai_prompts_execution_id_idx" ON "ai_prompts"("execution_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_prompts_execution_id_version_key" ON "ai_prompts"("execution_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ai_results_execution_id_key" ON "ai_results"("execution_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_costs_execution_id_key" ON "ai_costs"("execution_id");

-- CreateIndex
CREATE INDEX "ai_costs_workspace_id_created_at_idx" ON "ai_costs"("workspace_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_usages_execution_id_key" ON "ai_usages"("execution_id");

-- CreateIndex
CREATE INDEX "ai_usages_workspace_id_created_at_idx" ON "ai_usages"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_execution_events_execution_id_created_at_idx" ON "ai_execution_events"("execution_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_execution_logs_execution_id_created_at_idx" ON "ai_execution_logs"("execution_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_execution_artifacts_execution_id_idx" ON "ai_execution_artifacts"("execution_id");

-- CreateIndex
CREATE INDEX "_WorkerCapabilities_B_index" ON "_WorkerCapabilities"("B");

-- AddForeignKey
ALTER TABLE "ai_providers" ADD CONSTRAINT "ai_providers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_models" ADD CONSTRAINT "ai_models_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_capabilities" ADD CONSTRAINT "ai_capabilities_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_workers" ADD CONSTRAINT "ai_workers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_workers" ADD CONSTRAINT "ai_workers_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_workers" ADD CONSTRAINT "ai_workers_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "ai_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_queues" ADD CONSTRAINT "ai_queues_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_executions" ADD CONSTRAINT "ai_executions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_executions" ADD CONSTRAINT "ai_executions_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_executions" ADD CONSTRAINT "ai_executions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_executions" ADD CONSTRAINT "ai_executions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_executions" ADD CONSTRAINT "ai_executions_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "ai_workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_executions" ADD CONSTRAINT "ai_executions_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "ai_queues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_executions" ADD CONSTRAINT "ai_executions_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_prompts" ADD CONSTRAINT "ai_prompts_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "ai_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_results" ADD CONSTRAINT "ai_results_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "ai_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_costs" ADD CONSTRAINT "ai_costs_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "ai_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_costs" ADD CONSTRAINT "ai_costs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usages" ADD CONSTRAINT "ai_usages_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "ai_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usages" ADD CONSTRAINT "ai_usages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_execution_events" ADD CONSTRAINT "ai_execution_events_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "ai_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_execution_logs" ADD CONSTRAINT "ai_execution_logs_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "ai_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_execution_artifacts" ADD CONSTRAINT "ai_execution_artifacts_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "ai_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkerCapabilities" ADD CONSTRAINT "_WorkerCapabilities_A_fkey" FOREIGN KEY ("A") REFERENCES "ai_capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkerCapabilities" ADD CONSTRAINT "_WorkerCapabilities_B_fkey" FOREIGN KEY ("B") REFERENCES "ai_workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

