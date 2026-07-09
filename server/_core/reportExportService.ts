import { PDFDocument, rgb } from "pdf-lib";

/**
 * Report Export Service
 * Handles PDF and CSV export for comparison analytics reports
 */

export interface ComparisonReportData {
  period1: {
    label: string;
    startDate: string;
    endDate: string;
    metrics: {
      totalLeads: number;
      totalSales: number;
      conversionRate: number;
      totalRevenue: number;
      avgROI: number;
    };
  };
  period2: {
    label: string;
    startDate: string;
    endDate: string;
    metrics: {
      totalLeads: number;
      totalSales: number;
      conversionRate: number;
      totalRevenue: number;
      avgROI: number;
    };
  };
  comparisons: Array<{
    metric: string;
    period1Value: number;
    period2Value: number;
    change: number;
    changePercent: number;
    trend: "up" | "down" | "neutral";
  }>;
  insights: {
    bestImprovement: string;
    worstPerformance: string;
    overallTrend: string;
    recommendations: string[];
  };
  generatedAt: string;
  dealershipName?: string;
}

/**
 * Escape CSV field
 */
function escapeCSVField(field: string | number): string {
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate CSV export of comparison report
 */
export async function generateCSVReport(data: ComparisonReportData): Promise<Buffer> {
  const lines: string[] = [];

  // Add header
  lines.push("Section,Value,Date");

  // Add title
  lines.push(`COMPARISON ANALYTICS REPORT,,${data.generatedAt}`);

  if (data.dealershipName) {
    lines.push(`Dealership,${escapeCSVField(data.dealershipName)},`);
  }

  lines.push(",,");

  // Period 1
  lines.push(`PERIOD 1,${escapeCSVField(data.period1.label)},${data.period1.startDate} to ${data.period1.endDate}`);
  lines.push(`Total Leads,${data.period1.metrics.totalLeads.toLocaleString()},`);
  lines.push(`Total Sales,${data.period1.metrics.totalSales},`);
  lines.push(`Conversion Rate,${data.period1.metrics.conversionRate}%,`);
  lines.push(`Total Revenue,R${(data.period1.metrics.totalRevenue / 1000000).toFixed(1)}M,`);
  lines.push(`Average ROI,${data.period1.metrics.avgROI}%,`);
  lines.push(",,");

  // Period 2
  lines.push(`PERIOD 2,${escapeCSVField(data.period2.label)},${data.period2.startDate} to ${data.period2.endDate}`);
  lines.push(`Total Leads,${data.period2.metrics.totalLeads.toLocaleString()},`);
  lines.push(`Total Sales,${data.period2.metrics.totalSales},`);
  lines.push(`Conversion Rate,${data.period2.metrics.conversionRate}%,`);
  lines.push(`Total Revenue,R${(data.period2.metrics.totalRevenue / 1000000).toFixed(1)}M,`);
  lines.push(`Average ROI,${data.period2.metrics.avgROI}%,`);
  lines.push(",,");

  // Comparisons
  lines.push("METRIC COMPARISONS,Change,Trend");
  data.comparisons.forEach((comp) => {
    lines.push(
      `${escapeCSVField(comp.metric)},${comp.changePercent > 0 ? "+" : ""}${comp.changePercent.toFixed(1)}%,${comp.trend.toUpperCase()}`
    );
  });
  lines.push(",,");

  // Insights
  lines.push("KEY INSIGHTS,,");
  lines.push(`Best Improvement,${escapeCSVField(data.insights.bestImprovement)},`);
  lines.push(`Areas to Watch,${escapeCSVField(data.insights.worstPerformance)},`);
  lines.push(`Overall Trend,${escapeCSVField(data.insights.overallTrend)},`);
  lines.push(",,");

  // Recommendations
  lines.push("RECOMMENDATIONS,,");
  data.insights.recommendations.forEach((rec, idx) => {
    lines.push(`${idx + 1}. ${escapeCSVField(rec)},,`);
  });

  return Buffer.from(lines.join("\n"), "utf-8");
}

/**
 * Generate PDF export of comparison report
 */
export async function generatePDFReport(data: ComparisonReportData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([612, 792]); // Letter size
  let yPosition = 750;

  const margin = 40;
  const lineHeight = 14;

  const addText = (text: string, size: number = 11, bold: boolean = false, color = rgb(0, 0, 0)) => {
    if (yPosition < margin + 50) {
      page = pdfDoc.addPage([612, 792]);
      yPosition = 750;
    }

    page.drawText(text, {
      x: margin,
      y: yPosition,
      size,
      color,
    });

    yPosition -= size + 4;
  };

  // Title
  addText("COMPARISON ANALYTICS REPORT", 20, true, rgb(0.2, 0.2, 0.2));
  yPosition -= 10;

  // Dealership name
  if (data.dealershipName) {
    addText(`Dealership: ${data.dealershipName}`, 12);
  }

  addText(`Generated: ${data.generatedAt}`, 10, false, rgb(0.5, 0.5, 0.5));
  yPosition -= 20;

  // Period 1 Section
  addText("PERIOD 1", 14, true, rgb(0.2, 0.2, 0.2));
  addText(data.period1.label, 11);
  addText(`${data.period1.startDate} to ${data.period1.endDate}`, 10, false, rgb(0.5, 0.5, 0.5));
  yPosition -= 5;

  addText(`Total Leads: ${data.period1.metrics.totalLeads.toLocaleString()}`, 11);
  addText(`Total Sales: ${data.period1.metrics.totalSales}`, 11);
  addText(`Conversion Rate: ${data.period1.metrics.conversionRate}%`, 11);
  addText(`Total Revenue: R${(data.period1.metrics.totalRevenue / 1000000).toFixed(1)}M`, 11);
  addText(`Average ROI: ${data.period1.metrics.avgROI}%`, 11);
  yPosition -= 20;

  // Period 2 Section
  addText("PERIOD 2", 14, true, rgb(0.2, 0.2, 0.2));
  addText(data.period2.label, 11);
  addText(`${data.period2.startDate} to ${data.period2.endDate}`, 10, false, rgb(0.5, 0.5, 0.5));
  yPosition -= 5;

  addText(`Total Leads: ${data.period2.metrics.totalLeads.toLocaleString()}`, 11);
  addText(`Total Sales: ${data.period2.metrics.totalSales}`, 11);
  addText(`Conversion Rate: ${data.period2.metrics.conversionRate}%`, 11);
  addText(`Total Revenue: R${(data.period2.metrics.totalRevenue / 1000000).toFixed(1)}M`, 11);
  addText(`Average ROI: ${data.period2.metrics.avgROI}%`, 11);
  yPosition -= 20;

  // Comparisons Section
  addText("METRIC COMPARISONS", 14, true, rgb(0.2, 0.2, 0.2));
  yPosition -= 5;

  data.comparisons.forEach((comp) => {
    const trendColor =
      comp.trend === "up"
        ? rgb(0.2, 0.7, 0.2)
        : comp.trend === "down"
        ? rgb(0.8, 0.2, 0.2)
        : rgb(0.5, 0.5, 0.5);

    addText(
      `${comp.metric}: ${comp.changePercent > 0 ? "+" : ""}${comp.changePercent.toFixed(1)}% (${comp.trend.toUpperCase()})`,
      11,
      false,
      trendColor
    );
  });
  yPosition -= 20;

  // Insights Section
  addText("KEY INSIGHTS", 14, true, rgb(0.2, 0.2, 0.2));
  yPosition -= 5;

  addText(`Best Improvement: ${data.insights.bestImprovement}`, 11, false, rgb(0.2, 0.7, 0.2));
  addText(`Areas to Watch: ${data.insights.worstPerformance}`, 11, false, rgb(0.8, 0.2, 0.2));
  addText(`Overall Trend: ${data.insights.overallTrend}`, 11);
  yPosition -= 20;

  // Recommendations
  addText("RECOMMENDATIONS", 14, true, rgb(0.2, 0.2, 0.2));
  yPosition -= 5;

  data.insights.recommendations.forEach((rec, idx) => {
    addText(`${idx + 1}. ${rec}`, 10);
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Export report with specified format
 */
export async function exportReport(
  data: ComparisonReportData,
  format: "pdf" | "csv"
): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
  const dealershipSlug = data.dealershipName ? data.dealershipName.replace(/\s+/g, "-").toLowerCase() : "report";

  if (format === "pdf") {
    const buffer = await generatePDFReport(data);
    return {
      buffer,
      filename: `comparison-report-${dealershipSlug}-${timestamp}.pdf`,
      mimeType: "application/pdf",
    };
  } else {
    const buffer = await generateCSVReport(data);
    return {
      buffer,
      filename: `comparison-report-${dealershipSlug}-${timestamp}.csv`,
      mimeType: "text/csv",
    };
  }
}
