/**
 * Mock data for the foundation UI.
 *
 * The pages render from these fixtures so the product is fully navigable
 * before the database is seeded or AI integrations exist. Swap these imports
 * for React Query hooks (see `src/hooks/`) once the API is wired to real data.
 */
import type {
  AgentStatus,
  AgentType,
  MissionStatus,
  Priority,
  ProjectStatus,
  TaskStatus,
} from "@/types";

export interface MockProject {
  id: string;
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  color: string;
  missionCount: number;
  taskCount: number;
  updatedAt: string;
}

export interface MockMission {
  id: string;
  title: string;
  summary: string;
  status: MissionStatus;
  priority: Priority;
  progress: number;
  projectKey: string;
  dueDate: string;
}

export interface MockAgent {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  status: AgentStatus;
  runs: number;
}

export interface MockTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  projectKey: string;
}

export const mockProjects: MockProject[] = [
  {
    id: "prj_1",
    name: "RNZ OS Core Platform",
    key: "RNZ",
    description: "Foundation, execution engine and workspace orchestration.",
    status: "ACTIVE",
    color: "#6366f1",
    missionCount: 6,
    taskCount: 42,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "prj_2",
    name: "Growth Engine",
    key: "GROW",
    description: "Acquisition campaigns, funnels and analytics dashboards.",
    status: "ACTIVE",
    color: "#10b981",
    missionCount: 4,
    taskCount: 23,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: "prj_3",
    name: "Client Delivery — Acme Corp",
    key: "ACME",
    description: "Agency engagement: rebrand, website and automation.",
    status: "PLANNING",
    color: "#f59e0b",
    missionCount: 3,
    taskCount: 11,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

export const mockMissions: MockMission[] = [
  {
    id: "msn_1",
    title: "Ship authentication & workspaces",
    summary: "Auth.js, multi-tenant workspaces and RBAC.",
    status: "ACTIVE",
    priority: "HIGH",
    progress: 72,
    projectKey: "RNZ",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "msn_2",
    title: "Command Center v1",
    summary: "Operational overview surfacing missions and agents.",
    status: "ACTIVE",
    priority: "URGENT",
    progress: 40,
    projectKey: "RNZ",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
  {
    id: "msn_3",
    title: "Q3 acquisition campaign",
    summary: "Multi-channel launch with attribution tracking.",
    status: "DRAFT",
    priority: "MEDIUM",
    progress: 12,
    projectKey: "GROW",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
  },
  {
    id: "msn_4",
    title: "Acme brand system",
    summary: "Design tokens, component library and guidelines.",
    status: "BLOCKED",
    priority: "HIGH",
    progress: 30,
    projectKey: "ACME",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
];

export const mockAgents: MockAgent[] = [
  {
    id: "agt_1",
    name: "Atlas",
    description: "Orchestrator that decomposes missions into epics and tasks.",
    type: "ORCHESTRATOR",
    status: "IDLE",
    runs: 128,
  },
  {
    id: "agt_2",
    name: "Scout",
    description: "Researches markets, competitors and technical approaches.",
    type: "RESEARCHER",
    status: "RUNNING",
    runs: 76,
  },
  {
    id: "agt_3",
    name: "Forge",
    description: "Engineering agent for code generation and reviews.",
    type: "ENGINEER",
    status: "IDLE",
    runs: 254,
  },
  {
    id: "agt_4",
    name: "Quill",
    description: "Writes specs, docs, briefs and customer-facing copy.",
    type: "WRITER",
    status: "PAUSED",
    runs: 41,
  },
];

export const mockTasks: MockTask[] = [
  { id: "tsk_1", title: "Implement Prisma schema", status: "DONE", priority: "HIGH", projectKey: "RNZ" },
  { id: "tsk_2", title: "Build sidebar + top nav", status: "IN_PROGRESS", priority: "HIGH", projectKey: "RNZ" },
  { id: "tsk_3", title: "Command Center widgets", status: "IN_PROGRESS", priority: "URGENT", projectKey: "RNZ" },
  { id: "tsk_4", title: "Agent registry UI", status: "TODO", priority: "MEDIUM", projectKey: "RNZ" },
  { id: "tsk_5", title: "Campaign funnel mockups", status: "IN_REVIEW", priority: "MEDIUM", projectKey: "GROW" },
  { id: "tsk_6", title: "Acme logo exploration", status: "BLOCKED", priority: "HIGH", projectKey: "ACME" },
];

export const mockActivity = [
  { id: "act_1", actor: "Forge", action: "completed task", target: "Implement Prisma schema", at: "2h ago" },
  { id: "act_2", actor: "Scout", action: "started research on", target: "competitor pricing", at: "3h ago" },
  { id: "act_3", actor: "Andrei", action: "created mission", target: "Command Center v1", at: "5h ago" },
  { id: "act_4", actor: "Atlas", action: "decomposed mission", target: "Ship authentication", at: "1d ago" },
];
