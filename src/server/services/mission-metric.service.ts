import { missionMetricRepository } from "@/server/repositories";
import { requireMissionAccess } from "@/server/services/mission-access";
import { missionEvents } from "@/server/events/mission-events";
import type { RecordMetricInput } from "@/validations";

export const missionMetricService = {
  async list(workspaceId: string, missionId: string) {
    await requireMissionAccess(workspaceId, missionId, "view");
    return missionMetricRepository.listByMission(missionId);
  },

  async record(
    workspaceId: string,
    missionId: string,
    input: RecordMetricInput,
  ) {
    const { actor } = await requireMissionAccess(
      workspaceId,
      missionId,
      "contribute",
    );
    const metric = await missionMetricRepository.create({
      mission: { connect: { id: missionId } },
      key: input.key,
      label: input.label,
      value: input.value,
      unit: input.unit,
      target: input.target,
    });
    await missionEvents.emit({
      missionId,
      type: "METRIC_RECORDED",
      title: `Metric "${input.label}" recorded: ${input.value}${input.unit ?? ""}`,
      actor,
      metadata: { key: input.key, value: input.value },
    });
    return metric;
  },
};
