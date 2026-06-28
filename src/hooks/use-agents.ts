"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Agent, Paginated } from "@/types";
import type { CreateAgentInput } from "@/validations";

export const agentKeys = {
  all: (workspaceId: string) => ["workspaces", workspaceId, "agents"] as const,
};

export function useAgents(workspaceId: string) {
  return useQuery({
    queryKey: agentKeys.all(workspaceId),
    queryFn: () =>
      apiClient<Paginated<Agent>>(`/api/workspaces/${workspaceId}/agents`),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateAgent(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAgentInput) =>
      apiClient<Agent>(`/api/workspaces/${workspaceId}/agents`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all(workspaceId) });
    },
  });
}
