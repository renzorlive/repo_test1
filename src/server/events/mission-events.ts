import type { Prisma } from "@prisma/client";
import { missionActivityRepository } from "@/server/repositories";
import type { ActivityWithActor } from "@/server/repositories";
import type { ActivityType, ActorType } from "@/types";

/**
 * MissionEvents — the single chokepoint through which every meaningful mission
 * change becomes a durable, append-only activity row.
 *
 * Services never insert activity directly; they call `missionEvents.emit`. The
 * dispatcher also fans out to in-process subscribers, which is the seam a
 * future SSE/WebSocket bridge or BullMQ publisher plugs into for live
 * timelines — no service code changes required when that lands.
 */
export interface ActivityActor {
  type: ActorType;
  id?: string | null;
  name?: string | null;
}

export interface MissionEventInput {
  missionId: string;
  type: ActivityType;
  title: string;
  description?: string;
  actor?: ActivityActor;
  metadata?: Record<string, unknown>;
}

type ActivityListener = (activity: ActivityWithActor) => void;

const listeners = new Set<ActivityListener>();

export const missionEvents = {
  /** Register a live listener. Returns an unsubscribe function. */
  subscribe(listener: ActivityListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Persist an activity and notify subscribers. */
  async emit(input: MissionEventInput): Promise<ActivityWithActor> {
    const activity = await missionActivityRepository.create({
      mission: { connect: { id: input.missionId } },
      type: input.type,
      title: input.title,
      description: input.description,
      actorType: input.actor?.type ?? "SYSTEM",
      actorName: input.actor?.name ?? undefined,
      ...(input.actor?.id
        ? { actor: { connect: { id: input.actor.id } } }
        : {}),
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    });

    for (const listener of listeners) {
      // Listener isolation: one bad subscriber must not break the emit.
      try {
        listener(activity);
      } catch {
        /* swallow — delivery is best-effort for live updates */
      }
    }

    return activity;
  },
};
