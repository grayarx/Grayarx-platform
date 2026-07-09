import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, Download, Eye, Filter, Search, X } from "lucide-react";

interface AuditLog {
  id: number;
  userId: number;
  email: string;
  eventType: string;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failure";
  timestamp: Date;
  metadata?: Record<string, any>;
  hash?: string;
}

interface AuditLogViewerProps {
  logs?: AuditLog[];
  isLoading?: boolean;
  onExport?: (format: "csv" | "json" | "pdf") => void;
  dealershipOnly?: boolean;
  title?: string;
}

const EVENT_TYPES = [
  "login_success",
  "login_failed",
  "2fa_success",
  "2fa_failed",
  "password_reset",
  "email_verification",
  "account_lockout",
  "session_created",
  "session_expired",
  "permission_denied",
];

const getEventColor = (eventType: string) => {
  if (eventType.includes("success")) return "bg-green-100 text-green-800";
  if (eventType.includes("failed")) return "bg-red-100 text-red-800";
  if (eventType.includes("2fa")) return "bg-blue-100 text-blue-800";
  if (eventType.includes("password")) return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-800";
};

const getStatusColor = (status: string) => {
  return status === "success"
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";
};

export function AuditLogViewer({
  logs = [],
  isLoading = false,
  onExport,
  dealershipOnly = false,
  title = "Audit Logs",
}: AuditLogViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search filter
      if (
        searchTerm &&
        !log.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !log.ipAddress.includes(searchTerm) &&
        !log.eventType.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Event type filter
      if (eventFilter && log.eventType !== eventFilter) {
        return false;
      }

      // Status filter
      if (statusFilter && log.status !== statusFilter) {
        return false;
      }

      // Date range filter
      const logDate = new Date(log.timestamp);
      if (dateFrom && logDate < new Date(dateFrom)) {
        return false;
      }
      if (dateTo && logDate > new Date(dateTo)) {
        return false;
      }

      return true;
    });
  }, [logs, searchTerm, eventFilter, statusFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = (format: "csv" | "json" | "pdf") => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export implementation
      const data =
        format === "json"
          ? JSON.stringify(filteredLogs, null, 2)
          : filteredLogs
              .map(
                (log) =>
                  `${log.timestamp},${log.email},${log.eventType},${log.ipAddress},${log.status}`
              )
              .join("\n");

      const element = document.createElement("a");
      element.setAttribute(
        "href",
        `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`
      );
      element.setAttribute("download", `audit-logs.${format}`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setEventFilter("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm || eventFilter || statusFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                {dealershipOnly
                  ? "View your dealership's security audit trail"
                  : "View all system audit logs"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("csv")}
                disabled={filteredLogs.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("json")}
                disabled={filteredLogs.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("pdf")}
                disabled={filteredLogs.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold">Filters</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search email, IP, event..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              {/* Event Type Filter */}
              <Select
                value={eventFilter}
                onValueChange={(value) => {
                  setEventFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Events</SelectItem>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                </SelectContent>
              </Select>

              {/* Date From */}
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="From Date"
              />

              {/* Date To */}
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="To Date"
              />
            </div>
          </div>

          {/* Results Summary */}
          <div className="text-sm text-gray-600">
            Showing {paginatedLogs.length} of {filteredLogs.length} logs
            {hasActiveFilters && ` (filtered from ${logs.length} total)`}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-6 h-6" />
              <span className="ml-2">Loading audit logs...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-semibold">No audit logs found</p>
              <p className="text-sm">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "No audit logs have been recorded yet"}
              </p>
            </div>
          )}

          {/* Table */}
          {!isLoading && filteredLogs.length > 0 && (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell>{log.email}</TableCell>
                        <TableCell>
                          <Badge className={getEventColor(log.eventType)}>
                            {log.eventType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ipAddress}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(log.status)}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLog(log);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information for this audit event
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    Timestamp
                  </label>
                  <p className="font-mono text-sm">
                    {format(new Date(selectedLog.timestamp), "PPpp")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    User Email
                  </label>
                  <p>{selectedLog.email}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    Event Type
                  </label>
                  <Badge className={getEventColor(selectedLog.eventType)}>
                    {selectedLog.eventType}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    Status
                  </label>
                  <Badge className={getStatusColor(selectedLog.status)}>
                    {selectedLog.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    IP Address
                  </label>
                  <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    User Agent
                  </label>
                  <p className="text-sm truncate">{selectedLog.userAgent}</p>
                </div>
              </div>

              {selectedLog.metadata && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    Metadata
                  </label>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-48">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.hash && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">
                    Integrity Hash (SHA-256)
                  </label>
                  <p className="font-mono text-xs break-all text-gray-600">
                    {selectedLog.hash}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
