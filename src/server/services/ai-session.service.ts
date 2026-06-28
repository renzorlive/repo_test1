import type { Prisma } from "@prisma/client";
import { aiSessionRepository } from "@/server/repositories";
import { requireMissionAccess } from "@/server/services/mission-access";
import { missionEvents } from "@/server/events/mission-events";
import { NotFoundError } from "@/server/errors";
import type {
  CreateAiSessionInput,
  UpdateAiSessionInput,
} from "@/validations";

/**
 * AiSessionService — manages AI working sessions against a mission. No model
 * is actually invoked yet (no AI integration); sessions are records with
 * token + cost accounting, ready for a future executor to drive.
 */
export const aiSessionService = {
  async list(workspaceId: string, missionId: string) {
    await requireMissionAccess(workspaceId, missionId, "view");
    return aiSessionRepository.listByMission(missionId);
  },

  async start(
    workspaceId: string,
    missionId: string,
    input: CreateAiSessionInput,
  ) {
    const { actor } = await requireMissionAccess(
      workspaceId,
      missionId,
      "contribute",
    );
    const session = await aiSessionRepository.create({
      mission: { connect: { id: missionId } },
      title: input.title,
      model: input.model,
      summary: input.summary,
      status: "RUNNING",
      startedAt: new Date(),
      ...(input.agentId ? { agent: { connect: { id: input.agentId } } } : {}),
    });
    await missionEvents.emit({
      missionId,
      type: "AI_SESSION_STARTED",
      title: `AI session "${session.title}" started`,
      actor: input.agentId ? { type: "AGENT", name: input.title } : actor,
      metadata: { sessionId: session.id, model: input.model },
    });
    return session;
  },

  async update(
    workspaceId: string,
    missionId: string,
    sessionId: string,
    input: UpdateAiSessionInput,
  ) {
    const { actor } = await requireMissionAccess(
      workspaceId,
      missionId,
      "contribute",
    );
    const existing = await aiSessionRepository.findById(sessionId);
    if (!existing || existing.missionId !== missionId) {
      throw new NotFoundError("AI session not found");
    }

    const data: Prisma.AiSessionUpdateInput = {
      status: input.status,
      summary: input.summary,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      cost: input.cost,
    };

    const terminal =
      input.status === "COMPLETED" ||
      input.status === "FAILED" ||
      input.status === "CANCELLED";
    if (terminal) data.completedAt = new Date();

    const session = await aiSessionRepository.update(sessionId, data);

    if (input.status === "COMPLETED") {
      await missionEvents.emit({
        missionId,
        type: "AI_SESSION_COMPLETED",
        title: `AI session "${session.title}" completed`,
        actor,
        metadata: { sessionId, cost: session.cost },
      });
    } else if (input.status === "FAILED") {
      await missionEvents.emit({
        missionId,
        type: "AI_SESSION_FAILED",
        title: `AI session "${session.title}" failed`,
        actor,
        metadata: { sessionId },
      });
    }

    return session;
  },
};
