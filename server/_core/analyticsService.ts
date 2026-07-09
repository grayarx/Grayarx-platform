export type ReportType = "security" | "compliance" | "audit" | "performance" | "usage";
export type ReportFormat = "pdf" | "csv" | "json" | "excel";
export type DateRange = "7d" | "30d" | "90d" | "1y" | "custom";

export interface AnalyticsMetric {
  name: string;
  value: number;
  unit: string;
  trend?: number;
  comparison?: number;
  timestamp: Date;
}

export interface SecurityMetrics {
  overallScore: number;
  failedLogins: number;
  successfulLogins: number;
  twoFactorEnabled: number;
  twoFactorDisabled: number;
  suspiciousActivities: number;
  accountsLocked: number;
  passwordChanges: number;
  newDevices: number;
  trustedDevices: number;
}

export interface ComplianceMetrics {
  pciDssScore: number;
  gdprScore: number;
  soc2Score: number;
  hipaaScore: number;
  openFindings: number;
  resolvedFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
}

export interface PerformanceMetrics {
  apiResponseTime: number;
  databaseQueryTime: number;
  errorRate: number;
  uptime: number;
  requestsPerSecond: number;
  activeConnections: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface UsageMetrics {
  activeUsers: number;
  totalLogins: number;
  totalSessions: number;
  averageSessionDuration: number;
  peakHour: string;
  mostUsedFeature: string;
  leastUsedFeature: string;
  userRetention: number;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  dateRange: DateRange;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  generatedBy: string;
  metrics: Record<string, any>;
  insights: string[];
  recommendations: string[];
  format: ReportFormat;
  url?: string;
  expiresAt: Date;
}

export interface ReportSchedule {
  id: string;
  reportType: ReportType;
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  recipients: string[];
  format: ReportFormat;
  enabled: boolean;
  nextRunAt: Date;
  lastRunAt?: Date;
}

export class AnalyticsService {
  private reports: Map<string, Report> = new Map();
  private schedules: Map<string, ReportSchedule> = new Map();
  private metrics: AnalyticsMetric[] = [];

  // Security Analytics
  async getSecurityMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<SecurityMetrics> {
    // In production, this would query the database
    return {
      overallScore: 87,
      failedLogins: 25,
      successfulLogins: 1250,
      twoFactorEnabled: 45,
      twoFactorDisabled: 82,
      suspiciousActivities: 12,
      accountsLocked: 3,
      passwordChanges: 18,
      newDevices: 7,
      trustedDevices: 23,
    };
  }

  // Compliance Analytics
  async getComplianceMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceMetrics> {
    return {
      pciDssScore: 87,
      gdprScore: 92,
      soc2Score: 85,
      hipaaScore: 88,
      openFindings: 5,
      resolvedFindings: 28,
      criticalFindings: 1,
      highFindings: 3,
      mediumFindings: 8,
      lowFindings: 12,
    };
  }

  // Performance Analytics
  async getPerformanceMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceMetrics> {
    return {
      apiResponseTime: 145,
      databaseQueryTime: 85,
      errorRate: 0.02,
      uptime: 99.95,
      requestsPerSecond: 1250,
      activeConnections: 342,
      cpuUsage: 35,
      memoryUsage: 62,
    };
  }

  // Usage Analytics
  async getUsageMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<UsageMetrics> {
    return {
      activeUsers: 156,
      totalLogins: 1275,
      totalSessions: 342,
      averageSessionDuration: 45,
      peakHour: "14:00-15:00",
      mostUsedFeature: "Inventory Management",
      leastUsedFeature: "Advanced Analytics",
      userRetention: 92,
    };
  }

