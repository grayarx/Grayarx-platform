import { useEffect, useState } from "react";
import { useAuth } from "../_core/hooks/useAuth";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function ComplianceDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // POPIA queries
  const popiaRequests = trpc.compliance.popia.getPendingRequests.useQuery();
  const popiaOverdue = trpc.compliance.popia.getOverdueRequests.useQuery();

  // NRCS queries
  const nrcsHighRisk = trpc.compliance.nrcs.getHighRiskAssessments.useQuery();
  const nrcsUnreviewed = trpc.compliance.nrcs.getUnreviewedAssessments.useQuery();

  // Complaint queries
  const complaintsUnresolved = trpc.compliance.complaints.getUnresolvedComplaints.useQuery();
  const complaintsOverdue = trpc.compliance.complaints.getOverdueComplaints.useQuery();
  const complaintsCritical = trpc.compliance.complaints.getCriticalComplaints.useQuery();
  const complaintStats = trpc.compliance.complaints.getComplaintStats.useQuery({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  if (!user) return <div>Loading...</div>;

  const isLoading =
    popiaRequests.isLoading ||
    nrcsHighRisk.isLoading ||
    complaintsUnresolved.isLoading ||
    complaintStats.isLoading;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
        <p className="text-gray-500 mt-2">Monitor POPIA, NRCS, and complaint compliance</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* POPIA Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">POPIA Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{popiaRequests.data?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Pending requests</p>
            {popiaOverdue.data && popiaOverdue.data.length > 0 && (
              <Badge variant="destructive" className="mt-2">
                {popiaOverdue.data.length} Overdue
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* NRCS Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">NRCS Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nrcsUnreviewed.data?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Unreviewed assessments</p>
            {nrcsHighRisk.data && nrcsHighRisk.data.length > 0 && (
              <Badge variant="destructive" className="mt-2">
                {nrcsHighRisk.data.length} High Risk
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Complaints Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complaintsUnresolved.data?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Unresolved complaints</p>
            {complaintsCritical.data && complaintsCritical.data.length > 0 && (
              <Badge variant="destructive" className="mt-2">
                {complaintsCritical.data.length} Critical
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Escalation Rate Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Escalation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complaintStats.data?.escalationRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="popia">POPIA Requests</TabsTrigger>
          <TabsTrigger value="nrcs">NRCS Assessments</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
        </TabsList>

        {/* POPIA Tab */}
        <TabsContent value="popia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending POPIA Requests</CardTitle>
              <CardDescription>Data subject requests requiring action</CardDescription>
            </CardHeader>
            <CardContent>
              {popiaRequests.isLoading ? (
                <p>Loading...</p>
              ) : popiaRequests.data && popiaRequests.data.length > 0 ? (
                <div className="space-y-3">
                  {popiaRequests.data.map((request: any) => (
                    <div key={request.id} className="flex items-start justify-between p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{request.requesterName}</p>
                        <p className="text-sm text-gray-500">{request.requestType}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Deadline: {new Date(request.completionDeadline).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge>{request.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No pending requests</p>
              )}
            </CardContent>
          </Card>

          {popiaOverdue.data && popiaOverdue.data.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Overdue Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {popiaOverdue.data.map((request: any) => (
                    <div key={request.id} className="flex items-start justify-between p-3 bg-white rounded">
                      <div className="flex-1">
                        <p className="font-medium">{request.requesterName}</p>
                        <p className="text-sm text-red-600">
                          Overdue by {Math.floor((Date.now() - new Date(request.completionDeadline).getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Action
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* NRCS Tab */}
        <TabsContent value="nrcs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unreviewed Assessments</CardTitle>
              <CardDescription>NRCS affordability assessments pending review</CardDescription>
            </CardHeader>
            <CardContent>
              {nrcsUnreviewed.isLoading ? (
                <p>Loading...</p>
              ) : nrcsUnreviewed.data && nrcsUnreviewed.data.length > 0 ? (
                <div className="space-y-3">
                  {nrcsUnreviewed.data.map((assessment: any) => (
                    <div key={assessment.id} className="flex items-start justify-between p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">Assessment #{assessment.id}</p>
                        <p className="text-sm text-gray-500">
                          Loan: R{assessment.proposedLoanAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Affordability Score: {assessment.affordabilityScore.toFixed(1)}%
                        </p>
                      </div>
                      <Badge variant={assessment.isAffordable ? "default" : "destructive"}>
                        {assessment.riskLevel}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No unreviewed assessments</p>
              )}
            </CardContent>
          </Card>

          {nrcsHighRisk.data && nrcsHighRisk.data.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  High-Risk Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {nrcsHighRisk.data.map((assessment: any) => (
                    <div key={assessment.id} className="flex items-start justify-between p-3 bg-white rounded">
                      <div className="flex-1">
                        <p className="font-medium">Assessment #{assessment.id}</p>
                        <p className="text-sm text-orange-600">{assessment.assessmentReason}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Complaints Tab */}
        <TabsContent value="complaints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complaint Statistics</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {complaintStats.isLoading ? (
                <p>Loading...</p>
              ) : complaintStats.data ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Complaints</p>
                    <p className="text-2xl font-bold">{complaintStats.data.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg Resolution Time</p>
                    <p className="text-2xl font-bold">{complaintStats.data.avgResolutionTime} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Escalation Rate</p>
                    <p className="text-2xl font-bold">{complaintStats.data.escalationRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Critical</p>
                    <p className="text-2xl font-bold text-red-600">
                      {complaintStats.data.bySeverity?.critical || 0}
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unresolved Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              {complaintsUnresolved.isLoading ? (
                <p>Loading...</p>
              ) : complaintsUnresolved.data && complaintsUnresolved.data.length > 0 ? (
                <div className="space-y-3">
                  {complaintsUnresolved.data.map((complaint: any) => (
                    <div key={complaint.id} className="flex items-start justify-between p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{complaint.complaintNumber}</p>
                        <p className="text-sm text-gray-500">{complaint.complaintType}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          From: {complaint.complainantName}
                        </p>
                      </div>
                      <Badge variant={complaint.priority === "urgent" ? "destructive" : "default"}>
                        {complaint.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No unresolved complaints</p>
              )}
            </CardContent>
          </Card>

          {complaintsCritical.data && complaintsCritical.data.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Critical Complaints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complaintsCritical.data.map((complaint: any) => (
                    <div key={complaint.id} className="flex items-start justify-between p-3 bg-white rounded">
                      <div className="flex-1">
                        <p className="font-medium">{complaint.complaintNumber}</p>
                        <p className="text-sm text-red-600">{complaint.description.substring(0, 100)}...</p>
                      </div>
                      <Button size="sm" variant="destructive">
                        Escalate
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
