/**
 * Tax Reconciliation Router
 * 
 * ADMIN/OWNER ONLY - Not accessible to dealerships
 * 
 * Handles all tax-related operations:
 * - Monthly tax summary generation
 * - Expense tracking
 * - Home office deduction calculation
 * - Vehicle expense management
 * - SARS compliance deadline tracking
 * - Tax savings analysis
 * - Annual tax reports
 */

import { z } from "zod";
import { founderProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  generateMonthlyTaxSummary,
  getSarsComplianceDeadlines,
  calculateHomeOfficeDeduction,
  calculateVehicleDeduction,
  formatSAR,
  getMonthName,
  type HomeOfficeDeduction,
  type VehicleExpenses,
  type BusinessExpense,
} from "../_core/saTaxReconciliation";

// Zod schemas for validation
const HomeOfficeSchema = z.object({
  officeAreaM2: z.number().min(1),
  totalHomeAreaM2: z.number().min(1),
  monthlyRent: z.number().optional(),
  monthlyElectricity: z.number().min(0),
  monthlyWater: z.number().min(0),
  monthlyInternet: z.number().min(0),
  monthlyInsurance: z.number().min(0),
  monthlyMaintenance: z.number().min(0),
  monthlyRatesAndTaxes: z.number().min(0),
});

const VehicleExpensesSchema = z.object({
  vehicleId: z.string().min(1),
  registrationNumber: z.string().min(1),
  businessKmPercentage: z.number().min(0).max(100),
  monthlyFuel: z.number().min(0),
  monthlyMaintenance: z.number().min(0),
  monthlyInsurance: z.number().min(0),
  monthlyDepreciation: z.number().min(0),
  registrationFee: z.number().min(0),
  breakdownCover: z.number().min(0),
});

const ExpenseSchema = z.object({
  category: z.enum([
    "computer_technology",
    "vehicle_expenses",
    "electricity_utilities",
    "home_office",
    "professional_development",
    "office_communication",
    "business_services",
    "furniture_equipment",
    "advertising_marketing",
    "travel_expenses",
    "meals_entertainment",
    "other_deductions",
  ]),
  description: z.string().min(1),
  amount: z.number().min(0),
  date: z.date(),
  receipt: z.string().url(),
  notes: z.string().optional(),
});

