/**
 * Shared domain types. Re-export Prisma model + enum types so the rest of the
 * app imports domain types from a single, stable location rather than reaching
 * into `@prisma/client` everywhere.
 */
export type {
  Workspace,
  User,
  Membership,
  Project,
  Mission,
  Epic,
  Task,
  Agent,
  Workflow,
  Decision,
  Artifact,
  // Mission Engine entities
  MissionContext,
  MissionTimeline,
  MissionApproval,
  MissionMetric,
  MissionNote,
  MissionDependency,
  MissionExecution,
  MissionActivity,
  AiSession,
  // AI Orchestrator entities
  AiProvider,
  AiModel,
  AiCapability,
  AiWorker,
  AiQueue,
  AiExecution,
  AiPrompt,
  AiResult,
  AiCost,
  AiUsage,
  AiExecutionEvent,
  AiExecutionLog,
  AiExecutionArtifact,
  // Runtime Layer entities
  RuntimeHost,
  Runtime,
  RuntimeCapability,
  RuntimeSession,
  RuntimeCommand,
  RuntimeExecution,
  RuntimeHeartbeat,
  RuntimeArtifact,
  RuntimeLog,
  RuntimeTerminal,
  // Enums
  Role,
  ProjectStatus,
  MissionStatus,
  MissionHealth,
  EpicStatus,
  TaskStatus,
  Priority,
  AgentType,
  AgentStatus,
  WorkflowStatus,
  DecisionStatus,
  ArtifactType,
  ApprovalStatus,
  ActivityType,
  ActorType,
  AiSessionStatus,
  ExecutionStatus,
  DependencyType,
  TimelineStatus,
  AiProviderType,
  AiCapabilityKind,
  AiWorkerStatus,
  AiWorkerHealth,
  AiExecutionState,
  AiExecutionEventType,
  AiQueueStatus,
  AiLogLevel,
  RuntimeType,
  RuntimeStatus,
  HostStatus,
  RuntimeSessionStatus,
  RuntimeExecutionStatus,
  RuntimeCapabilityKind,
  RuntimeLogStream,
  RuntimeArtifactChange,
  RuntimeArtifactKind,
  RuntimeTerminalStatus,
} from "@prisma/client";

/** Generic paginated result wrapper returned by list services. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/** Shape returned by every API route on success. */
export interface ApiSuccess<T> {
  data: T;
}

/** Shape returned by every API route on error. */
export interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}