  // Generate Report
  async generateReport(
    type: ReportType,
    dateRange: DateRange,
    format: ReportFormat,
    generatedBy: string
  ): Promise<Report> {
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate date range
    const endDate = new Date();
    const startDate = this.calculateStartDate(dateRange, endDate);

    // Collect metrics based on report type
    let metrics: Record<string, any> = {};
    const insights: string[] = [];
    const recommendations: string[] = [];

    switch (type) {
      case "security":
        metrics = await this.getSecurityMetrics(startDate, endDate);
        insights.push(
          "Overall security posture is strong with 87% score",
          "2FA adoption is at 35%, consider increasing to 50%",
          "Failed login attempts are within normal range"
        );
        recommendations.push(
          "Increase 2FA enforcement to 50% of users",
          "Implement IP whitelisting for critical accounts",
          "Review and update password policies quarterly"
        );
        break;

      case "compliance":
        metrics = await this.getComplianceMetrics(startDate, endDate);
        insights.push(
          "GDPR compliance is at 92%, highest among frameworks",
          "5 open findings require attention",
          "1 critical finding needs immediate remediation"
        );
        recommendations.push(
          "Address critical finding within 7 days",
          "Schedule audit for next quarter",
          "Document all compliance evidence"
        );
        break;

      case "performance":
        metrics = await this.getPerformanceMetrics(startDate, endDate);
        insights.push(
          "API response time is optimal at 145ms",
          "System uptime is excellent at 99.95%",
          "Database queries could be optimized"
        );
        recommendations.push(
          "Implement database query caching",
          "Monitor CPU usage during peak hours",
          "Consider load balancing for high-traffic periods"
        );
        break;

      case "usage":
        metrics = await this.getUsageMetrics(startDate, endDate);
        insights.push(
          "156 active users with 92% retention rate",
          "Peak usage is 14:00-15:00 UTC",
          "Inventory Management is most used feature"
        );
        recommendations.push(
          "Promote underutilized features through training",
          "Optimize peak hour performance",
          "Gather feedback from power users"
        );
        break;

      case "audit":
        metrics = {
          totalEvents: 2450,
          eventsByType: {
            login: 1250,
            passwordChange: 45,
            twoFactorSetup: 89,
            accountLock: 3,
            suspicious: 12,
          },
          eventsByUser: 156,
          averageEventsPerUser: 15.7,
        };
        insights.push(
          "2,450 audit events recorded",
          "Login is most common event type",
          "All events properly logged and timestamped"
        );
        recommendations.push(
          "Archive old audit logs for compliance",
          "Implement real-time alerting for critical events",
          "Review audit logs monthly"
        );
        break;
    }

    const report: Report = {
      id: reportId,
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      description: `${type} report for ${dateRange}`,
      dateRange,
      startDate,
      endDate,
      generatedAt: new Date(),
      generatedBy,
      metrics,
      insights,
      recommendations,
      format,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    };

    this.reports.set(reportId, report);
    return report;
  }

  // Export Report
  async exportReport(
    reportId: string,
    format: ReportFormat
  ): Promise<string> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    let content = "";

    switch (format) {
      case "json":
        content = JSON.stringify(report, null, 2);
        break;

      case "csv":
        content = this.convertToCsv(report);
        break;

      case "pdf":
        content = this.convertToPdf(report);
        break;

      case "excel":
        content = this.convertToExcel(report);
        break;
    }

    return content;
  }

  // Schedule Report
  scheduleReport(
    reportType: ReportType,
    frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
    recipients: string[],
    format: ReportFormat
  ): string {
    const scheduleId = `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const schedule: ReportSchedule = {
      id: scheduleId,
      reportType,
      frequency,
      recipients,
      format,
      enabled: true,
      nextRunAt: this.calculateNextRun(frequency),
    };

    this.schedules.set(scheduleId, schedule);
    return scheduleId;
  }

  // Get Report History
  getReportHistory(type?: ReportType): Report[] {
    const reports = Array.from(this.reports.values());
    if (type) {
      return reports.filter((r) => r.type === type);
    }
    return reports;
  }

  // Get Scheduled Reports
  getScheduledReports(): ReportSchedule[] {
    return Array.from(this.schedules.values());
  }

  // Update Schedule
  updateSchedule(
    scheduleId: string,
    updates: Partial<ReportSchedule>
  ): void {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    this.schedules.set(scheduleId, { ...schedule, ...updates });
  }

  // Delete Schedule
  deleteSchedule(scheduleId: string): void {
    this.schedules.delete(scheduleId);
  }

  // Private helpers
  private calculateStartDate(dateRange: DateRange, endDate: Date): Date {
    const start = new Date(endDate);

    switch (dateRange) {
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
      case "1y":
        start.setFullYear(start.getFullYear() - 1);
        break;
      case "custom":
        start.setDate(start.getDate() - 30); // Default to 30 days
        break;
    }

    return start;
  }

  private calculateNextRun(frequency: string): Date {
    const next = new Date();

    switch (frequency) {
      case "daily":
        next.setDate(next.getDate() + 1);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "quarterly":
        next.setMonth(next.getMonth() + 3);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }

  private convertToCsv(report: Report): string {
    let csv = `Report Type,${report.type}\n`;
    csv += `Generated At,${report.generatedAt.toISOString()}\n`;
    csv += `Date Range,${report.startDate.toISOString()} to ${report.endDate.toISOString()}\n\n`;

    csv += "Metrics\n";
    for (const [key, value] of Object.entries(report.metrics)) {
      csv += `${key},${JSON.stringify(value)}\n`;
    }

    csv += "\nInsights\n";
    report.insights.forEach((insight) => {
      csv += `"${insight}"\n`;
    });

    csv += "\nRecommendations\n";
    report.recommendations.forEach((rec) => {
      csv += `"${rec}"\n`;
    });

    return csv;
  }

  private convertToPdf(report: Report): string {
    // In production, use a PDF library like pdfkit or weasyprint
    return `PDF Report: ${report.title}`;
  }

  private convertToExcel(report: Report): string {
    // In production, use a library like exceljs
    return `Excel Report: ${report.title}`;
  }
}

export const analyticsService = new AnalyticsService();
