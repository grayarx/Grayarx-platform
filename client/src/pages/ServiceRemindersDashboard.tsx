import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, Clock, Send, TrendingUp } from "lucide-react";

export function ServiceRemindersDashboard() {
  const [dealershipId] = useState(1); // TODO: Get from context
  const [selectedVehicleId, setSelectedVehicleId] = useState(1);

  // Queries
  const maintenanceSchedule = trpc.serviceReminders.getMaintenanceSchedule.useQuery({
    vehicleId: selectedVehicleId,
    dealershipId,
  });

  const reminderRules = trpc.serviceReminders.getReminderRules.useQuery({
    dealershipId,
  });

  const pendingReminders = trpc.serviceReminders.getPendingReminders.useQuery({
    dealershipId,
  });

  const reminderStats = trpc.serviceReminders.getReminderStats.useQuery({
    dealershipId,
    days: 30,
  });

  // Mutations
  const sendReminder = trpc.serviceReminders.sendServiceReminder.useMutation();
  const triggerBulkReminders = trpc.serviceReminders.triggerBulkReminders.useMutation();

  const handleSendReminder = async (customerId: number, serviceType: string) => {
    try {
      await sendReminder.mutateAsync({
        customerId,
        vehicleId: selectedVehicleId,
        dealershipId,
        serviceType,
        channel: "sms",
      });
      alert("Reminder sent successfully!");
    } catch (error) {
      alert("Failed to send reminder");
    }
  };

  const handleBulkReminders = async (serviceType: string) => {
    try {
      await triggerBulkReminders.mutateAsync({
        dealershipId,
        serviceType,
        channel: "both",
      });
      alert("Bulk reminders triggered!");
    } catch (error) {
      alert("Failed to trigger bulk reminders");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Service Reminders</h1>
        <p className="text-muted-foreground mt-2">Automated maintenance scheduling and customer notifications</p>
      </div>

      {/* Statistics Cards */}
      {reminderStats.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Reminders Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reminderStats.data.stats.totalRemindersSent}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reminderStats.data.stats.deliveryRate}%</div>
              <p className="text-xs text-muted-foreground">SMS/Email success</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Booking Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reminderStats.data.stats.appointmentBookingRate}%</div>
              <p className="text-xs text-muted-foreground">Appointments booked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reminderStats.data.stats.averageResponseTime}</div>
              <p className="text-xs text-muted-foreground">Days to respond</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule">Maintenance Schedule</TabsTrigger>
          <TabsTrigger value="rules">Reminder Rules</TabsTrigger>
          <TabsTrigger value="pending">Pending Reminders</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Maintenance Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Maintenance Schedule</CardTitle>
              <CardDescription>Upcoming and overdue services for selected vehicle</CardDescription>
            </CardHeader>
            <CardContent>
              {maintenanceSchedule.data && (
                <div className="space-y-3">
                  {maintenanceSchedule.data.schedule.map((service: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{service.service}</p>
                        <p className="text-sm text-muted-foreground">{service.interval}</p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="text-sm font-medium">{service.nextDue}</p>
                        <Badge variant={service.daysUntilDue < 30 ? "destructive" : "secondary"}>
                          {service.daysUntilDue} days
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSendReminder(101, service.service)}
                        disabled={sendReminder.isPending}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reminder Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reminder Rules</CardTitle>
              <CardDescription>Configure automatic service reminders</CardDescription>
            </CardHeader>
            <CardContent>
              {reminderRules.data && (
                <div className="space-y-3">
                  {reminderRules.data.rules.map((rule: any) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{rule.serviceType}</p>
                        <p className="text-sm text-muted-foreground">
                          {rule.reminderDaysBefore} days before • {rule.channel}
                        </p>
                      </div>
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bulk Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                onClick={() => handleBulkReminders("Oil Change")}
                disabled={triggerBulkReminders.isPending}
              >
                <Bell className="w-4 h-4 mr-2" />
                Send All Oil Change Reminders
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleBulkReminders("Tire Rotation")}
                disabled={triggerBulkReminders.isPending}
              >
                <Bell className="w-4 h-4 mr-2" />
                Send All Tire Rotation Reminders
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Reminders Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reminders</CardTitle>
              <CardDescription>Reminders scheduled to be sent</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingReminders.data && (
                <div className="space-y-3">
                  {pendingReminders.data.pendingReminders.map((reminder: any) => (
                    <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{reminder.make} {reminder.model}</p>
                        <p className="text-sm text-muted-foreground">
                          {reminder.serviceType} • {reminder.mileage} miles
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{reminder.channel.toUpperCase()}</p>
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {reminder.dueDate ? new Date(reminder.dueDate).toLocaleDateString() : "N/A"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reminder History</CardTitle>
              <CardDescription>Recently sent reminders (last 90 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">Oil Change Reminder</p>
                    <p className="text-sm text-muted-foreground">Customer: John Doe</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="default">Delivered</Badge>
                    <p className="text-xs text-muted-foreground mt-1">10 days ago</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">Tire Rotation Reminder</p>
                    <p className="text-sm text-muted-foreground">Customer: Jane Smith</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="default">Delivered</Badge>
                    <p className="text-xs text-muted-foreground mt-1">5 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
