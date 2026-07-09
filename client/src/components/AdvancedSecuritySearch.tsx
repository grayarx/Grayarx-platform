/**
 * Advanced Security Search & Filter
 * Comprehensive search and filtering for security dashboards
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Filter, X, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface SearchFilter {
  id: string;
  name: string;
  severity?: string[];
  status?: string[];
  dateRange?: { from: string; to: string };
  eventType?: string[];
  userId?: string;
  ipAddress?: string;
  webhookType?: string[];
  isActive: boolean;
}

export function AdvancedSecuritySearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SearchFilter[]>([
    {
      id: "filter_1",
      name: "Critical Incidents",
      severity: ["critical"],
      status: ["open", "in_progress"],
      isActive: true,
    },
    {
      id: "filter_2",
      name: "Last 24 Hours",
      dateRange: { from: "2026-05-25", to: "2026-05-26" },
      isActive: true,
    },
  ]);

  const [activeFilter, setActiveFilter] = useState<SearchFilter | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");

  // Filter state
  const [filters, setFilters] = useState({
    severity: [] as string[],
    status: [] as string[],
    eventType: [] as string[],
    dateFrom: "",
    dateTo: "",
    userId: "",
    ipAddress: "",
    webhookType: [] as string[],
  });

  const handleSeverityChange = (severity: string) => {
    setFilters((prev) => ({
      ...prev,
      severity: prev.severity.includes(severity)
        ? prev.severity.filter((s) => s !== severity)
        : [...prev.severity, severity],
    }));
  };

  const handleStatusChange = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
  };

  const handleEventTypeChange = (eventType: string) => {
    setFilters((prev) => ({
      ...prev,
      eventType: prev.eventType.includes(eventType)
        ? prev.eventType.filter((e) => e !== eventType)
        : [...prev.eventType, eventType],
    }));
  };

  const handleWebhookChange = (webhook: string) => {
    setFilters((prev) => ({
      ...prev,
      webhookType: prev.webhookType.includes(webhook)
        ? prev.webhookType.filter((w) => w !== webhook)
        : [...prev.webhookType, webhook],
    }));
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast.error("Filter name is required");
      return;
    }

    const newFilter: SearchFilter = {
      id: `filter_${Date.now()}`,
      name: filterName,
      severity: filters.severity.length > 0 ? filters.severity : undefined,
      status: filters.status.length > 0 ? filters.status : undefined,
      eventType: filters.eventType.length > 0 ? filters.eventType : undefined,
      dateRange:
        filters.dateFrom || filters.dateTo
          ? { from: filters.dateFrom, to: filters.dateTo }
          : undefined,
      userId: filters.userId || undefined,
      ipAddress: filters.ipAddress || undefined,
      webhookType: filters.webhookType.length > 0 ? filters.webhookType : undefined,
      isActive: true,
    };

    setSavedFilters([...savedFilters, newFilter]);
    setFilterName("");
    setShowSaveDialog(false);
    toast.success("Filter saved successfully");
  };

  const handleApplyFilter = (filter: SearchFilter) => {
    setActiveFilter(filter);
    setFilters({
      severity: filter.severity || [],
      status: filter.status || [],
      eventType: filter.eventType || [],
      dateFrom: filter.dateRange?.from || "",
      dateTo: filter.dateRange?.to || "",
      userId: filter.userId || "",
      ipAddress: filter.ipAddress || "",
      webhookType: filter.webhookType || [],
    });
    toast.success(`Applied filter: ${filter.name}`);
  };

  const handleClearFilters = () => {
    setFilters({
      severity: [],
      status: [],
      eventType: [],
      dateFrom: "",
      dateTo: "",
      userId: "",
      ipAddress: "",
      webhookType: [],
    });
    setActiveFilter(null);
    setSearchTerm("");
  };

  const handleDeleteFilter = (filterId: string) => {
    setSavedFilters(savedFilters.filter((f) => f.id !== filterId));
    if (activeFilter?.id === filterId) {
      setActiveFilter(null);
    }
    toast.success("Filter deleted");
  };

  const isFilterActive =
    filters.severity.length > 0 ||
    filters.status.length > 0 ||
    filters.eventType.length > 0 ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.userId ||
    filters.ipAddress ||
    filters.webhookType.length > 0 ||
    searchTerm;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by rule name, event type, user ID, IP address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showAdvanced ? "default" : "outline"}
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Advanced
        </Button>
        {isFilterActive && (
          <Button variant="outline" onClick={handleClearFilters} className="gap-2">
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Advanced Filters</CardTitle>
            <CardDescription>Refine your search with multiple filter criteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Severity */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Severity Level</Label>
              <div className="flex flex-wrap gap-3">
                {["critical", "high", "medium", "low"].map((severity) => (
                  <div key={severity} className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.severity.includes(severity)}
                      onCheckedChange={() => handleSeverityChange(severity)}
                    />
                    <Label className="text-sm capitalize cursor-pointer">{severity}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Status</Label>
              <div className="flex flex-wrap gap-3">
                {["open", "in_progress", "resolved", "acknowledged"].map((status) => (
                  <div key={status} className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.status.includes(status)}
                      onCheckedChange={() => handleStatusChange(status)}
                    />
                    <Label className="text-sm capitalize cursor-pointer">{status}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Type */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Event Type</Label>
              <div className="flex flex-wrap gap-3">
                {["brute_force", "suspicious_location", "data_export", "unusual_activity"].map(
                  (eventType) => (
                    <div key={eventType} className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.eventType.includes(eventType)}
                        onCheckedChange={() => handleEventTypeChange(eventType)}
                      />
                      <Label className="text-sm capitalize cursor-pointer">
                        {eventType.replace(/_/g, " ")}
                      </Label>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom" className="text-sm font-medium mb-2 block">
                  From Date
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dateTo" className="text-sm font-medium mb-2 block">
                  To Date
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>

            {/* User ID */}
            <div>
              <Label htmlFor="userId" className="text-sm font-medium mb-2 block">
                User ID
              </Label>
              <Input
                id="userId"
                placeholder="Filter by user ID..."
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              />
            </div>

            {/* IP Address */}
            <div>
              <Label htmlFor="ipAddress" className="text-sm font-medium mb-2 block">
                IP Address
              </Label>
              <Input
                id="ipAddress"
                placeholder="Filter by IP address..."
                value={filters.ipAddress}
                onChange={(e) => setFilters({ ...filters, ipAddress: e.target.value })}
              />
            </div>

            {/* Webhook Type */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Webhook Type</Label>
              <div className="flex flex-wrap gap-3">
                {["slack", "pagerduty", "custom"].map((webhook) => (
                  <div key={webhook} className="flex items-center gap-2">
                    <Checkbox
                      checked={filters.webhookType.includes(webhook)}
                      onCheckedChange={() => handleWebhookChange(webhook)}
                    />
                    <Label className="text-sm capitalize cursor-pointer">{webhook}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => setShowSaveDialog(true)}
                disabled={!isFilterActive}
                className="flex-1 gap-2"
              >
                <Save className="w-4 h-4" />
                Save Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map((filter) => (
                <div
                  key={filter.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    activeFilter?.id === filter.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-accent"
                  }`}
                >
                  <button
                    onClick={() => handleApplyFilter(filter)}
                    className="flex-1 text-sm font-medium cursor-pointer"
                  >
                    {filter.name}
                  </button>
                  <button
                    onClick={() => handleDeleteFilter(filter.id)}
                    className="p-1 hover:bg-destructive/20 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Filter Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Filter</DialogTitle>
            <DialogDescription>Give this filter a name for quick access later</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filterName">Filter Name</Label>
              <Input
                id="filterName"
                placeholder="e.g., Critical Incidents Last 24h"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSaveDialog(false);
                  setFilterName("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveFilter} className="flex-1">
                Save Filter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Filter Badge */}
      {activeFilter && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg text-sm">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-blue-900">
            Active filter: <strong>{activeFilter.name}</strong>
          </span>
          <button
            onClick={() => {
              setActiveFilter(null);
              handleClearFilters();
            }}
            className="ml-auto p-1 hover:bg-blue-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
