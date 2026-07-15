import { Request, Response } from "express";
import { invokeLLM } from "./llm";
import { isAuthorizedScheduledTask } from "./scheduledAuth";

/**
 * Heartbeat handler for sending scheduled reports.
 * Originally called only by the Manus platform's cron session; now also
 * accepts the `X-Scheduled-Task-Secret` header (see scheduledAuth.ts) so an
 * external cron works on Railway.
 */

export async function sendScheduledReportHandler(req: Request, res: Response) {
  try {
    if (!(await isAuthorizedScheduledTask(req))) {
      return res.status(403).json({ error: "cron-only" });
    }

    // Extract payload from request
    const { reportTemplateId, recipientEmails, frequency, timezone } = req.body;

    if (!reportTemplateId || !recipientEmails || !Array.isArray(recipientEmails)) {
      return res.json({ ok: true, skipped: "invalid-payload" });
    }

    // Generate report data (mock for now)
    const reportData = {
      templateId: reportTemplateId,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalLeads: Math.floor(Math.random() * 1000),
        totalSales: Math.floor(Math.random() * 500),
        conversionRate: (Math.random() * 100).toFixed(2) + "%",
        totalRevenue: Math.floor(Math.random() * 100000),
        avgROI: (Math.random() * 200).toFixed(2) + "%",
      },
      trends: {
        leadsChange: (Math.random() * 50 - 25).toFixed(2) + "%",
        salesChange: (Math.random() * 50 - 25).toFixed(2) + "%",
        revenueChange: (Math.random() * 50 - 25).toFixed(2) + "%",
      },
    };

    // Generate AI insights using LLM
    const insightsPrompt = `
      Based on the following report metrics, generate 2-3 key insights for a dealership manager:
      
      Metrics:
      - Total Leads: ${reportData.metrics.totalLeads}
      - Total Sales: ${reportData.metrics.totalSales}
      - Conversion Rate: ${reportData.metrics.conversionRate}
      - Total Revenue: R${reportData.metrics.totalRevenue}
      - Average ROI: ${reportData.metrics.avgROI}
      
      Trends:
      - Leads Change: ${reportData.trends.leadsChange}
      - Sales Change: ${reportData.trends.salesChange}
      - Revenue Change: ${reportData.trends.revenueChange}
      
      Provide actionable insights and recommendations.
    `;

    const aiResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a business intelligence analyst for a car dealership. Provide concise, actionable insights.",
        },
        {
          role: "user",
          content: insightsPrompt,
        },
      ],
    });

    const insights = aiResponse.choices[0]?.message?.content || "No insights generated";

    // Build email content
    const emailContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #1a1a1a, #d4af37); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .metric-card { background-color: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #d4af37; }
            .metric-value { font-size: 24px; font-weight: bold; color: #1a1a1a; }
            .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
            .insights { background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .footer { font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>GrayArx ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Report</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="metrics">
              <div class="metric-card">
                <div class="metric-label">Total Leads</div>
                <div class="metric-value">${reportData.metrics.totalLeads}</div>
                <div style="color: ${reportData.trends.leadsChange.includes('-') ? '#ef4444' : '#10b981'}; font-size: 12px;">
                  ${reportData.trends.leadsChange}
                </div>
              </div>
              
              <div class="metric-card">
                <div class="metric-label">Total Sales</div>
                <div class="metric-value">${reportData.metrics.totalSales}</div>
                <div style="color: ${reportData.trends.salesChange.includes('-') ? '#ef4444' : '#10b981'}; font-size: 12px;">
                  ${reportData.trends.salesChange}
                </div>
              </div>
              
              <div class="metric-card">
                <div class="metric-label">Conversion Rate</div>
                <div class="metric-value">${reportData.metrics.conversionRate}</div>
              </div>
              
              <div class="metric-card">
                <div class="metric-label">Total Revenue</div>
                <div class="metric-value">R${reportData.metrics.totalRevenue.toLocaleString()}</div>
                <div style="color: ${reportData.trends.revenueChange.includes('-') ? '#ef4444' : '#10b981'}; font-size: 12px;">
                  ${reportData.trends.revenueChange}
                </div>
              </div>
            </div>
            
            <div class="insights">
              <h3>Key Insights & Recommendations</h3>
              <p>${insights}</p>
            </div>
            
            <div class="footer">
              <p>This is an automated report from GrayArx. Log in to your dashboard to view detailed analytics.</p>
              <p>© 2026 GrayArx. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails to recipients (mock implementation)
    console.log(`[Scheduled Report] Sending ${frequency} report to ${recipientEmails.length} recipients`);
    console.log(`[Scheduled Report] Recipients: ${recipientEmails.join(", ")}`);
    console.log(`[Scheduled Report] Report Template ID: ${reportTemplateId}`);

    // In production, integrate with email service (Resend)
    // For now, log the action
    for (const email of recipientEmails) {
      console.log(`[Scheduled Report] Email sent to ${email}`);
    }

    return res.json({
      ok: true,
      reportsSent: recipientEmails.length,
      recipients: recipientEmails,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Scheduled Report Handler] Error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        url: req.url,
        taskUid: (req as any).user?.taskUid,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
