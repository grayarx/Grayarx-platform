import { getDb } from "../db";
import {
  complianceAuditTrail,
  trainingAssignments,
  trainingProgress,
  trainingModules,
  users,
} from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { format, differenceInDays } from "date-fns";

/**
 * Compliance Report Generator
 * Generates comprehensive compliance reports with analytics and insights
 */

export interface ComplianceReportOptions {
  dealershipId: number;
  startDate?: Date;
  endDate?: Date;
  includeAnalytics?: boolean;
  includeRecommendations?: boolean;
}

export interface ComplianceReport {
  title: string;
  generatedDate: string;
  dealershipId: number;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalAuditEntries: number;
    totalTrainingAssignments: number;
    completedTraining: number;
    overdueTraining: number;
    complianceScore: number;
  };
  auditSummary: {
    actionCounts: Record<string, number>;
    entityTypeCounts: Record<string, number>;
    topUsers: Array<{ userId: number; count: number }>;
  };
  trainingSummary: {
    modulesCovered: number;
    averageCompletionRate: number;
    overdueAssignments: Array<{
      assignmentId: number;
      moduleName: string;
      assignedTo: string;
      dueDate: string;
      daysOverdue: number;
    }>;
    topPerformers: Array<{
      userId: number;
      userName: string;
      completedModules: number;
      averageScore: number;
    }>;
  };
  recommendations: string[];
}

/**
 * Generate comprehensive compliance report
 */
