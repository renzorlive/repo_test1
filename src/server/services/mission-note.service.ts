import { missionNoteRepository } from "@/server/repositories";
import { requireMissionAccess } from "@/server/services/mission-access";
import { missionEvents } from "@/server/events/mission-events";
import type { CreateNoteInput } from "@/validations";

export const missionNoteService = {
  async list(workspaceId: string, missionId: string) {
    await requireMissionAccess(workspaceId, missionId, "view");
    return missionNoteRepository.listByMission(missionId);
  },

  async create(
    workspaceId: string,
    missionId: string,
    input: CreateNoteInput,
  ) {
    const { user, actor } = await requireMissionAccess(
      workspaceId,
      missionId,
      "contribute",
    );
    const note = await missionNoteRepository.create({
      mission: { connect: { id: missionId } },
      author: { connect: { id: user.id } },
      body: input.body,
      pinned: input.pinned,
    });
    await missionEvents.emit({
      missionId,
      type: "NOTE_ADDED",
      title: `Note added`,
      actor,
    });
    return note;
  },
};
