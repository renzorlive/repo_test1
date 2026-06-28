import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { getInitials } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

const members = [
  { name: "Andrei Tanase", email: "andrei@rnz.os", role: "OWNER" },
  { name: "Ada Lovelace", email: "ada@rnz.os", role: "ADMIN" },
  { name: "Grace Hopper", email: "grace@rnz.os", role: "MEMBER" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your workspace, members and preferences."
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <CardDescription>
                Update your workspace name and identity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid max-w-md gap-2">
                <Label htmlFor="ws-name">Workspace name</Label>
                <Input id="ws-name" defaultValue="RNZ HQ" />
              </div>
              <div className="grid max-w-md gap-2">
                <Label htmlFor="ws-slug">Slug</Label>
                <Input id="ws-slug" defaultValue="rnz-hq" />
              </div>
              <Separator />
              <Button>Save changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Members</CardTitle>
                <CardDescription>
                  People with access to this workspace.
                </CardDescription>
              </div>
              <Button size="sm">Invite</Button>
            </CardHeader>
            <CardContent className="divide-y">
              {members.map((member) => (
                <div
                  key={member.email}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{member.role}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Choose how RNZ OS looks on this device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppearanceSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
