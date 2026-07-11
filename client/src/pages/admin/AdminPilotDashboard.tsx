import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Users, CheckCircle2, Clock, AlertCircle, Mail, MessageSquare, TrendingUp, Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const PILOT_DURATION_DAYS = 7;

function getPilotProgress(joinedAt: Date): { daysElapsed: number; daysRemaining: number; pct: number; expired: boolean } {
  const msPerDay = 1000 * 60 * 60 * 24;
  const elapsed = Math.floor((Date.now() - joinedAt.getTime()) / msPerDay);
  const daysElapsed = Math.min(elapsed, PILOT_DURATION_DAYS);
  const daysRemaining = Math.max(0, PILOT_DURATION_DAYS - elapsed);
  const expired = elapsed >= PILOT_DURATION_DAYS;
  const pct = Math.min(100, Math.round((elapsed / PILOT_DURATION_DAYS) * 100));
  return { daysElapsed, daysRemaining, pct, expired };
}

interface PilotDealership {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: "pending" | "active" | "completed" | "churned";
  deploymentType: "web" | "whatsapp" | "both";
  vehicleCount: number;
  chatbotMessages: number;
  testDriveBookings: number;
  preApprovals: number;
  joinedAt: Date;
  notes?: string;
}

const mockPilotDealerships: PilotDealership[] = [
  {
    id: 1,
    name: "Premium Motors Johannesburg",
    email: "contact@premiummotors.co.za",
    phone: "+27 11 123 4567",
    location: "Johannesburg, Gauteng",
    status: "active",
    deploymentType: "both",
    vehicleCount: 45,
    chatbotMessages: 1250,
    testDriveBookings: 18,
    preApprovals: 12,
    joinedAt: new Date("2026-05-27"),
  },
  {
    id: 2,
    name: "Elite Auto Group",
    email: "info@eliteauto.co.za",
    phone: "+27 21 555 8901",
    location: "Cape Town, Western Cape",
    status: "active",
    deploymentType: "web",
    vehicleCount: 32,
    chatbotMessages: 890,
    testDriveBookings: 14,
    preApprovals: 8,
    joinedAt: new Date("2026-05-27"),
  },
  {
    id: 3,
    name: "Luxury Vehicles Durban",
    email: "sales@luxuryvehicles.co.za",
    phone: "+27 31 222 3456",
    location: "Durban, KwaZulu-Natal",
    status: "pending",
    deploymentType: "both",
    vehicleCount: 0,
    chatbotMessages: 0,
    testDriveBookings: 0,
    preApprovals: 0,
    joinedAt: new Date("2026-05-27"),
  },
];

