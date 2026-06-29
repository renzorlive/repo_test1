import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  RotateCcw,
  FolderKanban,
  Target,
  Bot,
  Cpu,
  Inbox,
  MonitorSmartphone,
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
    title: "Mission Control",
    href: "/command-center",
    icon: LayoutDashboard,
    description: "Resume missions, run executions and triage approvals.",
  },
  {
    title: "Resume",
    href: "/resume",
    icon: RotateCcw,
    description: "One sentence to re-enter your work state instantly.",
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
    title: "Machines",
    href: "/machines",
    icon: MonitorSmartphone,
    description: "Connected hosts running Claude Code and other runtimes.",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Workspace, members and preferences.",
  },
];
