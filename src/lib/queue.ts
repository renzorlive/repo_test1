/**
 * BullMQ queue infrastructure — PREPARED ONLY.
 *
 * This module sets up the connection + queue registry so that background
 * job processing (agent runs, workflow execution, artifact generation) can be
 * wired up later. No workers are started and no jobs are enqueued yet.
 *
 * To activate:
 *   1. Ensure REDIS_URL is set.
 *   2. Create workers under `src/server/workers/*`.
 *   3. Call `getQueue(name).add(...)` from the service layer.
 */
import type { ConnectionOptions, Queue } from "bullmq";
import type { Redis } from "ioredis";

export const QUEUE_NAMES = {
  AGENT_RUN: "agent-run",
  WORKFLOW_EXECUTION: "workflow-execution",
  ARTIFACT_GENERATION: "artifact-generation",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

let connection: Redis | undefined;
const queues = new Map<QueueName, Queue>();

/** Lazily create a shared ioredis connection for BullMQ. */
async function getConnection() {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not configured; queue is inactive.");
  }
  if (!connection) {
    const { Redis } = await import("ioredis");
    connection = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

/** Lazily create/return a named queue. */
export async function getQueue(name: QueueName): Promise<Queue> {
  const existing = queues.get(name);
  if (existing) return existing;

  const { Queue } = await import("bullmq");
  // BullMQ bundles its own copy of ioredis; the instance is structurally
  // compatible, so cast across the duplicated type identity.
  const connection = (await getConnection()) as unknown as ConnectionOptions;
  const queue = new Queue(name, { connection });
  queues.set(name, queue);
  return queue;
}
