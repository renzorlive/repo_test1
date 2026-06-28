import { projectRepository } from "@/server/repositories";
import { requireMembership } from "@/server/services/access";
import { NotFoundError } from "@/server/errors";
import type { Paginated } from "@/types";
import type { CreateProjectInput, UpdateProjectInput } from "@/validations";
import type { ListQuery } from "@/validations/common";

/**
 * Project service — business logic + authorization for projects.
 * Always validates workspace membership before touching the repository.
 */
export const projectService = {
  async list(
    workspaceId: string,
    query: ListQuery,
  ): Promise<Paginated<Awaited<ReturnType<typeof projectRepository.findById>>>> {
    await requireMembership(workspaceId);
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await projectRepository.findManyByWorkspace(
      workspaceId,
      { skip, take: query.pageSize, search: query.search },
    );
    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.ceil(total / query.pageSize),
    };
  },

  async getById(workspaceId: string, id: string) {
    await requireMembership(workspaceId);
    const project = await projectRepository.findById(id);
    if (!project || project.workspaceId !== workspaceId) {
      throw new NotFoundError("Project not found");
    }
    return project;
  },

  async create(workspaceId: string, input: CreateProjectInput) {
    await requireMembership(workspaceId);
    return projectRepository.create(workspaceId, input);
  },

  async update(workspaceId: string, id: string, input: UpdateProjectInput) {
    await this.getById(workspaceId, id);
    return projectRepository.update(id, input);
  },

  async remove(workspaceId: string, id: string) {
    await this.getById(workspaceId, id);
    return projectRepository.remove(id);
  },
};
