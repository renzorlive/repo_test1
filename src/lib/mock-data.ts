/**
 * Mock data for the foundation pages that are not yet backed by the database.
 *
 * The Command Center and Missions screens now read live data through the
 * service layer; Projects and Agents remain mock-driven until their own
 * service wiring lands (see docs/TODO.md). Replace these imports with the
 * matching React Query hooks at that point.
 */
import type { AgentStatus, AgentType, ProjectStatus } from "@/types";

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

export interface MockAgent {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  status: AgentStatus;
  runs: number;
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
