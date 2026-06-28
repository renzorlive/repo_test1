import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderKanban,
  Target,
  Bot,
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
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Workspace, members and preferences.",
  },
];
