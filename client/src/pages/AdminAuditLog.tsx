import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download } from "lucide-react";

interface AuditLog {
  id: number;
  adminId: number;
  adminName: string;
  action: string;
  resourceType: string;
  resourceId: number | null;
  details: string | null;
  timestamp: string;
}

export function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      // TODO: Call tRPC procedure to get audit logs
      // const response = await trpc.admin.getAuditLog.useQuery({
      //   page,
      //   limit: 20,
      //   filters: actionFilter ? { action: actionFilter } : undefined,
      // });
      // setLogs(response.data);
      // setTotalPages(response.pages);
      console.log("Loading audit logs...");
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // TODO: Call tRPC procedure to export audit logs as CSV
      // const response = await trpc.admin.exportAuditLog.useQuery();
      // const csv = response.csv;
      // const blob = new Blob([csv], { type: "text/csv" });
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement("a");
      // a.href = url;
      // a.download = `audit-log-${new Date().toISOString()}.csv`;
      // a.click();
      alert("Exporting audit logs...");
    } catch (error) {
      console.error("Failed to export audit logs:", error);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("create")) return "default";
    if (action.includes("update")) return "secondary";
    if (action.includes("delete")) return "destructive";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>Track all administrative actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This log records all administrative actions performed on the platform
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="action-filter" className="sr-only">
                Filter by action
              </Label>
              <Select value={actionFilter} onValueChange={(v) => {
                setActionFilter(v);
                setPage(1);
              }}>
                <SelectTrigger id="action-filter">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="user_created">User Created</SelectItem>
                  <SelectItem value="user_updated">User Updated</SelectItem>
                  <SelectItem value="user_deleted">User Deleted</SelectItem>
                  <SelectItem value="role_changed">Role Changed</SelectItem>
                  <SelectItem value="password_reset">Password Reset</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
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
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No audit logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">{log.adminName}</TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {log.action.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.resourceType && (
                              <span className="text-sm">
                                {log.resourceType}
                                {log.resourceId && ` #${log.resourceId}`}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.details}
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
