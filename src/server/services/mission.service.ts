import { missionRepository, projectRepository } from "@/server/repositories";
import { requireMembership } from "@/server/services/access";
import { NotFoundError } from "@/server/errors";
import type { CreateMissionInput, UpdateMissionInput } from "@/validations";

/** Mission service — authorization flows through the parent project. */
export const missionService = {
  async listByWorkspace(workspaceId: string) {
    await requireMembership(workspaceId);
    return missionRepository.findManyByWorkspace(workspaceId);
  },

  async listByProject(workspaceId: string, projectId: string) {
    await this.assertProjectInWorkspace(workspaceId, projectId);
    const [items] = await missionRepository.findManyByProject(projectId);
    return items;
  },

  async create(workspaceId: string, input: CreateMissionInput) {
    await this.assertProjectInWorkspace(workspaceId, input.projectId);
    const { projectId, ...rest } = input;
    return missionRepository.create({
      ...rest,
      project: { connect: { id: projectId } },
    });
  },

  async update(workspaceId: string, id: string, input: UpdateMissionInput) {
    const mission = await missionRepository.findById(id);
    if (!mission) throw new NotFoundError("Mission not found");
    await this.assertProjectInWorkspace(workspaceId, mission.projectId);
    return missionRepository.update(id, input);
  },

  async remove(workspaceId: string, id: string) {
    const mission = await missionRepository.findById(id);
    if (!mission) throw new NotFoundError("Mission not found");
    await this.assertProjectInWorkspace(workspaceId, mission.projectId);
    return missionRepository.remove(id);
  },

  /** Internal guard: project must belong to the workspace the user can access. */
  async assertProjectInWorkspace(workspaceId: string, projectId: string) {
    await requireMembership(workspaceId);
    const project = await projectRepository.findById(projectId);
    if (!project || project.workspaceId !== workspaceId) {
      throw new NotFoundError("Project not found");
    }
    return project;
  },
};
