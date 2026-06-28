import {
  missionDependencyRepository,
  missionRepository,
} from "@/server/repositories";
import { requireMissionAccess } from "@/server/services/mission-access";
import { missionEvents } from "@/server/events/mission-events";
import { AppError, NotFoundError } from "@/server/errors";
import type { CreateDependencyInput } from "@/validations";

export const missionDependencyService = {
  async create(
    workspaceId: string,
    missionId: string,
    input: CreateDependencyInput,
  ) {
    const { actor } = await requireMissionAccess(
      workspaceId,
      missionId,
      "edit",
    );

    if (input.dependsOnId === missionId) {
      throw new AppError(
        "A mission cannot depend on itself",
        422,
        "SELF_DEPENDENCY",
      );
    }

    // The dependency target must live in the same workspace.
    const target = await missionRepository.findCore(input.dependsOnId);
    if (!target || target.workspaceId !== workspaceId) {
      throw new NotFoundError("Target mission not found");
    }

    const existing = await missionDependencyRepository.findEdge(
      missionId,
      input.dependsOnId,
    );
    if (existing) {
      throw new AppError("Dependency already exists", 409, "DUPLICATE");
    }

    const dependency = await missionDependencyRepository.create({
      mission: { connect: { id: missionId } },
      dependsOn: { connect: { id: input.dependsOnId } },
      type: input.type,
      note: input.note,
    });

    await missionEvents.emit({
      missionId,
      type: "DEPENDENCY_ADDED",
      title: `Dependency added on "${target.title}"`,
      actor,
      metadata: { dependsOnId: target.id, type: input.type },
    });

    return dependency;
  },
};
