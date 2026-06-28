import type { Metadata } from "next";
import { Plus, FolderKanban, Target, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { mockProjects } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        description="Each project groups missions, epics and tasks toward an outcome."
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockProjects.map((project, i) => (
          <FadeIn key={project.id} delay={i * 0.05}>
            <Card className="group h-full cursor-pointer transition-all hover:border-primary/40 hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold text-white"
                      style={{ backgroundColor: project.color }}
                    >
                      {project.key.slice(0, 2)}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {project.name}
                      </CardTitle>
                      <p className="font-mono text-xs text-muted-foreground">
                        {project.key}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                <CardDescription className="line-clamp-2 pt-1">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Target className="h-4 w-4" />
                    {project.missionCount}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ListChecks className="h-4 w-4" />
                    {project.taskCount}
                  </span>
                </div>
                <span className="text-xs">
                  {formatRelativeTime(project.updatedAt)}
                </span>
              </CardContent>
            </Card>
          </FadeIn>
        ))}

        {/* Empty-state / create affordance */}
        <FadeIn delay={mockProjects.length * 0.05}>
          <button className="flex h-full min-h-[180px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
            <FolderKanban className="h-6 w-6" />
            <span className="text-sm font-medium">Create a new project</span>
          </button>
        </FadeIn>
      </div>
    </div>
  );
}
