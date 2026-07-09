import { router, protectedProcedure } from "./trpc";
import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { createHeartbeatJob, updateHeartbeatJob, deleteHeartbeatJob } from "./heartbeat";

/**
 * Scheduled Reports Router
 * Allows dealership managers to schedule automated report delivery
 */

export const scheduledReportsRouter = router({
  /**
   * Create a scheduled report
   */
  createScheduledReport: protectedProcedure
    .input(
      z.object({
        reportTemplateId: z.number(),
        recipientEmails: z.array(z.string().email()),
        frequency: z.enum(["weekly", "monthly", "quarterly"]),
        dayOfWeek: z.number().min(0).max(6).optional(),
        dayOfMonth: z.number().min(1).max(31).optional(),
        timeOfDay: z.string().regex(/^\d{2}:\d{2}$/),
        timezone: z.string().default("Africa/Johannesburg"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Get session token from cookie
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

      // Determine cron expression based on frequency
      let cronExpression = "0 0 9 * * *"; // Default: daily 9am UTC

      if (input.frequency === "weekly") {
        const dayOfWeek = input.dayOfWeek ?? 1; // Monday by default
        const [hours, minutes] = input.timeOfDay.split(":").map(Number);
        cronExpression = `0 ${minutes} ${hours} * * ${dayOfWeek}`;
      } else if (input.frequency === "monthly") {
        const dayOfMonth = input.dayOfMonth ?? 1;
        const [hours, minutes] = input.timeOfDay.split(":").map(Number);
        cronExpression = `0 ${minutes} ${hours} ${dayOfMonth} * *`;
      } else if (input.frequency === "quarterly") {
        // Quarterly: run on 1st of Jan, Apr, Jul, Oct at specified time
        const [hours, minutes] = input.timeOfDay.split(":").map(Number);
        cronExpression = `0 ${minutes} ${hours} 1 1,4,7,10 *`;
      }

      // Create Heartbeat job
      const job = await createHeartbeatJob(
        {
          name: `scheduled-report-${input.reportTemplateId}-${Date.now()}`,
          cron: cronExpression,
          path: "/api/scheduled/sendReport",
          payload: {
            reportTemplateId: input.reportTemplateId,
            recipientEmails: input.recipientEmails,
            frequency: input.frequency,
            timezone: input.timezone,
          },
          description: `${input.frequency} report delivery for template ${input.reportTemplateId}`,
        },
        sessionToken
      );

      return {
        success: true,
        taskUid: job.taskUid,
        nextExecutionAt: job.nextExecutionAt,
        message: `Scheduled report will be sent ${input.frequency} at ${input.timeOfDay}`,
      };
    }),

  /**
   * Get scheduled reports for dealership
   */
  getScheduledReports: protectedProcedure.query(async ({ ctx }) => {
    return {
      reports: [
        {
          id: 1,
          reportTemplateId: 1,
          frequency: "weekly",
          timeOfDay: "09:00",
          recipientEmails: ["manager@dealership.com"],
          status: "active",
          nextScheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastSentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }),

  /**
   * Update scheduled report
   */
  updateScheduledReport: protectedProcedure
    .input(
      z.object({
        taskUid: z.string(),
        frequency: z.enum(["weekly", "monthly", "quarterly"]).optional(),
        timeOfDay: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        recipientEmails: z.array(z.string().email()).optional(),
        enable: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

      // Update Heartbeat job
      await updateHeartbeatJob(
        input.taskUid,
        {
          enable: input.enable,
        },
        sessionToken
      );

      return {
        success: true,
        message: "Scheduled report updated successfully",
      };
    }),

  /**
   * Pause scheduled report
   */
  pauseScheduledReport: protectedProcedure
    .input(z.object({ taskUid: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

      await updateHeartbeatJob(
        input.taskUid,
        { enable: false },
        sessionToken
      );

      return {
        success: true,
        message: "Scheduled report paused",
      };
    }),

  /**
   * Resume scheduled report
   */
  resumeScheduledReport: protectedProcedure
    .input(z.object({ taskUid: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

      await updateHeartbeatJob(
        input.taskUid,
        { enable: true },
        sessionToken
      );

      return {
        success: true,
        message: "Scheduled report resumed",
      };
    }),

  /**
   * Delete scheduled report
   */
  deleteScheduledReport: protectedProcedure
    .input(z.object({ taskUid: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

      await deleteHeartbeatJob(input.taskUid, sessionToken);

      return {
        success: true,
        message: "Scheduled report deleted",
      };
    }),
});
