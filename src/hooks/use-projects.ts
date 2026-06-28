"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Paginated, Project } from "@/types";
import type { CreateProjectInput } from "@/validations";

/**
 * React Query hooks for projects. The dashboard currently renders mock data;
 * these are the wiring points to switch each page over to live data.
 */
export const projectKeys = {
  all: (workspaceId: string) => ["workspaces", workspaceId, "projects"] as const,
};

export function useProjects(workspaceId: string) {
  return useQuery({
    queryKey: projectKeys.all(workspaceId),
    queryFn: () =>
      apiClient<Paginated<Project>>(
        `/api/workspaces/${workspaceId}/projects`,
      ),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateProject(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      apiClient<Project>(`/api/workspaces/${workspaceId}/projects`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.all(workspaceId),
      });
    },
  });
}
