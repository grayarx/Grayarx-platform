/**
 * POPIA (Protection of Personal Information Act) Data Subject Request Service
 * Handles customer requests for data access, correction, deletion, etc.
 */

import { getDb } from "../db";
import { popiaDataSubjectRequests, nrcsAffordabilityAssessment, complaints } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { sendBrandedEmail as sendEmail } from "./emailService";

export const popiaService = {
  async createRequest(data: {
    dealershipId: number;
    requestType: "access" | "correction" | "deletion" | "objection" | "restrict" | "portability";
    requesterName: string;
    requesterEmail: string;
    requesterPhone?: string;
    requesterIdNumber?: string;
    dataSubjectDescription?: string;
    reason?: string;
  }) {
    const completionDeadline = new Date();
    completionDeadline.setDate(completionDeadline.getDate() + 30);
    const result = { id: Math.floor(Math.random() * 10000), status: "received" };
    try {
      await sendEmail({
        to: data.requesterEmail,
        subject: "Data Subject Request Received",
        htmlContent: "Your data subject request has been received and will be processed within 30 days.",
      });
    } catch (e) {
      console.error("Failed to send email:", e);
    }
    return result;
  },

  async acknowledgeRequest(requestId: number, processedBy: number) {
    return {
      status: "acknowledged",
      acknowledgedDate: new Date(),
      processedBy,
    };
  },

  async approveRequest(
    requestId: number,
    responseNotes: string,
    responseDocument?: string,
    verifiedBy?: number
  ) {
    return {
      status: "completed",
      completedDate: new Date(),
      responseNotes,
      responseDocument,
      verifiedBy,
    };
  },

  async denyRequest(requestId: number, denialReason: string, processedBy: number) {
    return {
      status: "denied",
      denialReason,
      processedBy,
    };
  },

  async getPendingRequests(dealershipId: number) {
    return [];
  },

  async getOverdueRequests(dealershipId: number) {
    return [];
  },
};

export const nrcsService = {
  async createAssessment(data: {
    leadId: number;
    dealershipId: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    existingDebtObligations: number;
    creditScore?: number;
    creditHistory?: string;
    proposedLoanAmount: number;
    proposedInterestRate: number;
    proposedLoanTerm: number;
    proposedMonthlyPayment: number;
    assessedBy: number;
  }) {
    const disposableIncome = data.monthlyIncome - data.monthlyExpenses - data.existingDebtObligations;
    const debtToIncomeRatio = (data.existingDebtObligations + data.proposedMonthlyPayment) / data.monthlyIncome;
    const loanPaymentToIncomeRatio = data.proposedMonthlyPayment / data.monthlyIncome;

    let affordabilityScore = 100;
    if (debtToIncomeRatio > 0.5) {
      affordabilityScore -= (debtToIncomeRatio - 0.5) * 100;
    }
    if (disposableIncome < data.proposedMonthlyPayment * 2) {
      affordabilityScore -= 20;
    }
    if (data.creditScore) {
      if (data.creditScore < 600) affordabilityScore -= 30;
      else if (data.creditScore < 700) affordabilityScore -= 15;
    }

    affordabilityScore = Math.max(0, Math.min(100, affordabilityScore));
    const isAffordable = affordabilityScore > 50 && debtToIncomeRatio < 0.6 ? 1 : 0;

    let riskLevel: "low" | "medium" | "high" | "very_high" = "low";
    if (affordabilityScore < 30) riskLevel = "very_high";
    else if (affordabilityScore < 50) riskLevel = "high";
    else if (affordabilityScore < 70) riskLevel = "medium";

    const recommendedLoanAmount = (data.monthlyIncome * 0.5) / (data.proposedInterestRate / 100 / 12);

    return {
      id: Math.floor(Math.random() * 10000),
      status: "pending",
      affordabilityScore,
      isAffordable,
      riskLevel,
      recommendedLoanAmount,
    };
  },

  async reviewAssessment(assessmentId: number, reviewedBy: number) {
    return { id: assessmentId, reviewedBy, reviewDate: new Date() };
  },

  async getHighRiskAssessments(dealershipId: number) {
    return [];
  },

  async getUnreviewedAssessments(dealershipId: number) {
    return [];
  },
};

export const complaintService = {
  async createComplaint(data: {
    dealershipId: number;
    complaintType:
      | "service_quality"
      | "pricing"
      | "warranty"
      | "financing"
      | "vehicle_condition"
      | "delivery"
      | "communication"
      | "staff_conduct"
      | "safety"
      | "other";
    complainantName: string;
    complainantEmail: string;
    complainantPhone: string;
    complainantIdNumber?: string;
    vehicleId?: number;
    invoiceId?: number;
    description: string;
    attachmentUrl?: string;
    severity: "low" | "medium" | "high" | "critical";
    priority: "low" | "medium" | "high" | "urgent";
  }) {
    const complaintNumber = `COMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const resolutionDeadline = new Date();
    resolutionDeadline.setDate(resolutionDeadline.getDate() + 30);

    try {
      await sendEmail({
        to: data.complainantEmail,
        subject: `Complaint Received - ${complaintNumber}`,
        htmlContent: `Your complaint has been received and assigned number ${complaintNumber}. We will respond within 30 days.`,
      });
    } catch (e) {
      console.error("Failed to send email:", e);
    }

    return {
      id: Math.floor(Math.random() * 10000),
      complaintNumber,
      status: "received",
      resolutionDeadline,
    };
  },

  async acknowledgeComplaint(complaintId: number) {
    return { id: complaintId, status: "acknowledged", acknowledgedDate: new Date() };
  },

  async updateStatus(
    complaintId: number,
    status: "received" | "acknowledged" | "under_investigation" | "proposed_resolution" | "resolved" | "escalated" | "closed"
  ) {
    return { id: complaintId, status };
  },

  async resolveComplaint(
    complaintId: number,
    actualResolution: string,
    compensationOffered?: number,
    compensationPaid?: boolean
  ) {
    return {
      id: complaintId,
      status: "resolved",
      resolvedDate: new Date(),
      actualResolution,
      compensationOffered,
      compensationPaid: compensationPaid ? 1 : 0,
    };
  },

  async escalateComplaint(complaintId: number, escalatedTo: number, reason: string) {
    return {
      id: complaintId,
      status: "escalated",
      escalatedTo,
      escalationReason: reason,
      escalationDate: new Date(),
    };
  },

  async getUnresolvedComplaints(dealershipId: number) {
    return [];
  },

  async getOverdueComplaints(dealershipId: number) {
    return [];
  },

  async getHighPriorityComplaints(dealershipId: number) {
    return [];
  },

  async getCriticalComplaints(dealershipId: number) {
    return [];
  },

  async reportToNrcs(complaintId: number, regulatoryReferenceNumber: string) {
    return { id: complaintId, reportedToNrcs: 1, regulatoryReferenceNumber };
  },

  async getComplaintStats(dealershipId: number, startDate: Date, endDate: Date): Promise<any> {
    return {
      total: 0,
      byType: {},
      bySeverity: {},
      byStatus: {},
      avgResolutionTime: 0,
      escalationRate: 0,
    };
  },
};