export const taxReconciliationRouter = router({
  /**
   * Generate monthly tax summary with all deductions
   */
  generateMonthlySummary: founderProcedure
    .input(
      z.object({
        month: z.number().min(0).max(11),
        year: z.number().min(2024),
        totalIncome: z.number().min(0),
        homeOffice: HomeOfficeSchema,
        vehicles: z.array(VehicleExpensesSchema),
        expenses: z.array(ExpenseSchema),
        employees: z.array(z.object({ salary: z.number().min(0) })),
      })
    )
    .query(async ({ input }) => {
      try {
        const summary = generateMonthlyTaxSummary(
          input.month,
          input.year,
          input.totalIncome,
          input.expenses as BusinessExpense[],
          input.homeOffice as HomeOfficeDeduction,
          input.vehicles as VehicleExpenses[],
          input.employees
        );

        return {
          ...summary,
          monthName: getMonthName(input.month),
          formattedTaxableIncome: formatSAR(summary.taxableIncome),
          formattedTaxSavings: formatSAR(summary.taxSavings),
          formattedTotalDeductions: formatSAR(summary.totalDeductions),
        };
      } catch (error) {
        console.error("Error generating monthly tax summary:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate monthly tax summary",
        });
      }
    }),

  /**
   * Calculate home office deduction
   */
  calculateHomeOfficeDeduction: founderProcedure
    .input(HomeOfficeSchema)
    .query(async ({ input }) => {
      try {
        const deduction = calculateHomeOfficeDeduction(input as HomeOfficeDeduction);
        const areaPercentage = (input.officeAreaM2 / input.totalHomeAreaM2) * 100;

        return {
          monthlyDeduction: deduction,
          formattedDeduction: formatSAR(deduction),
          areaPercentage: areaPercentage.toFixed(1),
          annualDeduction: deduction * 12,
          formattedAnnualDeduction: formatSAR(deduction * 12),
          breakdown: {
            rent: input.monthlyRent ? (input.monthlyRent * (input.officeAreaM2 / input.totalHomeAreaM2)) : 0,
            electricity: input.monthlyElectricity * (input.officeAreaM2 / input.totalHomeAreaM2),
            water: input.monthlyWater * (input.officeAreaM2 / input.totalHomeAreaM2),
            internet: input.monthlyInternet, // 100% deductible
            insurance: input.monthlyInsurance * (input.officeAreaM2 / input.totalHomeAreaM2),
            maintenance: input.monthlyMaintenance * (input.officeAreaM2 / input.totalHomeAreaM2),
            ratesAndTaxes: input.monthlyRatesAndTaxes * (input.officeAreaM2 / input.totalHomeAreaM2),
          },
        };
      } catch (error) {
        console.error("Error calculating home office deduction:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to calculate home office deduction",
        });
      }
    }),

  /**
   * Calculate vehicle expense deduction
   */
  calculateVehicleDeduction: founderProcedure
    .input(VehicleExpensesSchema)
    .query(async ({ input }) => {
      try {
        const deduction = calculateVehicleDeduction(input as VehicleExpenses);

        return {
          monthlyDeduction: deduction,
          formattedDeduction: formatSAR(deduction),
          businessPercentage: input.businessKmPercentage,
          annualDeduction: deduction * 12,
          formattedAnnualDeduction: formatSAR(deduction * 12),
          breakdown: {
            fuel: (input.monthlyFuel * input.businessKmPercentage) / 100,
            maintenance: (input.monthlyMaintenance * input.businessKmPercentage) / 100,
            insurance: (input.monthlyInsurance * input.businessKmPercentage) / 100,
            depreciation: (input.monthlyDepreciation * input.businessKmPercentage) / 100,
            registration: (input.registrationFee / 12 * input.businessKmPercentage) / 100,
            breakdownCover: (input.breakdownCover * input.businessKmPercentage) / 100,
          },
        };
      } catch (error) {
        console.error("Error calculating vehicle deduction:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to calculate vehicle deduction",
        });
      }
    }),

  /**
   * Get SARS compliance deadlines for the year
   */
  getSarsDeadlines: founderProcedure
    .input(z.object({ year: z.number().min(2024) }))
    .query(async ({ input }) => {
      try {
        const deadlines = getSarsComplianceDeadlines(input.year);

        // Group by type
        const grouped = {
          payePayments: deadlines.filter((d) => d.checkType === "paye_payment"),
          emp201Filings: deadlines.filter((d) => d.checkType === "emp201_filing"),
          itr12Filing: deadlines.filter((d) => d.checkType === "itr12_filing"),
          provisionalTax: deadlines.filter((d) => d.checkType === "provisional_tax"),
        };

        return {
          allDeadlines: deadlines,
          grouped,
          totalDeadlines: deadlines.length,
        };
      } catch (error) {
        console.error("Error getting SARS deadlines:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get SARS deadlines",
        });
      }
    }),

  /**
   * Add business expense
   */
  addExpense: founderProcedure
    .input(ExpenseSchema.extend({ id: z.string().optional() }))
    .mutation(async ({ input }) => {
      try {
        const expenseId = input.id || `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        return {
          id: expenseId,
          ...input,
          createdAt: new Date(),
          status: "pending_review",
        };
      } catch (error) {
        console.error("Error adding expense:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add expense",
        });
      }
    }),

  /**
   * Get tax savings analysis
   */
  getTaxSavingsAnalysis: founderProcedure
    .input(
      z.object({
        month: z.number().min(0).max(11),
        year: z.number().min(2024),
        totalIncome: z.number().min(0),
        totalDeductions: z.number().min(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const taxWithoutDeductions = input.totalIncome * 0.28;
        const taxableIncome = Math.max(0, input.totalIncome - input.totalDeductions);
        const taxWithDeductions = taxableIncome * 0.28;
        const monthlySavings = taxWithoutDeductions - taxWithDeductions;
        const annualSavings = monthlySavings * 12;

        return {
          grossIncome: input.totalIncome,
          formattedGrossIncome: formatSAR(input.totalIncome),
          totalDeductions: input.totalDeductions,
          formattedTotalDeductions: formatSAR(input.totalDeductions),
          taxableIncome,
          formattedTaxableIncome: formatSAR(taxableIncome),
          taxWithoutDeductions,
          formattedTaxWithoutDeductions: formatSAR(taxWithoutDeductions),
          taxWithDeductions,
          formattedTaxWithDeductions: formatSAR(taxWithDeductions),
          monthlySavings,
          formattedMonthlySavings: formatSAR(monthlySavings),
          annualSavings,
          formattedAnnualSavings: formatSAR(annualSavings),
          savingsPercentage: ((monthlySavings / taxWithoutDeductions) * 100).toFixed(1),
          deductionPercentage: ((input.totalDeductions / input.totalIncome) * 100).toFixed(1),
        };
      } catch (error) {
        console.error("Error calculating tax savings:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to calculate tax savings",
        });
      }
    }),

  /**
   * Generate annual tax report for ITR12 filing
   */
  generateAnnualReport: founderProcedure
    .input(
      z.object({
        year: z.number().min(2024),
        totalIncome: z.number().min(0),
        totalDeductions: z.number().min(0),
        totalPayroll: z.number().min(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const taxableIncome = Math.max(0, input.totalIncome - input.totalDeductions);
        const estimatedTax = taxableIncome * 0.28;

        return {
          year: input.year,
          totalIncome: input.totalIncome,
          formattedTotalIncome: formatSAR(input.totalIncome),
          totalDeductions: input.totalDeductions,
          formattedTotalDeductions: formatSAR(input.totalDeductions),
          taxableIncome,
          formattedTaxableIncome: formatSAR(taxableIncome),
          estimatedTax,
          formattedEstimatedTax: formatSAR(estimatedTax),
          itr12DueDate: new Date(input.year + 1, 4, 29), // 29 May
          reportGeneratedAt: new Date(),
          notes: "This is an estimate. Consult with a tax professional for accurate filing.",
        };
      } catch (error) {
        console.error("Error generating annual report:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate annual report",
        });
      }
    }),

  /**
   * Get compliance checklist for the year
   */
  getComplianceChecklist: founderProcedure
    .input(z.object({ year: z.number().min(2024) }))
    .query(async ({ input }) => {
      try {
        return {
          year: input.year,
          checklist: [
            {
              item: "Register for PAYE (if not already registered)",
              deadline: "Before first employee payment",
              status: "pending",
              importance: "critical",
            },
            {
              item: "Register for UIF (if not already registered)",
              deadline: "Before first employee payment",
              status: "pending",
              importance: "critical",
            },
            {
              item: "Register for Skills Development Levy (if payroll > R500k annually)",
              deadline: "Before first payment",
              status: "pending",
              importance: "high",
            },
            {
              item: "Pay monthly PAYE contributions",
              deadline: "7th of each month",
              status: "pending",
              importance: "critical",
            },
            {
              item: "File EMP201 quarterly reconciliation",
              deadline: "29 days after quarter end",
              status: "pending",
              importance: "high",
            },
            {
              item: "File ITR12 annual tax return",
              deadline: "29 May following year",
              status: "pending",
              importance: "critical",
            },
            {
              item: "Keep business expense receipts",
              deadline: "Ongoing",
              status: "pending",
              importance: "high",
            },
            {
              item: "Maintain vehicle logbook (for business km deduction)",
              deadline: "Ongoing",
              status: "pending",
              importance: "medium",
            },
            {
              item: "Document home office setup (photos, floor plan)",
              deadline: "Before claiming deduction",
              status: "pending",
              importance: "medium",
            },
          ],
        };
      } catch (error) {
        console.error("Error getting compliance checklist:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get compliance checklist",
        });
      }
    }),
});
