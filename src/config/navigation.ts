import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderKanban,
  Target,
  Bot,
  Cpu,
  Inbox,
  Settings,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

/** Primary sidebar navigation for the dashboard shell. */
export const primaryNav: NavItem[] = [
  {
    title: "Command Center",
    href: "/command-center",
    icon: LayoutDashboard,
    description: "Operational overview of missions, agents and activity.",
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
    description: "Workspaces of missions, epics and tasks.",
  },
  {
    title: "Missions",
    href: "/missions",
    icon: Target,
    description: "High-level objectives driving execution.",
  },
  {
    title: "AI Agents",
    href: "/agents",
    icon: Bot,
    description: "Your fleet of specialized AI agents.",
  },
  {
    title: "AI Orchestrator",
    href: "/orchestrator",
    icon: Cpu,
    description: "Workers, queues and execution metrics.",
  },
  {
    title: "AI Inbox",
    href: "/inbox",
    icon: Inbox,
    description: "Approvals, failures and execution triage.",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Workspace, members and preferences.",
  },
];