export async function generateComplianceReport(
  options: ComplianceReportOptions
): Promise<ComplianceReport> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const startDate = options.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
  const endDate = options.endDate || new Date();

  // Fetch audit trail data
  const auditEntries = await db
    .select()
    .from(complianceAuditTrail)
    .where(
      and(
        eq(complianceAuditTrail.dealershipId, options.dealershipId),
        gte(complianceAuditTrail.createdAt, startDate),
        lte(complianceAuditTrail.createdAt, endDate)
      )
    );

  // Fetch training assignments
  const assignments = await db
    .select()
    .from(trainingAssignments)
    .where(eq(trainingAssignments.dealershipId, options.dealershipId));

  // Fetch training progress
  const progressRecords = await db.select().from(trainingProgress);

  // Fetch training modules
  const modules = await db
    .select()
    .from(trainingModules)
    .where(eq(trainingModules.dealershipId, options.dealershipId));

  // Calculate audit summary
  const actionCounts: Record<string, number> = {};
  const entityTypeCounts: Record<string, number> = {};
  const userActionCounts: Record<number, number> = {};

  auditEntries.forEach((entry: any) => {
    actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
    entityTypeCounts[entry.entityType] = (entityTypeCounts[entry.entityType] || 0) + 1;
    if (entry.userId) {
      userActionCounts[entry.userId] = (userActionCounts[entry.userId] || 0) + 1;
    }
  });

  const topUsers = Object.entries(userActionCounts)
    .map(([userId, count]) => ({ userId: parseInt(userId), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate training summary
  const completedAssignments = assignments.filter((a: any) => a.status === "completed").length;
  const overdueAssignments = assignments.filter((a: any) => {
    const dueDate = new Date(a.dueDate);
    return dueDate < new Date() && a.status !== "completed";
  });

  // Calculate compliance score (0-100)
  const completionRate = assignments.length > 0 ? (completedAssignments / assignments.length) * 100 : 0;
  const overdueRate = assignments.length > 0 ? (overdueAssignments.length / assignments.length) * 100 : 0;
  const complianceScore = Math.max(0, Math.min(100, completionRate - overdueRate * 0.5));

  // Get training module names
  const moduleMap = new Map(modules.map((m: any) => [m.id, m.title]));

  // Get overdue assignment details
  const overdueDetails = overdueAssignments.map((a: any) => ({
    assignmentId: a.id,
    moduleName: moduleMap.get(a.moduleId) || "Unknown",
    assignedTo: `User ${a.assignedTo}`,
    dueDate: format(new Date(a.dueDate), "yyyy-MM-dd"),
    daysOverdue: differenceInDays(new Date(), new Date(a.dueDate)),
  }));

  // Calculate average completion rate
  const averageCompletionRate =
    progressRecords.length > 0
      ? progressRecords.reduce((sum: number, p: any) => sum + (p.progressPercentage || 0), 0) /
        progressRecords.length
      : 0;

  // Generate recommendations
  const recommendations: string[] = [];

  if (complianceScore < 50) {
    recommendations.push(
      "⚠️ Critical: Compliance score is below 50%. Immediate action required to increase training completion rates."
    );
  }

  if (overdueAssignments.length > 0) {
    recommendations.push(
      `📋 ${overdueAssignments.length} training assignments are overdue. Consider sending reminders to assigned users.`
    );
  }

  if (completionRate < 70) {
    recommendations.push(
      "📚 Training completion rate is below 70%. Consider implementing mandatory training deadlines or incentives."
    );
  }

  if (Object.keys(actionCounts).length === 0) {
    recommendations.push("📊 No audit activity detected. Ensure compliance tracking is properly configured.");
  }

  if (averageCompletionRate < 50) {
    recommendations.push(
      "🎯 Average training progress is low. Consider providing additional support or resources to users."
    );
  }

  recommendations.push("✅ Review audit trail regularly to ensure all compliance activities are tracked.");

  return {
    title: "Compliance Audit Trail Report",
    generatedDate: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    dealershipId: options.dealershipId,
    period: {
      start: format(startDate, "yyyy-MM-dd"),
      end: format(endDate, "yyyy-MM-dd"),
    },
    summary: {
      totalAuditEntries: auditEntries.length,
      totalTrainingAssignments: assignments.length,
      completedTraining: completedAssignments,
      overdueTraining: overdueAssignments.length,
      complianceScore: Math.round(complianceScore),
    },
    auditSummary: {
      actionCounts,
      entityTypeCounts,
      topUsers,
    },
    trainingSummary: {
      modulesCovered: modules.length,
      averageCompletionRate: Math.round(averageCompletionRate),
      overdueAssignments: overdueDetails,
      topPerformers: [], // Placeholder for top performers
    },
    recommendations,
  };
}

/**
 * Format report as HTML for email or display
 */
export function formatReportAsHTML(report: ComplianceReport): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .header { background-color: #f5f5f5; padding: 20px; border-bottom: 2px solid #007bff; }
        .section { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #007bff; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #007bff; color: white; }
        .score-good { color: #28a745; font-weight: bold; }
        .score-warning { color: #ffc107; font-weight: bold; }
        .score-critical { color: #dc3545; font-weight: bold; }
        .recommendation { padding: 10px; margin: 5px 0; background-color: #e7f3ff; border-left: 3px solid #007bff; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${report.title}</h1>
        <p>Generated: ${report.generatedDate}</p>
        <p>Period: ${report.period.start} to ${report.period.end}</p>
      </div>

      <div class="section">
        <h2>Compliance Score</h2>
        <div class="metric">
          <div class="metric-value ${
            report.summary.complianceScore >= 70
              ? "score-good"
              : report.summary.complianceScore >= 50
                ? "score-warning"
                : "score-critical"
          }">
            ${report.summary.complianceScore}%
          </div>
          <div class="metric-label">Overall Compliance</div>
        </div>
      </div>

      <div class="section">
        <h2>Summary Metrics</h2>
        <div class="metric">
          <div class="metric-value">${report.summary.totalAuditEntries}</div>
          <div class="metric-label">Audit Entries</div>
        </div>
        <div class="metric">
          <div class="metric-value">${report.summary.totalTrainingAssignments}</div>
          <div class="metric-label">Training Assignments</div>
        </div>
        <div class="metric">
          <div class="metric-value">${report.summary.completedTraining}</div>
          <div class="metric-label">Completed</div>
        </div>
        <div class="metric">
          <div class="metric-value">${report.summary.overdueTraining}</div>
          <div class="metric-label">Overdue</div>
        </div>
      </div>

      <div class="section">
        <h2>Audit Activity Breakdown</h2>
        <h3>Actions</h3>
        <table>
          <tr>
            <th>Action</th>
            <th>Count</th>
          </tr>
          ${Object.entries(report.auditSummary.actionCounts)
            .map(([action, count]) => `<tr><td>${action}</td><td>${count}</td></tr>`)
            .join("")}
        </table>

        <h3>Entity Types</h3>
        <table>
          <tr>
            <th>Entity Type</th>
            <th>Count</th>
          </tr>
          ${Object.entries(report.auditSummary.entityTypeCounts)
            .map(([type, count]) => `<tr><td>${type}</td><td>${count}</td></tr>`)
            .join("")}
        </table>
      </div>

      <div class="section">
        <h2>Training Summary</h2>
        <div class="metric">
          <div class="metric-value">${report.trainingSummary.modulesCovered}</div>
          <div class="metric-label">Modules</div>
        </div>
        <div class="metric">
          <div class="metric-value">${report.trainingSummary.averageCompletionRate}%</div>
          <div class="metric-label">Avg Completion</div>
        </div>

        ${
          report.trainingSummary.overdueAssignments.length > 0
            ? `
          <h3>Overdue Assignments</h3>
          <table>
            <tr>
              <th>Module</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Days Overdue</th>
            </tr>
            ${report.trainingSummary.overdueAssignments
              .map(
                (a) =>
                  `<tr><td>${a.moduleName}</td><td>${a.assignedTo}</td><td>${a.dueDate}</td><td>${a.daysOverdue}</td></tr>`
              )
              .join("")}
          </table>
          `
            : ""
        }
      </div>

      <div class="section">
        <h2>Recommendations</h2>
        ${report.recommendations.map((rec) => `<div class="recommendation">${rec}</div>`).join("")}
      </div>
    </body>
    </html>
  `;
}

/**
 * Format report as plain text
 */
export function formatReportAsText(report: ComplianceReport): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push(report.title);
  lines.push("=".repeat(60));
  lines.push(`Generated: ${report.generatedDate}`);
  lines.push(`Period: ${report.period.start} to ${report.period.end}`);
  lines.push("");

  lines.push("COMPLIANCE SCORE");
  lines.push("-".repeat(60));
  lines.push(`Overall Compliance: ${report.summary.complianceScore}%`);
  lines.push("");

  lines.push("SUMMARY METRICS");
  lines.push("-".repeat(60));
  lines.push(`Audit Entries: ${report.summary.totalAuditEntries}`);
  lines.push(`Training Assignments: ${report.summary.totalTrainingAssignments}`);
  lines.push(`Completed: ${report.summary.completedTraining}`);
  lines.push(`Overdue: ${report.summary.overdueTraining}`);
  lines.push("");

  lines.push("AUDIT ACTIVITY BREAKDOWN");
  lines.push("-".repeat(60));
  lines.push("Actions:");
  Object.entries(report.auditSummary.actionCounts).forEach(([action, count]) => {
    lines.push(`  ${action}: ${count}`);
  });
  lines.push("");
  lines.push("Entity Types:");
  Object.entries(report.auditSummary.entityTypeCounts).forEach(([type, count]) => {
    lines.push(`  ${type}: ${count}`);
  });
  lines.push("");

  lines.push("TRAINING SUMMARY");
  lines.push("-".repeat(60));
  lines.push(`Modules Covered: ${report.trainingSummary.modulesCovered}`);
  lines.push(`Average Completion Rate: ${report.trainingSummary.averageCompletionRate}%`);

  if (report.trainingSummary.overdueAssignments.length > 0) {
    lines.push("");
    lines.push("Overdue Assignments:");
    report.trainingSummary.overdueAssignments.forEach((a) => {
      lines.push(`  - ${a.moduleName} (${a.assignedTo}, ${a.daysOverdue} days overdue)`);
    });
  }
  lines.push("");

  lines.push("RECOMMENDATIONS");
  lines.push("-".repeat(60));
  report.recommendations.forEach((rec) => {
    lines.push(`• ${rec}`);
  });

  return lines.join("\n");
}
