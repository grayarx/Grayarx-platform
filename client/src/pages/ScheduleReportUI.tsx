import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ScheduleReportUIProps {
  reportTemplateId: number;
  onScheduleCreated?: () => void;
}

export function ScheduleReportUI({ reportTemplateId, onScheduleCreated }: ScheduleReportUIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "quarterly">("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [timeOfDay, setTimeOfDay] = useState("09:00");
  const [timezone, setTimezone] = useState("Africa/Johannesburg");
  const [recipientEmails, setRecipientEmails] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);

  const createScheduledReport = trpc.scheduledReports.createScheduledReport.useMutation();

  const handleAddEmail = () => {
    setRecipientEmails([...recipientEmails, ""]);
  };

  const handleRemoveEmail = (index: number) => {
    setRecipientEmails(recipientEmails.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...recipientEmails];
    newEmails[index] = value;
    setRecipientEmails(newEmails);
  };

  const handleSubmit = async () => {
    // Validate emails
    const validEmails = recipientEmails.filter((email) => email.trim() !== "");
    if (validEmails.length === 0) {
      toast.error("Please add at least one recipient email");
      return;
    }

    setIsLoading(true);
    try {
      await createScheduledReport.mutateAsync({
        reportTemplateId,
        recipientEmails: validEmails,
        frequency,
        dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
        dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
        timeOfDay,
        timezone,
      });

      toast.success("Scheduled report created successfully!");
      setIsOpen(false);
      onScheduleCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create scheduled report");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline" className="w-full">
        📅 Schedule Report Delivery
      </Button>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Schedule Report Delivery</h3>

      {/* Frequency Selection */}
      <div className="space-y-2">
        <Label>Delivery Frequency</Label>
        <Select value={frequency} onValueChange={(v) => setFrequency(v as "weekly" | "monthly" | "quarterly")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Day Selection */}
      {frequency === "weekly" && (
        <div className="space-y-2">
          <Label>Day of Week</Label>
          <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sunday</SelectItem>
              <SelectItem value="1">Monday</SelectItem>
              <SelectItem value="2">Tuesday</SelectItem>
              <SelectItem value="3">Wednesday</SelectItem>
              <SelectItem value="4">Thursday</SelectItem>
              <SelectItem value="5">Friday</SelectItem>
              <SelectItem value="6">Saturday</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {frequency === "monthly" && (
        <div className="space-y-2">
          <Label>Day of Month</Label>
          <Select value={dayOfMonth.toString()} onValueChange={(v) => setDayOfMonth(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Time Selection */}
      <div className="space-y-2">
        <Label>Time of Day</Label>
        <Input
          type="time"
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Timezone Selection */}
      <div className="space-y-2">
        <Label>Timezone</Label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="Africa/Cape_Town">Africa/Cape Town (SAST)</SelectItem>
            <SelectItem value="Africa/Durban">Africa/Durban (SAST)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recipient Emails */}
      <div className="space-y-2">
        <Label>Recipient Emails</Label>
        <div className="space-y-2">
          {recipientEmails.map((email, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="email"
                placeholder="manager@dealership.com"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                className="flex-1"
              />
              {recipientEmails.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveEmail(index)}
                  className="text-red-500"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={handleAddEmail} className="w-full">
            + Add Another Email
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 bg-gold text-black hover:bg-yellow-500"
        >
          {isLoading ? "Creating..." : "Schedule Report"}
        </Button>
        <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
          Cancel
        </Button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">
        <p>
          <strong>Note:</strong> Reports will be automatically sent to the specified recipients at the scheduled time.
          You can manage, pause, or delete scheduled reports from the dashboard.
        </p>
      </div>
    </Card>
  );
}
