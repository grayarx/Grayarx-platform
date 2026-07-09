import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { popiaService, nrcsService, complaintService } from "../_core/complianceServices";
import { TRPCError } from "@trpc/server";

export const complianceRouter = router({
  // ============================================================================
  // POPIA (Protection of Personal Information Act) Procedures
  // ============================================================================

  popia: router({
    /**
     * Create a new POPIA data subject request
     */
    createRequest: protectedProcedure
      .input(
        z.object({
          requestType: z.enum(["access", "correction", "deletion", "objection", "restrict", "portability"]),
          requesterName: z.string().min(1),
          requesterEmail: z.string().email(),
          requesterPhone: z.string().optional(),
          requesterIdNumber: z.string().optional(),
          dataSubjectDescription: z.string().optional(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.dealershipId) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "No dealership associated" });
        }

        return await popiaService.createRequest({
          dealershipId: ctx.user.dealershipId,
          ...input,
        });
      }),

    /**
     * Get pending POPIA requests
     */
    getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.dealershipId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No dealership associated" });
      }

      return await popiaService.getPendingRequests(ctx.user.dealershipId);
    }),

    /**
     * Get overdue POPIA requests
     */
    getOverdueRequests: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.dealershipId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No dealership associated" });
      }

      return await popiaService.getOverdueRequests(ctx.user.dealershipId);
    }),

    /**
     * Acknowledge a POPIA request
     */
    acknowledgeRequest: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.id) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        return await popiaService.acknowledgeRequest(input.requestId, ctx.user.id);
      }),

    /**
     * Approve and complete a POPIA request
     */
    approveRequest: protectedProcedure
      .input(
        z.object({
          requestId: z.number(),
          responseNotes: z.string(),
          responseDocument: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.id) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        return await popiaService.approveRequest(
          input.requestId,
          input.responseNotes,
          input.responseDocument,
          ctx.user.id
        );
      }),

    /**
     * Deny a POPIA request
     */
    denyRequest: protectedProcedure
      .input(
        z.object({
          requestId: z.number(),
          denialReason: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.id) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        return await popiaService.denyRequest(input.requestId, input.denialReason, ctx.user.id);
      }),
  }),

  // ============================================================================
  // NRCS (National Credit Regulator) Affordability Assessment Procedures
  // ============================================================================

  nrcs: router({
    /**
     * Create an affordability assessment
     */
    createAssessment: protectedProcedure
      .input(
        z.object({
          leadId: z.number(),
          monthlyIncome: z.number().positive(),
          monthlyExpenses: z.number().nonnegative(),
          existingDebtObligations: z.number().nonnegative(),
          creditScore: z.number().optional(),
          creditHistory: z.string().optional(),
          proposedLoanAmount: z.number().positive(),
          proposedInterestRate: z.number().positive(),
          proposedLoanTerm: z.number().positive().int(),
          proposedMonthlyPayment: z.number().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.dealershipId || !ctx.user?.id) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "No dealership associated" });
        }

        return await nrcsService.createAssessment({
          dealershipId: ctx.user.dealershipId,
          assessedBy: ctx.user.id,
          ...input,
        });
      }),

    /**
     * Get high-risk assessments
     */
    getHighRiskAssessments: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.dealershipId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No dealership associated" });
      }

      return await nrcsService.getHighRiskAssessments(ctx.user.dealershipId);
    }),

    /**
     * Get unreviewed assessments
     */
    getUnreviewedAssessments: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.dealershipId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No dealership associated" });
      }

      return await nrcsService.getUnreviewedAssessments(ctx.user.dealershipId);
    }),

    /**
     * Review an assessment
     */
    reviewAssessment: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.id) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        return await nrcsService.reviewAssessment(input.assessmentId, ctx.user.id);
      }),
  }),

  // ============================================================================
  // Complaint Management Procedures
  // ============================================================================

  complaints: router({
    /**
     * Create a new complaint
     */
    createComplaint: protectedProcedure
      .input(
        z.object({
          complaintType: z.enum([
            "service_quality",
            "pricing",
            "warranty",
            "financing",
            "vehicle_condition",
            "delivery",
            "communication",
            "staff_conduct",
            "safety",
            "other",
          ]),
          complainantName: z.string().min(1),
          complainantEmail: z.string().email(),
          complainantPhone: z.string().min(1),
          complainantIdNumber: z.string().optional(),
          vehicleId: z.number().optional(),
          invoiceId: z.number().optional(),
          description: z.string().min(10),
          attachmentUrl: z.string().optional(),
          severity: z.enum(["low", "medium", "high", "critical"]),
          priority: z.enum(["low", "medium", "high", "urgent"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.dealershipId) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "No dealership associated" });
        }

        return await complaintService.createComplaint({
          dealershipId: ctx.user.dealershipId,
          ...input,
        });
      }),

    /**
     * Get unresolved complaints
     */
    getUnresolvedComplaints: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.dealershipId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No dealership associated" });
      }

      return await complaintService.getUnresolvedComplaints(ctx.user.dealershipId);
    }),

    /**
     * Get overdue complaints
     */
    getOverdueComplaints: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.dealershipId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No dealership associated" });
      }

      return await complaintService.getOverdueComplaints(ctx.user.dealershipId);
    }),

    /**
     * Get high-priority complaints
     */
    getHighPriorityComplaints: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.dealershipId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No dealership associated" });
      }

      return await complaintService.getHighPriorityComplaints(ctx.user.dealershipId);
    }),

    /**
     * Get critical complaints
     */
    getCriticalComplaints: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.dealershipId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "No dealership associated" });
      }

      return await complaintService.getCriticalComplaints(ctx.user.dealershipId);
    }),

    /**
     * Acknowledge a complaint
     */
    acknowledgeComplaint: protectedProcedure
      .input(z.object({ complaintId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await complaintService.acknowledgeComplaint(input.complaintId);
      }),

    /**
     * Update complaint status
     */
    updateStatus: protectedProcedure
      .input(
        z.object({
          complaintId: z.number(),
          status: z.enum([
            "received",
            "acknowledged",
            "under_investigation",
            "proposed_resolution",
            "resolved",
            "escalated",
            "closed",
          ]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await complaintService.updateStatus(input.complaintId, input.status);
      }),

    /**
     * Resolve a complaint
     */
    resolveComplaint: protectedProcedure
      .input(
        z.object({
          complaintId: z.number(),
          actualResolution: z.string(),
          compensationOffered: z.number().optional(),
          compensationPaid: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await complaintService.resolveComplaint(
          input.complaintId,
          input.actualResolution,
          input.compensationOffered,
          input.compensationPaid
        );
      }),

    /**
     * Escalate a complaint
     */
    escalateComplaint: protectedProcedure
      .input(
        z.object({
          complaintId: z.number(),
          escalatedTo: z.number(),
          reason: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await complaintService.escalateComplaint(
          input.complaintId,
          input.escalatedTo,
          input.reason
        );
      }),

    /**
     * Report complaint to NRCS
     */
    reportToNrcs: protectedProcedure
      .input(
        z.object({
          complaintId: z.number(),
          regulatoryReferenceNumber: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await complaintService.reportToNrcs(
          input.complaintId,
          input.regulatoryReferenceNumber
        );
      }),

    /**
     * Get complaint statistics
     */
    getComplaintStats: protectedProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.dealershipId) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "No dealership associated" });
        }

        return await complaintService.getComplaintStats(
          ctx.user.dealershipId,
          input.startDate,
          input.endDate
        );
      }),
  }),
});
