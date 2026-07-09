import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export const financingRouter = router({
  // Calculate monthly payment and amortization
  calculatePayment: protectedProcedure
    .input(z.object({
      loanAmount: z.number().positive(),
      downPayment: z.number().min(0),
      interestRate: z.number().positive(),
      loanTermMonths: z.number().positive().int(),
    }))
    .query(({ input }) => {
      const principal = input.loanAmount - input.downPayment;
      const monthlyRate = input.interestRate / 100 / 12;
      
      // Calculate monthly payment using formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
      const monthlyPayment =
        (principal * (monthlyRate * Math.pow(1 + monthlyRate, input.loanTermMonths))) /
        (Math.pow(1 + monthlyRate, input.loanTermMonths) - 1);

      const totalPayments = monthlyPayment * input.loanTermMonths;
      const totalInterest = totalPayments - principal;

      return {
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalPayments: Math.round(totalPayments * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        downPayment: input.downPayment,
        vehiclePrice: input.loanAmount,
      };
    }),

  // Generate full amortization schedule
  getAmortizationSchedule: protectedProcedure
    .input(z.object({
      loanAmount: z.number().positive(),
      downPayment: z.number().min(0),
      interestRate: z.number().positive(),
      loanTermMonths: z.number().positive().int(),
    }))
    .query(({ input }) => {
      const principal = input.loanAmount - input.downPayment;
      const monthlyRate = input.interestRate / 100 / 12;

      const monthlyPayment =
        (principal * (monthlyRate * Math.pow(1 + monthlyRate, input.loanTermMonths))) /
        (Math.pow(1 + monthlyRate, input.loanTermMonths) - 1);

      const schedule: AmortizationRow[] = [];
      let balance = principal;

      for (let month = 1; month <= input.loanTermMonths; month++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        balance -= principalPayment;

        // Handle rounding on last payment
        if (month === input.loanTermMonths) {
          balance = 0;
        }

        schedule.push({
          month,
          payment: Math.round(monthlyPayment * 100) / 100,
          principal: Math.round(principalPayment * 100) / 100,
          interest: Math.round(interestPayment * 100) / 100,
          balance: Math.round(Math.max(0, balance) * 100) / 100,
        });
      }

      const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);

      return {
        summary: {
          vehiclePrice: input.loanAmount,
          downPayment: input.downPayment,
          loanAmount: principal,
          interestRate: input.interestRate,
          loanTermMonths: input.loanTermMonths,
          monthlyPayment: Math.round(monthlyPayment * 100) / 100,
          totalPayments: Math.round(monthlyPayment * input.loanTermMonths * 100) / 100,
          totalInterest: Math.round(totalInterest * 100) / 100,
        },
        schedule,
      };
    }),

  // Compare different financing options
  compareOptions: protectedProcedure
    .input(z.object({
      vehiclePrice: z.number().positive(),
      downPayment: z.number().min(0),
      options: z.array(
        z.object({
          interestRate: z.number().positive(),
          loanTermMonths: z.number().positive().int(),
        })
      ),
    }))
    .query(({ input }) => {
      const principal = input.vehiclePrice - input.downPayment;

      const comparisons = input.options.map(option => {
        const monthlyRate = option.interestRate / 100 / 12;
        const monthlyPayment =
          (principal * (monthlyRate * Math.pow(1 + monthlyRate, option.loanTermMonths))) /
          (Math.pow(1 + monthlyRate, option.loanTermMonths) - 1);

        const totalPayments = monthlyPayment * option.loanTermMonths;
        const totalInterest = totalPayments - principal;

        return {
          interestRate: option.interestRate,
          loanTermMonths: option.loanTermMonths,
          monthlyPayment: Math.round(monthlyPayment * 100) / 100,
          totalPayments: Math.round(totalPayments * 100) / 100,
          totalInterest: Math.round(totalInterest * 100) / 100,
        };
      });

      return {
        vehiclePrice: input.vehiclePrice,
        downPayment: input.downPayment,
        loanAmount: principal,
        comparisons,
      };
    }),

  // Calculate affordability based on monthly budget
  calculateAffordability: protectedProcedure
    .input(z.object({
      monthlyBudget: z.number().positive(),
      interestRate: z.number().positive(),
      loanTermMonths: z.number().positive().int(),
      downPayment: z.number().min(0),
    }))
    .query(({ input }) => {
      const monthlyRate = input.interestRate / 100 / 12;

      // Calculate max loan amount: P = M * [(1+r)^n - 1] / [r(1+r)^n]
      const maxLoan =
        (input.monthlyBudget * (Math.pow(1 + monthlyRate, input.loanTermMonths) - 1)) /
        (monthlyRate * Math.pow(1 + monthlyRate, input.loanTermMonths));

      const maxVehiclePrice = maxLoan + input.downPayment;

      return {
        monthlyBudget: input.monthlyBudget,
        downPayment: input.downPayment,
        maxLoanAmount: Math.round(maxLoan * 100) / 100,
        maxVehiclePrice: Math.round(maxVehiclePrice * 100) / 100,
        interestRate: input.interestRate,
        loanTermMonths: input.loanTermMonths,
      };
    }),
});