export default function AdminPilotDashboard() {
  const [dealerships, setDealerships] = useState<PilotDealership[]>(mockPilotDealerships);
  const [selectedDealership, setSelectedDealership] = useState<PilotDealership | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState("");

  const stats = {
    total: dealerships.length,
    active: dealerships.filter((d) => d.status === "active").length,
    pending: dealerships.filter((d) => d.status === "pending").length,
    totalMessages: dealerships.reduce((sum, d) => sum + d.chatbotMessages, 0),
    totalBookings: dealerships.reduce((sum, d) => sum + d.testDriveBookings, 0),
  };

  const handleAddNote = async () => {
    if (!selectedDealership || !newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    // Update local state
    setDealerships((prev) =>
      prev.map((d) =>
        d.id === selectedDealership.id ? { ...d, notes: newNote } : d
      )
    );

    setNewNote("");
    setIsAddingNote(false);
    toast.success("Note added successfully");
  };

  const handleStatusChange = async (dealershipId: number, newStatus: string) => {
    setDealerships((prev) =>
      prev.map((d) =>
        d.id === dealershipId ? { ...d, status: newStatus as any } : d
      )
    );
    toast.success(`Status updated to ${newStatus}`);
  };

  const handleSendEmail = (dealership: PilotDealership) => {
    toast.success(`Email sent to ${dealership.email}`);
  };

  const handleExportData = () => {
    const csv = [
      ["Name", "Email", "Status", "Deployment", "Vehicles", "Messages", "Bookings", "Pre-Approvals"],
      ...dealerships.map((d) => [
        d.name,
        d.email,
        d.status,
        d.deploymentType,
        d.vehicleCount,
        d.chatbotMessages,
        d.testDriveBookings,
        d.preApprovals,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pilot-dealerships.csv";
    a.click();
    toast.success("Data exported successfully");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "churned":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Pilot Program Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Manage GrayArx {PILOT_DURATION_DAYS}-day pilot dealerships and track performance
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          Each dealership runs a <strong>{PILOT_DURATION_DAYS}-day free pilot</strong> — full platform access, no cost, no commitment.
          After 7 days they convert or we follow up.
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Dealerships</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-slate-500 mt-1">{PILOT_DURATION_DAYS}-day pilot · 5 spots</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-slate-500 mt-1">Actively using platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting onboarding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Chatbot Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Total interactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Test Drive Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.totalBookings}</div>
            <p className="text-xs text-slate-500 mt-1">Conversions</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleExportData} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Dealerships Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pilot Dealerships</CardTitle>
          <CardDescription>Performance and engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dealership</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pilot progress</TableHead>
                  <TableHead>Deployment</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dealerships.map((dealership) => (
                  <TableRow key={dealership.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{dealership.name}</p>
                        <p className="text-xs text-slate-500">{dealership.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(dealership.status)}>{dealership.status}</Badge>
                    </TableCell>
                    <TableCell className="min-w-[160px]">
                      {(() => {
                        const prog = getPilotProgress(dealership.joinedAt);
                        return (
                          <div className="space-y-1">
                            <Progress value={prog.pct} className="h-1.5" />
                            <p className="text-xs text-slate-500">
                              {prog.expired
                                ? "Pilot ended"
                                : `Day ${prog.daysElapsed} of ${PILOT_DURATION_DAYS} · ${prog.daysRemaining}d left`}
                            </p>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{dealership.deploymentType}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{dealership.chatbotMessages.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">{dealership.testDriveBookings}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDealership(dealership)}
                          >
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{dealership.name}</DialogTitle>
                            <DialogDescription>{dealership.location}</DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6">
                            {/* Dealership Info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-slate-600">Email</Label>
                                <p className="font-medium">{dealership.email}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-slate-600">Phone</Label>
                                <p className="font-medium">{dealership.phone}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-slate-600">Deployment Type</Label>
                                <Badge variant="outline" className="mt-1">
                                  {dealership.deploymentType}
                                </Badge>
                              </div>
                              <div>
                                <Label className="text-xs text-slate-600">Joined</Label>
                                <p className="font-medium">{dealership.joinedAt.toLocaleDateString()}</p>
                              </div>
                              <div className="col-span-2">
                                <Label className="text-xs text-slate-600">
                                  Pilot progress ({PILOT_DURATION_DAYS}-day)
                                </Label>
                                {(() => {
                                  const prog = getPilotProgress(dealership.joinedAt);
                                  return (
                                    <div className="mt-1 space-y-1">
                                      <Progress value={prog.pct} className="h-2" />
                                      <p className="text-xs text-slate-500">
                                        {prog.expired
                                          ? "Pilot period ended — follow up for conversion"
                                          : `Day ${prog.daysElapsed} of ${PILOT_DURATION_DAYS} · ${prog.daysRemaining} day${prog.daysRemaining === 1 ? "" : "s"} remaining`}
                                      </p>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Status Update */}
                            <div>
                              <Label className="text-xs text-slate-600">Update Status</Label>
                              <Select
                                value={dealership.status}
                                onValueChange={(value) => handleStatusChange(dealership.id, value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="churned">Churned</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Notes */}
                            <div>
                              <Label className="text-xs text-slate-600">Internal Notes</Label>
                              {dealership.notes ? (
                                <div className="mt-2 p-3 bg-slate-100 rounded text-sm">{dealership.notes}</div>
                              ) : (
                                <p className="text-xs text-slate-500 mt-2">No notes yet</p>
                              )}
                              {isAddingNote && selectedDealership?.id === dealership.id && (
                                <div className="mt-2 space-y-2">
                                  <Textarea
                                    placeholder="Add a note..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    className="text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={handleAddNote}>
                                      Save Note
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setIsAddingNote(false)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {!isAddingNote && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2"
                                  onClick={() => {
                                    setSelectedDealership(dealership);
                                    setIsAddingNote(true);
                                  }}
                                >
                                  Add Note
                                </Button>
                              )}
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2 pt-4 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendEmail(dealership)}
                              >
                                <Mail className="w-4 h-4 mr-2" />
                                Send Email
                              </Button>
                              <Button size="sm" variant="outline">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Send SMS
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {dealerships.filter((d) => d.status === "pending").length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {dealerships.filter((d) => d.status === "pending").length} dealership(s) pending setup. Follow up to
            complete onboarding.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
