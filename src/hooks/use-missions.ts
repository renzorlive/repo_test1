"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Mission } from "@/types";
import type { CreateMissionInput } from "@/validations";

export const missionKeys = {
  all: (workspaceId: string) =>
    ["workspaces", workspaceId, "missions"] as const,
};

export function useMissions(workspaceId: string) {
  return useQuery({
    queryKey: missionKeys.all(workspaceId),
    queryFn: () =>
      apiClient<Mission[]>(`/api/workspaces/${workspaceId}/missions`),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateMission(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMissionInput) =>
      apiClient<Mission>(`/api/workspaces/${workspaceId}/missions`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: missionKeys.all(workspaceId),
      });
    },
  });
}
