import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Mail, Trash2, RotateCcw, Clock, CheckCircle2 } from "lucide-react";

const teamMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  role: z.enum(["admin", "manager", "salesperson"]),
});

type TeamMemberForm = z.infer<typeof teamMemberSchema>;

interface TeamMember {
  id: string;
  email: string;
  role: "admin" | "manager" | "salesperson";
  status: "pending" | "accepted";
  invitedAt: Date;
  acceptedAt?: Date;
}

export function TeamMembersUI() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [lastTempPassword, setLastTempPassword] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const inviteTeamMember = trpc.teamMembers.inviteTeamMember.useMutation();
  const listTeamMembers = trpc.teamMembers.listTeamMembers.useQuery();
  const removeTeamMember = trpc.teamMembers.removeTeamMember.useMutation();
  const updateRole = trpc.teamMembers.updateRole.useMutation();
  const resendInvitation = trpc.teamMembers.resendInvitation.useMutation();

  const membersFromServer = listTeamMembers.data ?? [];
  const displayMembers =
    membersFromServer.length > 0
      ? membersFromServer.map((m) => ({
          id: m.id,
          email: m.email,
          role: (m.role === "dealer_owner" ? "admin" : "salesperson") as TeamMember["role"],
          status: m.status,
          invitedAt: new Date(m.invitedAt),
          acceptedAt: m.acceptedAt ? new Date(m.acceptedAt) : undefined,
        }))
      : teamMembers;

  const form = useForm<TeamMemberForm>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      role: "salesperson",
    },
  });

  const handleInviteTeamMember = async (data: TeamMemberForm) => {
    try {
      const result = await inviteTeamMember.mutateAsync({
        ...data,
        role: data.role,
      });

      if (result.success) {
        const pwd =
          "temporaryPassword" in result ? result.temporaryPassword : null;
        if (pwd) {
          setLastTempPassword({ email: data.email, password: pwd });
          try {
            await navigator.clipboard.writeText(pwd);
            toast.success(`User ready — temporary password copied for ${data.email}`);
          } catch {
            toast.success(`User ready for ${data.email} — copy password below`);
          }
        } else {
          setLastTempPassword(null);
          toast.success(result.message || `User linked for ${data.email}`);
        }
        form.reset();
        await listTeamMembers.refetch();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to invite");
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    try {
      const result = await removeTeamMember.mutateAsync({ memberId });

      if (result.success) {
        setTeamMembers(teamMembers.filter((m) => m.id !== memberId));
        toast.success("Team member removed");
      }
    } catch (error) {
      toast.error("Failed to remove team member");
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const result = await updateRole.mutateAsync({
        memberId,
        role: newRole as "admin" | "manager" | "salesperson",
      });

      if (result.success) {
        setTeamMembers(
          teamMembers.map((m) =>
            m.id === memberId ? { ...m, role: newRole as any } : m
          )
        );
        toast.success("Role updated");
      }
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleResendInvitation = async (memberId: string, email: string) => {
    try {
      const result = await resendInvitation.mutateAsync({ memberId });

      if (result.success) {
        const pwd =
          "temporaryPassword" in result ? result.temporaryPassword : null;
        if (pwd) {
          setLastTempPassword({ email, password: pwd });
          try {
            await navigator.clipboard.writeText(pwd);
            toast.success(`New temporary password copied for ${email}`);
          } catch {
            toast.success(`Password reset — copy it below for ${email}`);
          }
        } else {
          toast.success("Password reset");
        }
      }
    } catch (error) {
      toast.error("Failed to reset invitation password");
    }
  };

  const roleColors = {
    admin: "bg-purple-900 text-purple-200",
    manager: "bg-blue-900 text-blue-200",
    salesperson: "bg-green-900 text-green-200",
  };

  const statusColors = {
    pending: "bg-yellow-900 text-yellow-200",
    accepted: "bg-green-900 text-green-200",
  };

  return (
    <div className="space-y-6">
      {lastTempPassword && (
        <Card className="bg-amber-950/40 border-amber-600/40 p-4">
          <p className="text-amber-100 text-sm font-medium mb-1">
            Temporary password for {lastTempPassword.email}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="text-lg text-white bg-black/40 px-3 py-1.5 rounded font-mono tracking-wide">
              {lastTempPassword.password}
            </code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-amber-500/50 text-amber-100"
              onClick={() => {
                navigator.clipboard
                  .writeText(lastTempPassword.password)
                  .then(() => toast.success("Copied"))
                  .catch(() => toast.error("Could not copy"));
              }}
            >
              Copy
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-slate-400"
              onClick={() => setLastTempPassword(null)}
            >
              Dismiss
            </Button>
          </div>
          <p className="text-amber-200/70 text-xs mt-2">
            Share this securely — it is only shown here (email may also have it if Resend is configured).
          </p>
        </Card>
      )}

      {/* Invite Form */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Invite Team Member</h2>

        <form onSubmit={form.handleSubmit(handleInviteTeamMember)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-200">Email Address</Label>
              <Input
                {...form.register("email")}
                type="email"
                placeholder="john@dealership.co.za"
                className="bg-slate-700 border-slate-600 text-white"
              />
              {form.formState.errors.email && (
                <p className="text-red-400 text-sm mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label className="text-slate-200">Name (Optional)</Label>
              <Input
                {...form.register("name")}
                placeholder="John Smith"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-200">Role</Label>
              <Select {...form.register("role")}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="salesperson">Salesperson</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={inviteTeamMember.isPending}
            className="w-full bg-gold text-slate-900 hover:bg-yellow-400"
          >
            {inviteTeamMember.isPending ? "Sending..." : "Send Invitation"}
          </Button>
        </form>
      </Card>

      {/* Team Members Table */}
      {displayMembers.length > 0 && (
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Team Members ({displayMembers.length})
          </h3>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Role</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Invited</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayMembers.map((member) => (
                  <TableRow key={member.id} className="border-slate-700">
                    <TableCell className="text-white">{member.email}</TableCell>
                    <TableCell>
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleUpdateRole(member.id, value)
                        }
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="salesperson">Salesperson</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusColors[member.status] +
                          " flex items-center gap-1 w-fit"
                        }
                      >
                        {member.status === "pending" ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {member.status.charAt(0).toUpperCase() +
                          member.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {member.invitedAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleResendInvitation(member.id, member.email)
                          }
                          className="text-blue-400 hover:text-blue-300"
                          title="Reset temporary password"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveTeamMember(member.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {displayMembers.length === 0 && (
        <Card className="bg-slate-800 border-slate-700 p-12 text-center">
          <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No team members invited yet</p>
          <p className="text-slate-500 text-sm">
            Start by inviting your first team member above
          </p>
        </Card>
      )}

      {/* Role Permissions Info */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Role Permissions</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-700 p-4 rounded-lg">
            <Badge className="bg-purple-900 text-purple-200 mb-2">Admin</Badge>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>✓ Manage team members</li>
              <li>✓ View all reports</li>
              <li>✓ Configure integrations</li>
              <li>✓ Manage AI agents</li>
              <li>✓ Access billing</li>
            </ul>
          </div>

          <div className="bg-slate-700 p-4 rounded-lg">
            <Badge className="bg-blue-900 text-blue-200 mb-2">Manager</Badge>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>✓ View reports</li>
              <li>✓ Manage leads</li>
              <li>✓ Manage inventory</li>
              <li>✓ View analytics</li>
              <li>✗ Manage billing</li>
            </ul>
          </div>

          <div className="bg-slate-700 p-4 rounded-lg">
            <Badge className="bg-green-900 text-green-200 mb-2">Salesperson</Badge>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>✓ View assigned leads</li>
              <li>✓ Update lead status</li>
              <li>✓ View inventory</li>
              <li>✗ Manage team</li>
              <li>✗ Access billing</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
