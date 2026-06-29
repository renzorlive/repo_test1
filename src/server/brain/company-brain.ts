import { missionRepository, aiWorkerRepository } from "@/server/repositories";
import type { MissionAggregate } from "@/server/repositories";
import { gatherMissionContextSources } from "@/server/ai/context-sources";
import { contextBuilder } from "@/server/ai/context-builder";
import {
  assessConfidence,
  confidenceInputFromMission,
  type ConfidenceResult,
} from "@/lib/confidence";
import { NotFoundError } from "@/server/errors";

/**
 * The Company Brain.
 *
 * Architecturally, Memory comes BEFORE the AI. The old "Context Builder" is just
 * ONE function of a larger organ with five responsibilities:
 *
 *   1. Memory       — what the company knows (decisions, code, artifacts,
 *                     conversations…). Today: the mission/project history;
 *                     tomorrow: RNZ Memory across many sources (see
 *                     docs/COMPANY_BRAIN.md).
 *   2. Retrieval    — pull the *relevant* slice for an intent (`retrieveContext`).
 *   3. Planning     — turn an objective into a plan (the Mission Brain).
 *   4. Decision     — know when it can act vs must ask (`assess`, Confidence).
 *   5. Learning     — capture outcomes back into memory (the activity timeline,
 *                     decisions and artifacts are already this substrate).
 *
 * This module is the seam those capabilities live behind. Confidence (decision
 * making) is implemented; the rest delegate to existing seams and grow into the
 * Company Brain Alpha milestone.
 */
export const companyBrain = {
  /** Retrieval: assemble the relevant context package for a mission. */
  async retrieveContext(workspaceId: string, missionId: string) {
    const sources = await gatherMissionContextSources(workspaceId, missionId);
    return contextBuilder.build(sources);
  },

  /** Decision making: score readiness to execute from explainable signals. */
  assess(
    mission: MissionAggregate,
    facts?: { hasWorkers?: boolean; hasDeployTarget?: boolean; hasProdCredentials?: boolean },
  ): ConfidenceResult {
    return assessConfidence(confidenceInputFromMission(mission, facts));
  },

  /** Load + assess a mission's confidence, including live runtime facts. */
  async confidenceForMission(missionId: string): Promise<ConfidenceResult> {
    const mission = await missionRepository.findAggregate(missionId);
    if (!mission) throw new NotFoundError("Mission not found");
    const workers = await aiWorkerRepository.listByWorkspace(mission.workspaceId);
    return this.assess(mission, { hasWorkers: workers.length > 0 });
  },
};
