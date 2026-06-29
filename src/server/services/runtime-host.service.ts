import { randomBytes } from "node:crypto";
import { runtimeHostRepository } from "@/server/repositories";
import { requireRuntimeAccess } from "@/server/services/runtime-access";
import { NotFoundError } from "@/server/errors";
import type { RegisterHostInput } from "@/validations";

function mintToken(): string {
  return `rnz_${randomBytes(24).toString("hex")}`;
}

/** Hosts (machines) registry. */
export const runtimeHostService = {
  async list(workspaceId: string) {
    await requireRuntimeAccess(workspaceId, "view");
    return runtimeHostRepository.listByWorkspace(workspaceId);
  },

  async getById(workspaceId: string, hostId: string) {
    await requireRuntimeAccess(workspaceId, "view");
    const host = await runtimeHostRepository.findById(hostId);
    if (!host || host.workspaceId !== workspaceId) {
      throw new NotFoundError("Host not found");
    }
    return host;
  },

  /**
   * Register a machine. Creates the host, a runtime on it, and a session whose
   * token the remote agent uses to connect. The token is returned ONCE.
   */
  async register(workspaceId: string, input: RegisterHostInput) {
    await requireRuntimeAccess(workspaceId, "manage");
    const token = mintToken();

    const { host, runtime, session } =
      await runtimeHostRepository.createWithRuntime({
        workspaceId,
        host: {
          name: input.name,
          hostname: input.hostname,
          os: input.os,
          arch: input.arch,
          cpuCores: input.cpuCores,
          cpuModel: input.cpuModel,
          memoryMb: input.memoryMb,
          gpu: input.gpu,
          agentVersion: input.agentVersion,
          status: "OFFLINE",
        },
        runtimeType: input.runtimeType,
        runtimeName: `${input.runtimeType.replace(/_/g, " ")} @ ${input.name}`,
        capabilities: input.capabilities,
        token,
      });

    return { host, runtime, token, sessionId: session.id };
  },
};
