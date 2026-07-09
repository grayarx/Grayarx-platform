import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Mail, Phone, MapPin, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export function LeadRouting() {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch inquiries for the dealership
  const { data: ticketsData = [], isLoading } = trpc.marketplace.getDealershipTickets.useQuery(
    { dealershipId: user?.dealershipId || 0 },
    { enabled: !!user?.dealershipId }
  );

  // Filter tickets based on status and search
  const filteredTickets = ticketsData.filter((ticket) => {
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchesSearch =
      searchTerm === "" ||
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800";
      case "in_progress":
        return "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800";
      case "resolved":
        return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
      case "closed":
        return "bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800";
      default:
        return "bg-muted border-border";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  if (!user?.dealershipId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">You need to be associated with a dealership to view leads.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Lead Routing & Management</h1>
          <p className="text-lg text-muted-foreground">
            Manage customer inquiries and route them to your sales team
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-foreground">{ticketsData.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Inquiries</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {ticketsData.filter((t) => t.status === "open").length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Open Leads</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {ticketsData.filter((t) => t.status === "in_progress").length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">In Progress</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {ticketsData.filter((t) => t.status === "resolved").length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Resolved</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Filter & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setFilterStatus("all");
                    setSearchTerm("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground text-lg">No inquiries found.</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your filters."
                    : "Inquiries will appear here when customers submit them."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className={`border-2 transition-all hover:shadow-md ${getStatusColor(ticket.status)}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-1">{ticket.title}</h3>
                        <p className="text-sm text-muted-foreground">{ticket.description}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge
                          variant={getSeverityColor(ticket.severity)}
                          className="capitalize"
                        >
                          {ticket.severity}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {format(new Date(ticket.createdAt), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="capitalize">
                          {ticket.category.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm">
                          Assign to Team
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Lead Routing Best Practices */}
        <Card className="border-border mt-12 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Lead Routing Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  <strong>Respond quickly:</strong> Respond to inquiries within 2 hours for best conversion rates
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  <strong>Personalize responses:</strong> Reference the specific vehicle and customer concerns
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  <strong>Offer test drives:</strong> Suggest scheduling a test drive to move leads forward
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  <strong>Track conversions:</strong> Mark inquiries as converted when they result in sales
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
