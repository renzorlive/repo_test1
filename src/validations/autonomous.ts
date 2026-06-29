import { z } from "zod";

export const missionModeEnum = z.enum(["FOUNDER", "ADVANCED"]);
export const missionAutonomyEnum = z.enum([
  "MANUAL",
  "SUPERVISED",
  "AUTONOMOUS",
]);

/**
 * The entire Founder Mode input: one business objective. Everything else —
 * plan, milestones, tasks, workers, context, prompts — is decided by the brain.
 */
export const launchMissionSchema = z.object({
  objective: z
    .string()
    .min(4, "Describe what you want to build")
    .max(2000),
  projectId: z.string().cuid().optional(),
  autonomy: missionAutonomyEnum.default("SUPERVISED"),
});

export const setMissionModeSchema = z.object({
  mode: missionModeEnum,
});

/** The product nucleus input: one sentence, e.g. "Continue GOCO". */
export const continueSchema = z.object({
  sentence: z.string().min(2, "Say what to continue").max(2000),
});

export type LaunchMissionInput = z.infer<typeof launchMissionSchema>;
export type SetMissionModeInput = z.infer<typeof setMissionModeSchema>;
export type ContinueInput = z.infer<typeof continueSchema>;
