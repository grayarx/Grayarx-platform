import { notifyOwner } from "./notification";

interface SecurityFinding {
  checkType: string;
  status: "pass" | "fail";
  severity?: "critical" | "high" | "medium" | "low";
  description: string;
  recommendation: string;
}

interface SecurityReport {
  reportId: string;
  dealershipId: string;
  dealershipName: string;
  reportDate: Date;
  score: number;
  scoreGrade: "A" | "B" | "C" | "D" | "F";
  findings: SecurityFinding[];
  summary: string;
  recommendations: string[];
  upsellOpportunities: string[];
  generatedAt: Date;
  expiresAt: Date;
}

// Generate security report for dealership
export const generateSecurityReport = async (
  dealershipId: string,
  dealershipName: string,
  auditScore: number,
  failedChecks: string[]
): Promise<SecurityReport> => {
  const findings: SecurityFinding[] = [
    {
      checkType: "Authentication",
      status: failedChecks.includes("authentication") ? "fail" : "pass",
      severity: failedChecks.includes("authentication") ? "high" : undefined,
      description: "OAuth tokens and session management validation",
      recommendation: "Ensure all authentication tokens are valid and regularly rotated",
    },
    {
      checkType: "Authorization",
      status: failedChecks.includes("authorization") ? "fail" : "pass",
      severity: failedChecks.includes("authorization") ? "high" : undefined,
      description: "Role-based access control verification",
      recommendation: "Review team member permissions and apply least privilege principle",
    },
    {
      checkType: "Data Isolation",
      status: failedChecks.includes("dataIsolation") ? "fail" : "pass",
      severity: failedChecks.includes("dataIsolation") ? "critical" : undefined,
      description: "Multi-tenancy boundary enforcement",
      recommendation: "Ensure dealership data is properly isolated from other dealerships",
    },
    {
      checkType: "Encryption",
      status: failedChecks.includes("encryption") ? "fail" : "pass",
      severity: failedChecks.includes("encryption") ? "high" : undefined,
      description: "Data encryption at rest and in transit",
      recommendation: "Enable TLS 1.3 and ensure all sensitive data is encrypted",
    },
    {
      checkType: "Input Validation",
      status: failedChecks.includes("inputValidation") ? "fail" : "pass",
      severity: failedChecks.includes("inputValidation") ? "medium" : undefined,
      description: "Protection against injection attacks",
      recommendation: "Validate and sanitize all user inputs",
    },
    {
      checkType: "Rate Limiting",
      status: failedChecks.includes("rateLimit") ? "fail" : "pass",
      severity: failedChecks.includes("rateLimit") ? "medium" : undefined,
      description: "DDoS and brute force protection",
      recommendation: "Enable rate limiting on all API endpoints",
    },
    {
      checkType: "Compliance",
      status: failedChecks.includes("compliance") ? "fail" : "pass",
      severity: failedChecks.includes("compliance") ? "high" : undefined,
      description: "POPIA and data protection compliance",
      recommendation: "Ensure compliance with South African data protection laws",
    },
    {
      checkType: "API Key Security",
      status: failedChecks.includes("apiKeyExposure") ? "fail" : "pass",
      severity: failedChecks.includes("apiKeyExposure") ? "critical" : undefined,
      description: "Protection against exposed API keys",
      recommendation: "Rotate API keys regularly and monitor for exposure",
    },
  ];

  // Calculate score grade
  let scoreGrade: "A" | "B" | "C" | "D" | "F" = "F";
  if (auditScore >= 90) scoreGrade = "A";
  else if (auditScore >= 80) scoreGrade = "B";
  else if (auditScore >= 70) scoreGrade = "C";
  else if (auditScore >= 60) scoreGrade = "D";

  // Generate summary
  const failedCount = failedChecks.length;
  const summary =
    failedCount === 0
      ? "Your dealership has excellent security practices. All checks passed."
      : failedCount <= 2
        ? "Your dealership has good security practices with minor improvements needed."
        : "Your dealership requires attention to several security areas.";

  // Generate recommendations
  const recommendations = failedChecks.map((check) => {
    const finding = findings.find((f) => f.checkType.toLowerCase() === check.toLowerCase());
    return finding?.recommendation || `Address ${check} security concerns`;
  });

  // Generate upsell opportunities
  const upsellOpportunities = [];
  if (auditScore < 90) {
    upsellOpportunities.push(
      "Upgrade to Premium Security: Get 24/7 security monitoring and incident response"
    );
  }
  if (failedCount > 0) {
    upsellOpportunities.push(
      "Security Remediation Service: Let our experts fix security issues for you"
    );
  }
  upsellOpportunities.push("Compliance Audit: Ensure full POPIA compliance");

  const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const reportDate = new Date();
  const expiresAt = new Date(reportDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return {
    reportId,
    dealershipId,
    dealershipName,
    reportDate,
    score: auditScore,
    scoreGrade,
    findings,
    summary,
    recommendations,
    upsellOpportunities,
    generatedAt: reportDate,
    expiresAt,
  };
};

// Get dealership security report
export const getDealershipSecurityReport = async (reportId: string) => {
  return {
    reportId,
    dealershipName: "Premium Auto Sales",
    reportDate: new Date(Date.now() - 86400000),
    score: 85,
    scoreGrade: "B",
    summary: "Your dealership has good security practices with minor improvements needed.",
    findings: [
      {
        checkType: "Authentication",
        status: "pass",
        description: "OAuth tokens and session management validation",
      },
      {
        checkType: "Authorization",
        status: "fail",
        severity: "high",
        description: "Role-based access control verification",
        recommendation: "Review team member permissions",
      },
    ],
  };
};

// Send security report to dealership
export const sendSecurityReportToDealership = async (
  dealershipId: string,
  dealershipEmail: string,
  report: SecurityReport
): Promise<{ success: boolean; sentAt: Date }> => {
  console.log(`[SecurityReport] Sending report to ${dealershipEmail}`);

  // In production, would send via email
  // await sendEmail({
  //   to: dealershipEmail,
  //   subject: `Your GrayArx Security Report - ${report.scoreGrade}`,
  //   html: generateReportHTML(report),
  //   attachments: [
  //     {
  //       filename: `security-report-${report.reportId}.pdf`,
  //       content: generateReportPDF(report),
  //     },
  //   ],
  // });

  return {
    success: true,
    sentAt: new Date(),
  };
};

// Schedule regular security reports
export const scheduleSecurityReports = async (
  dealershipId: string,
  frequency: "weekly" | "monthly"
) => {
  return {
    dealershipId,
    frequency,
    nextReportDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "scheduled",
    createdAt: new Date(),
  };
};

// Get security report history
export const getSecurityReportHistory = async (dealershipId: string) => {
  return [
    {
      reportId: "report-1",
      reportDate: new Date(Date.now() - 86400000),
      score: 85,
      scoreGrade: "B",
      status: "sent",
    },
    {
      reportId: "report-2",
      reportDate: new Date(Date.now() - 7 * 86400000),
      score: 82,
      scoreGrade: "B",
      status: "sent",
    },
    {
      reportId: "report-3",
      reportDate: new Date(Date.now() - 14 * 86400000),
      score: 78,
      scoreGrade: "C",
      status: "sent",
    },
  ];
};

// Generate security report PDF
export const generateSecurityReportPDF = async (report: SecurityReport): Promise<Buffer> => {
  // Mock PDF generation - in production would use reportlab or similar
  console.log(`[SecurityReport] Generating PDF for report ${report.reportId}`);

  const pdfContent = `
    GrayArx Security Report
    Report ID: ${report.reportId}
    Dealership: ${report.dealershipName}
    Date: ${report.reportDate.toLocaleDateString()}
    
    Security Score: ${report.score}/100 (Grade: ${report.scoreGrade})
    
    Summary: ${report.summary}
    
    Findings:
    ${report.findings.map((f) => `- ${f.checkType}: ${f.status}`).join("\n")}
    
    Recommendations:
    ${report.recommendations.map((r) => `- ${r}`).join("\n")}
  `;

  return Buffer.from(pdfContent);
};

// Calculate security trend
export const calculateSecurityTrend = async (dealershipId: string) => {
  const history = await getSecurityReportHistory(dealershipId);

  if (history.length < 2) {
    return {
      currentScore: history[0]?.score || 0,
      trend: "stable",
      improvement: 0,
    };
  }

  const current = history[0].score;
  const previous = history[1].score;
  const improvement = current - previous;

  return {
    currentScore: current,
    previousScore: previous,
    trend: improvement > 0 ? "improving" : improvement < 0 ? "declining" : "stable",
    improvement,
  };
};

// Dealership can view their own report
export const dealershipCanViewReport = async (dealershipId: string, reportId: string) => {
  // In production, verify dealership ownership of report
  return true;
};

// Generate upsell metrics
export const generateUpsellMetrics = async (dealershipId: string) => {
  const trend = await calculateSecurityTrend(dealershipId);
  const history = await getSecurityReportHistory(dealershipId);

  const averageScore = history.reduce((sum, r) => sum + r.score, 0) / history.length;

  return {
    averageScore,
    trend: trend.trend,
    improvementRate: trend.improvement,
    premiumSecurityEligible: averageScore < 90,
    remediationServiceEligible: averageScore < 80,
    complianceAuditEligible: true,
    estimatedUpsellValue: averageScore < 80 ? "$500-1000" : averageScore < 90 ? "$200-500" : "$0",
  };
};
