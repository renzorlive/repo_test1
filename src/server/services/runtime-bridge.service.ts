import type { ArtifactType, RuntimeArtifactKind } from "@/types";
import {
  aiExecutionRepository,
  missionRepository,
  runtimeExecutionRepository,
} from "@/server/repositories";
import { requireRuntimeAccess } from "@/server/services/runtime-access";
import { runtimeEngine } from "@/server/runtime/runtime-engine";
import { executionEngine } from "@/server/ai/execution-engine";
import { missionEvents } from "@/server/events/mission-events";
import { NotFoundError } from "@/server/errors";
import type { PromptMessage } from "@/server/ai/types";

/** Map a detected runtime artifact kind to a mission artifact type. */
const ARTIFACT_TYPE: Record<RuntimeArtifactKind, ArtifactType> = {
  FILE: "CODE",
  DIFF: "CODE",
  TEST_REPORT: "REPORT",
  LOG: "DOCUMENT",
  OTHER: "OTHER",
};

/**
 * RuntimeBridge — the ONLY place that connects the mission-agnostic Runtime
 * Layer to the orchestration layer. The runtime never imports this; instead the
 * agent service calls `onRuntimeFinished` after a job completes, and the UI
 * calls `dispatchAiExecution` to send an AI execution to a machine.
 */
export const runtimeBridgeService = {
  /**
   * Send an existing AI execution to a host to run on its runtime (Claude
   * Code). Builds a generic job from the execution's prompt — the runtime never
   * sees the mission.
   */
  async dispatchAiExecution(
    workspaceId: string,
    aiExecutionId: string,
    hostId: string,
  ) {
    await requireRuntimeAccess(workspaceId, "operate");

    const aiExecution = await aiExecutionRepository.findCore(aiExecutionId);
    if (!aiExecution || aiExecution.workspaceId !== workspaceId) {
      throw new NotFoundError("AI execution not found");
    }

    const prompt = await aiExecutionRepository.latestPrompt(aiExecutionId);
    const messages = (prompt?.messages ?? []) as unknown as PromptMessage[];
    const userMessage = messages.find((m) => m.role === "user")?.content;
    const input = (aiExecution.input ?? {}) as { userRequest?: string };

    const execution = await runtimeEngine.enqueue({
      workspaceId,
      hostId,
      aiExecutionId,
      command: {
        name: aiExecution.title,
        command: "claude",
        args: ["-p"],
        env: {},
        prompt: userMessage ?? input.userRequest ?? aiExecution.title,
        timeoutMs: 600000,
      },
    });

    return runtimeExecutionRepository.findAggregate(execution.id);
  },

  /**
   * Called when a runtime job finishes. If the job was bridged to an AI
   * execution, store detected files as mission artifacts and roll the result
   * back up into the mission timeline.
   */
  async onRuntimeFinished(executionId: string) {
    const execution = await runtimeExecutionRepository.findAggregate(executionId);
    if (!execution?.aiExecution) return; // generic job — nothing to bridge

    const aiExecutionId = execution.aiExecution.id;
    const missionId = execution.aiExecution.missionId;
    const succeeded = execution.status === "SUCCEEDED";

    // 1. Store detected files as mission artifacts.
    if (missionId) {
      const mission = await missionRepository.findCore(missionId);
      if (mission) {
        for (const artifact of execution.artifacts) {
          if (artifact.missionArtifactId) continue;
          const created = await missionRepository.createArtifact({
            name: artifact.path,
            type: ARTIFACT_TYPE[artifact.kind],
            project: { connect: { id: mission.projectId } },
            mission: { connect: { id: missionId } },
            content: { change: artifact.change, sizeBytes: artifact.sizeBytes },
          });
          await runtimeExecutionRepository.markArtifactStored(artifact.id, created.id);
        }
      }
    }

    // 2. Roll the result up into the AI execution (only if still running).
    const ai = await aiExecutionRepository.findCore(aiExecutionId);
    if (ai?.state === "RUNNING") {
      if (succeeded) {
        await executionEngine.complete(aiExecutionId, {
          content: `Completed on ${execution.host?.name ?? "a host"} (exit ${execution.exitCode ?? 0}). ${execution.artifacts.length} file change(s).`,
          confidence: 0.8,
          inputTokens: 0,
          outputTokens: 0,
        });
      } else {
        await executionEngine.fail(
          aiExecutionId,
          execution.error ?? `Runtime job failed (exit ${execution.exitCode ?? 1})`,
          false,
        );
      }
    }

    // 3. Mission timeline event.
    if (missionId) {
      await missionEvents.emit({
        missionId,
        type: succeeded ? "EXECUTION_COMPLETED" : "AI_SESSION_FAILED",
        title: succeeded
          ? `Claude Code finished on ${execution.host?.name ?? "a host"}`
          : `Claude Code job failed on ${execution.host?.name ?? "a host"}`,
        actor: { type: "SYSTEM", name: execution.runtime?.type ?? "Runtime" },
        metadata: {
          runtimeExecutionId: executionId,
          exitCode: execution.exitCode,
          artifacts: execution.artifacts.length,
        },
      });
    }
  },
};
