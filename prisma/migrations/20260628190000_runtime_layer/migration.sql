-- CreateEnum
CREATE TYPE "RuntimeType" AS ENUM ('CLAUDE_CODE', 'CODEX_CLI', 'GEMINI_CLI', 'CURSOR_CLI', 'LOCAL_AGENT', 'DOCKER', 'SSH');

-- CreateEnum
CREATE TYPE "RuntimeStatus" AS ENUM ('OFFLINE', 'CONNECTING', 'ONLINE', 'BUSY', 'DRAINING', 'ERROR');

-- CreateEnum
CREATE TYPE "HostStatus" AS ENUM ('OFFLINE', 'ONLINE', 'BUSY', 'UNREACHABLE');

-- CreateEnum
CREATE TYPE "RuntimeSessionStatus" AS ENUM ('CONNECTING', 'CONNECTED', 'DISCONNECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RuntimeExecutionStatus" AS ENUM ('PENDING', 'DISPATCHED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'TIMED_OUT');

-- CreateEnum
CREATE TYPE "RuntimeCapabilityKind" AS ENUM ('SHELL', 'FILE_SYSTEM', 'GIT', 'CODE_EXECUTION', 'BROWSER', 'DOCKER', 'GPU', 'NETWORK');

-- CreateEnum
CREATE TYPE "RuntimeLogStream" AS ENUM ('STDOUT', 'STDERR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RuntimeArtifactChange" AS ENUM ('CREATED', 'MODIFIED', 'DELETED');

-- CreateEnum
CREATE TYPE "RuntimeArtifactKind" AS ENUM ('FILE', 'TEST_REPORT', 'LOG', 'DIFF', 'OTHER');

-- CreateEnum
CREATE TYPE "RuntimeTerminalStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "runtime_hosts" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "arch" TEXT,
    "cpu_cores" INTEGER NOT NULL DEFAULT 1,
    "cpu_model" TEXT,
    "memory_mb" INTEGER NOT NULL DEFAULT 0,
    "gpu" TEXT,
    "status" "HostStatus" NOT NULL DEFAULT 'OFFLINE',
    "agent_version" TEXT,
    "last_seen_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "runtime_hosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runtimes" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "type" "RuntimeType" NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "status" "RuntimeStatus" NOT NULL DEFAULT 'OFFLINE',
    "max_concurrency" INTEGER NOT NULL DEFAULT 1,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "runtimes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runtime_capabilities" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "kind" "RuntimeCapabilityKind" NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "runtime_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runtime_sessions" (
    "id" TEXT NOT NULL,
    "runtime_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "RuntimeSessionStatus" NOT NULL DEFAULT 'CONNECTING',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_heartbeat_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "runtime_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runtime_commands" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "args" JSONB NOT NULL DEFAULT '[]',
    "cwd" TEXT,
    "env" JSONB NOT NULL DEFAULT '{}',
    "prompt" TEXT,
    "timeout_ms" INTEGER NOT NULL DEFAULT 600000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "runtime_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runtime_executions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "command_id" TEXT NOT NULL,
    "runtime_id" TEXT,
    "host_id" TEXT,
    "session_id" TEXT,
    "ai_execution_id" TEXT,
    "status" "RuntimeExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "exit_code" INTEGER,
    "error" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "max_attempts" INTEGER NOT NULL DEFAULT 1,
    "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatched_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "last_heartbeat_at" TIMESTAMP(3),
    "cancel_requested" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "runtime_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runtime_heartbeats" (
    "id" TEXT NOT NULL,
    "host_id" TEXT,
    "execution_id" TEXT,
    "cpu_pct" DOUBLE PRECISION,
    "mem_mb" INTEGER,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "runtime_heartbeats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runtime_artifacts" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "change" "RuntimeArtifactChange" NOT NULL DEFAULT 'MODIFIED',
    "kind" "RuntimeArtifactKind" NOT NULL DEFAULT 'FILE',
    "size_bytes" INTEGER,
    "url" TEXT,
    "content" JSONB NOT NULL DEFAULT '{}',
    "mission_artifact_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "runtime_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runtime_logs" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "stream" "RuntimeLogStream" NOT NULL DEFAULT 'STDOUT',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "runtime_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "runtime_terminals" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "status" "RuntimeTerminalStatus" NOT NULL DEFAULT 'OPEN',
    "cols" INTEGER NOT NULL DEFAULT 80,
    "rows" INTEGER NOT NULL DEFAULT 24,
    "exit_code" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "runtime_terminals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RuntimeCapabilities" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RuntimeCapabilities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "runtime_hosts_workspace_id_idx" ON "runtime_hosts"("workspace_id");

-- CreateIndex
CREATE INDEX "runtime_hosts_workspace_id_status_idx" ON "runtime_hosts"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "runtimes_workspace_id_idx" ON "runtimes"("workspace_id");

-- CreateIndex
CREATE INDEX "runtimes_host_id_idx" ON "runtimes"("host_id");

-- CreateIndex
CREATE INDEX "runtimes_workspace_id_type_status_idx" ON "runtimes"("workspace_id", "type", "status");

-- CreateIndex
CREATE INDEX "runtime_capabilities_workspace_id_idx" ON "runtime_capabilities"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "runtime_capabilities_workspace_id_kind_key" ON "runtime_capabilities"("workspace_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "runtime_sessions_token_key" ON "runtime_sessions"("token");

-- CreateIndex
CREATE INDEX "runtime_sessions_runtime_id_idx" ON "runtime_sessions"("runtime_id");

-- CreateIndex
CREATE INDEX "runtime_sessions_status_idx" ON "runtime_sessions"("status");

-- CreateIndex
CREATE INDEX "runtime_commands_workspace_id_idx" ON "runtime_commands"("workspace_id");

-- CreateIndex
CREATE INDEX "runtime_executions_workspace_id_status_idx" ON "runtime_executions"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "runtime_executions_runtime_id_idx" ON "runtime_executions"("runtime_id");

-- CreateIndex
CREATE INDEX "runtime_executions_host_id_idx" ON "runtime_executions"("host_id");

-- CreateIndex
CREATE INDEX "runtime_executions_ai_execution_id_idx" ON "runtime_executions"("ai_execution_id");

-- CreateIndex
CREATE INDEX "runtime_heartbeats_host_id_created_at_idx" ON "runtime_heartbeats"("host_id", "created_at");

-- CreateIndex
CREATE INDEX "runtime_heartbeats_execution_id_created_at_idx" ON "runtime_heartbeats"("execution_id", "created_at");

-- CreateIndex
CREATE INDEX "runtime_artifacts_execution_id_idx" ON "runtime_artifacts"("execution_id");

-- CreateIndex
CREATE INDEX "runtime_logs_execution_id_sequence_idx" ON "runtime_logs"("execution_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "runtime_terminals_execution_id_key" ON "runtime_terminals"("execution_id");

-- CreateIndex
CREATE INDEX "_RuntimeCapabilities_B_index" ON "_RuntimeCapabilities"("B");

-- AddForeignKey
ALTER TABLE "runtime_hosts" ADD CONSTRAINT "runtime_hosts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtimes" ADD CONSTRAINT "runtimes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtimes" ADD CONSTRAINT "runtimes_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "runtime_hosts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtime_capabilities" ADD CONSTRAINT "runtime_capabilities_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtime_sessions" ADD CONSTRAINT "runtime_sessions_runtime_id_fkey" FOREIGN KEY ("runtime_id") REFERENCES "runtimes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtime_sessions" ADD CONSTRAINT "runtime_sessions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "runtime_hosts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtime_commands" ADD CONSTRAINT "runtime_commands_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtime_executions" ADD CONSTRAINT "runtime_executions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtime_executions" ADD CONSTRAINT "runtime_executions_command_id_fkey" FOREIGN KEY ("command_id") REFERENCES "runtime_commands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtime_executions" ADD CONSTRAINT "runtime_executions_runtime_id_fkey" FOREIGN KEY ("runtime_id") REFERENCES "runtimes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtime_executions" ADD CONSTRAINT "runtime_executions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "runtime_hosts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtime_executions" ADD CONSTRAINT "runtime_executions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "runtime_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtime_executions" ADD CONSTRAINT "runtime_executions_ai_execution_id_fkey" FOREIGN KEY ("ai_execution_id") REFERENCES "ai_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtime_heartbeats" ADD CONSTRAINT "runtime_heartbeats_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "runtime_hosts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtime_heartbeats" ADD CONSTRAINT "runtime_heartbeats_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "runtime_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtime_artifacts" ADD CONSTRAINT "runtime_artifacts_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "runtime_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtime_logs" ADD CONSTRAINT "runtime_logs_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "runtime_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runtime_terminals" ADD CONSTRAINT "runtime_terminals_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "runtime_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RuntimeCapabilities" ADD CONSTRAINT "_RuntimeCapabilities_A_fkey" FOREIGN KEY ("A") REFERENCES "runtimes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RuntimeCapabilities" ADD CONSTRAINT "_RuntimeCapabilities_B_fkey" FOREIGN KEY ("B") REFERENCES "runtime_capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

