import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Edit2, Lock, Trash2, Eye } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
  lastSignedIn: string | null;
  isActive: boolean;
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [page, searchQuery]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // TODO: Call tRPC procedure to list users
      // const response = await trpc.admin.listUsers.useQuery({
      //   page,
      //   limit: 10,
      //   filters: searchQuery ? { search: searchQuery } : undefined,
      // });
      // setUsers(response.data);
      // setTotalPages(response.pages);
      console.log("Loading users...");
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      // TODO: Call tRPC procedure to update user role
      // await trpc.admin.updateUserRole.useMutation({
      //   userId: selectedUser.id,
      //   role: newRole,
      // });
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id ? { ...u, role: newRole } : u
        )
      );
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to update user role:", error);
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      // TODO: Call tRPC procedure to reset user password
      // await trpc.admin.resetUserPassword.useMutation({
      //   userId,
      // });
      alert("Password reset email sent to user");
    } catch (error) {
      console.error("Failed to reset password:", error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      // TODO: Call tRPC procedure to delete user
      // await trpc.admin.deleteUser.useMutation({
      //   userId,
      // });
      setUsers(users.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage dealer accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You can manage user roles, reset passwords, and view login history
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Last Sign In</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.lastSignedIn
                              ? new Date(user.lastSignedIn).toLocaleDateString()
                              : "Never"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? "default" : "destructive"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setNewRole(user.role);
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Update User Role</DialogTitle>
                                    <DialogDescription>
                                      Change the role for {user.name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="role">Role</Label>
                                      <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="user">User</SelectItem>
                                          <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button onClick={handleUpdateRole} className="w-full">
                                      Update Role
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResetPassword(user.id)}
                              >
                                <Lock className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
