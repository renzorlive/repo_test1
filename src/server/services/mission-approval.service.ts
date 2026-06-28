import type { ActivityType, ApprovalStatus } from "@/types";
import { missionApprovalRepository } from "@/server/repositories";
import { requireMissionAccess } from "@/server/services/mission-access";
import { missionEvents } from "@/server/events/mission-events";
import { NotFoundError } from "@/server/errors";
import type {
  CreateApprovalInput,
  DecideApprovalInput,
} from "@/validations";

/** Map a reviewer decision to its persisted status + emitted activity type. */
const DECISION_MAP: Record<
  DecideApprovalInput["decision"],
  { status: ApprovalStatus; activity: ActivityType; verb: string }
> = {
  APPROVED: { status: "APPROVED", activity: "APPROVAL_ACCEPTED", verb: "approved" },
  REJECTED: { status: "REJECTED", activity: "APPROVAL_REJECTED", verb: "rejected" },
  CHANGES_REQUESTED: {
    status: "CHANGES_REQUESTED",
    activity: "APPROVAL_CHANGES_REQUESTED",
    verb: "requested changes on",
  },
};

/**
 * MissionApprovalService — the human approval gate. Requesting needs
 * contributor access; deciding needs approver (ADMIN+) access. Every
 * transition is recorded on the mission timeline.
 */
export const missionApprovalService = {
  async list(workspaceId: string, missionId: string) {
    await requireMissionAccess(workspaceId, missionId, "view");
    return missionApprovalRepository.listByMission(missionId);
  },

  async request(
    workspaceId: string,
    missionId: string,
    input: CreateApprovalInput,
  ) {
    const { user, actor } = await requireMissionAccess(
      workspaceId,
      missionId,
      "contribute",
    );

    const approval = await missionApprovalRepository.create({
      mission: { connect: { id: missionId } },
      title: input.title,
      description: input.description,
      status: "PENDING",
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      requestedBy: { connect: { id: user.id } },
      ...(input.reviewerId
        ? { reviewer: { connect: { id: input.reviewerId } } }
        : {}),
    });

    await missionEvents.emit({
      missionId,
      type: "APPROVAL_REQUESTED",
      title: `Approval requested: "${approval.title}"`,
      actor,
      metadata: { approvalId: approval.id },
    });

    return approval;
  },

  async decide(
    workspaceId: string,
    missionId: string,
    approvalId: string,
    input: DecideApprovalInput,
  ) {
    const { user, actor } = await requireMissionAccess(
      workspaceId,
      missionId,
      "approve",
    );

    const existing = await missionApprovalRepository.findById(approvalId);
    if (!existing || existing.missionId !== missionId) {
      throw new NotFoundError("Approval not found");
    }

    const mapped = DECISION_MAP[input.decision];
    const approval = await missionApprovalRepository.update(approvalId, {
      status: mapped.status,
      comment: input.comment,
      decidedAt: new Date(),
      reviewer: { connect: { id: user.id } },
    });

    await missionEvents.emit({
      missionId,
      type: mapped.activity,
      title: `Reviewer ${mapped.verb} "${approval.title}"`,
      actor,
      metadata: { approvalId, decision: input.decision },
    });

    return approval;
  },
};
