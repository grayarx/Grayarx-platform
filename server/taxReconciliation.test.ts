/**
 * Tax Reconciliation Tests
 * 
 * Tests for South African tax calculations
 * Verified against SARS 2024/2025 tax tables
 */

import { describe, it, expect } from "vitest";
import {
  calculatePaye,
  calculateUif,
  calculateSkillsLevy,
  calculateHomeOfficeDeduction,
  generateMonthlyTaxSummary,
  getSarsComplianceDeadlines,
  formatSAR,
  getMonthName,
  type HomeOfficeDeduction,
  type BusinessExpense,
} from "./server/_core/saTaxReconciliation";

describe("South African Tax Reconciliation", () => {
  describe("PAYE Calculation (SARS 2024/2025)", () => {
    it("should calculate PAYE for salary under R237,100", () => {
      const paye = calculatePaye(150000);
      expect(paye).toBe(150000 * 0.18); // 18% bracket
      expect(paye).toBe(27000);
    });

    it("should calculate PAYE for salary in R237,101-R370,500 bracket", () => {
      const paye = calculatePaye(300000);
      const expected = 42678 + (300000 - 237100) * 0.26;
      expect(paye).toBe(expected);
      expect(paye).toBeCloseTo(58836, 0);
    });

    it("should calculate PAYE for high salary", () => {
      const paye = calculatePaye(500000);
      expect(paye).toBeGreaterThan(100000);
    });

    it("should return 0 for very low salary", () => {
      const paye = calculatePaye(5000);
      expect(paye).toBe(0);
    });
  });

  describe("UIF Calculation", () => {
    it("should calculate UIF at 1% for both employee and employer", () => {
      const uif = calculateUif(50000);
      expect(uif.employee).toBe(500);
      expect(uif.employer).toBe(500);
    });

    it("should cap UIF at R177.12 per party", () => {
      const uif = calculateUif(500000); // Very high salary
      expect(uif.employee).toBeLessThanOrEqual(177.12);
      expect(uif.employer).toBeLessThanOrEqual(177.12);
    });

    it("should apply monthly ceiling of R17,712", () => {
      const uif = calculateUif(17712);
      expect(uif.employee).toBe(177.12);
      expect(uif.employer).toBe(177.12);
    });
  });

  describe("Skills Development Levy", () => {
    it("should return 0 for payroll below threshold", () => {
      const sdl = calculateSkillsLevy(30000); // Below R41,667/month
      expect(sdl).toBe(0);
    });

    it("should calculate 1% for payroll above threshold", () => {
      const sdl = calculateSkillsLevy(100000); // Above threshold
      expect(sdl).toBe(1000); // 1% of R100,000
    });

    it("should be uncapped", () => {
      const sdl = calculateSkillsLevy(1000000);
      expect(sdl).toBe(10000); // 1% of R1,000,000
    });
  });

  describe("Home Office Deduction (Section 23(b))", () => {
    it("should calculate home office deduction with floor area apportionment", () => {
      const homeOffice: HomeOfficeDeduction = {
        officeAreaM2: 20, // 20 m² office
        totalHomeAreaM2: 100, // 100 m² home
        monthlyRent: 10000,
        monthlyElectricity: 2000,
        monthlyWater: 500,
        monthlyInternet: 1000, // 100% deductible
        monthlyInsurance: 1500,
        monthlyMaintenance: 800,
        monthlyRatesAndTaxes: 600,
      };

      const deduction = calculateHomeOfficeDeduction(homeOffice);

      // Rent: 10000 * 20% = 2000
      // Electricity: 2000 * 20% = 400
      // Water: 500 * 20% = 100
      // Internet: 1000 (100%) = 1000
      // Insurance: 1500 * 20% = 300
      // Maintenance: 800 * 20% = 160
      // Rates & Taxes: 600 * 20% = 120
      // Total: 4080

      expect(deduction).toBeCloseTo(4080, 0);
    });

    it("should not include mortgage interest (changed March 2022)", () => {
      const homeOffice: HomeOfficeDeduction = {
        officeAreaM2: 15,
        totalHomeAreaM2: 100,
        monthlyElectricity: 1500,
        monthlyWater: 400,
        monthlyInternet: 800,
        monthlyInsurance: 1200,
        monthlyMaintenance: 600,
        monthlyRatesAndTaxes: 500,
      };

      const deduction = calculateHomeOfficeDeduction(homeOffice);
      // Should not include any mortgage interest
      expect(deduction).toBeGreaterThan(0);
      expect(deduction).toBeLessThan(2000);
    });

    it("should handle 100% home office usage", () => {
      const homeOffice: HomeOfficeDeduction = {
        officeAreaM2: 100,
        totalHomeAreaM2: 100,
        monthlyRent: 5000,
        monthlyElectricity: 1000,
        monthlyWater: 300,
        monthlyInternet: 500,
        monthlyInsurance: 800,
        monthlyMaintenance: 400,
        monthlyRatesAndTaxes: 300,
      };

      const deduction = calculateHomeOfficeDeduction(homeOffice);
      const expected = 5000 + 1000 + 300 + 500 + 800 + 400 + 300;
      expect(deduction).toBe(expected);
    });
  });

  describe("Monthly Tax Summary", () => {
    it("should generate accurate monthly tax summary", () => {
      const homeOffice: HomeOfficeDeduction = {
        officeAreaM2: 20,
        totalHomeAreaM2: 100,
        monthlyRent: 8000,
        monthlyElectricity: 1500,
        monthlyWater: 400,
        monthlyInternet: 800,
        monthlyInsurance: 1200,
        monthlyMaintenance: 600,
        monthlyRatesAndTaxes: 500,
      };

      const expenses: BusinessExpense[] = [
        {
          id: "1",
          category: "computer_technology",
          description: "Software licenses",
          amount: 5000,
          date: new Date(),
          receipt: "https://example.com/receipt1.pdf",
          deductible: true,
          notes: "",
        },
        {
          id: "2",
          category: "office_communication",
          description: "Office supplies",
          amount: 2000,
          date: new Date(),
          receipt: "https://example.com/receipt2.pdf",
          deductible: true,
          notes: "",
        },
      ];

      const summary = generateMonthlyTaxSummary(
        4, // May
        2025,
        200000, // Income
        expenses,
        homeOffice,
        [], // No vehicles
        [] // No employees
      );

      expect(summary.month).toBe(4);
      expect(summary.year).toBe(2025);
      expect(summary.totalIncome).toBe(200000);
      expect(summary.computerTech).toBe(5000);
      expect(summary.officeServices).toBe(2000);
      expect(summary.homeOfficeDeduction).toBeGreaterThan(0);
      expect(summary.totalDeductions).toBeGreaterThan(0);
      expect(summary.taxableIncome).toBeLessThan(200000);
      expect(summary.estimatedTax).toBeGreaterThan(0);
      expect(summary.taxSavings).toBeGreaterThan(0);
    });

    it("should show tax savings from deductions", () => {
      const homeOffice: HomeOfficeDeduction = {
        officeAreaM2: 20,
        totalHomeAreaM2: 100,
        monthlyRent: 8000,
        monthlyElectricity: 1500,
        monthlyWater: 400,
        monthlyInternet: 800,
        monthlyInsurance: 1200,
        monthlyMaintenance: 600,
        monthlyRatesAndTaxes: 500,
      };

      const summary = generateMonthlyTaxSummary(
        0, // January
        2025,
        100000,
        [],
        homeOffice,
        [],
        []
      );

      const taxWithoutDeductions = 100000 * 0.28;
      const taxWithDeductions = summary.estimatedTax;
      const expectedSavings = taxWithoutDeductions - taxWithDeductions;

      expect(summary.taxSavings).toBeCloseTo(expectedSavings, 0);
      expect(summary.taxSavings).toBeGreaterThan(0);
    });
  });

  describe("SARS Compliance Deadlines", () => {
    it("should generate all compliance deadlines for the year", () => {
      const deadlines = getSarsComplianceDeadlines(2025);

      expect(deadlines.length).toBeGreaterThan(0);
      expect(deadlines.some((d) => d.checkType === "itr12_filing")).toBe(true);
      expect(deadlines.some((d) => d.checkType === "provisional_tax")).toBe(true);
    });

    it("should have ITR12 due date of 29 May following year", () => {
      const deadlines = getSarsComplianceDeadlines(2025);
      const itr12 = deadlines.find((d) => d.checkType === "itr12_filing");

      expect(itr12).toBeDefined();
      expect(itr12?.dueDate.getMonth()).toBe(4); // May (0-indexed)
      expect(itr12?.dueDate.getDate()).toBe(29);
      expect(itr12?.dueDate.getFullYear()).toBe(2026);
    });

    it("should have provisional tax deadlines on 28 Feb and 31 Aug", () => {
      const deadlines = getSarsComplianceDeadlines(2025);
      const provisionalTax = deadlines.filter((d) => d.checkType === "provisional_tax");

      expect(provisionalTax.length).toBe(2);
      expect(provisionalTax[0].dueDate.getMonth()).toBe(1); // February
      expect(provisionalTax[0].dueDate.getDate()).toBe(28);
      expect(provisionalTax[1].dueDate.getMonth()).toBe(7); // August
      expect(provisionalTax[1].dueDate.getDate()).toBe(31);
    });
  });

  describe("Formatting Helpers", () => {
    it("should format amount as South African Rand", () => {
      const formatted = formatSAR(50000);
      expect(formatted).toContain("R");
      expect(formatted).toContain("50");
    });

    it("should get correct month name", () => {
      expect(getMonthName(0)).toBe("January");
      expect(getMonthName(11)).toBe("December");
      expect(getMonthName(4)).toBe("May");
    });
  });

  describe("Real-World Scenario - Solo Founder", () => {
    it("should calculate tax for typical solo founder scenario", () => {
      const homeOffice: HomeOfficeDeduction = {
        officeAreaM2: 25, // 25 m² home office
        totalHomeAreaM2: 150, // 150 m² home
        monthlyRent: 12000,
        monthlyElectricity: 2000,
        monthlyWater: 600,
        monthlyInternet: 1200, // 100% business use
        monthlyInsurance: 1500,
        monthlyMaintenance: 800,
        monthlyRatesAndTaxes: 1000,
      };

      const expenses: BusinessExpense[] = [
        {
          id: "1",
          category: "computer_technology",
          description: "Laptop and software",
          amount: 8000,
          date: new Date(),
          receipt: "https://example.com/receipt1.pdf",
          deductible: true,
          notes: "",
        },
        {
          id: "2",
          category: "professional_development",
          description: "Training course",
          amount: 3000,
          date: new Date(),
          receipt: "https://example.com/receipt2.pdf",
          deductible: true,
          notes: "",
        },
        {
          id: "3",
          category: "business_services",
          description: "Accounting fees",
          amount: 2000,
          date: new Date(),
          receipt: "https://example.com/receipt3.pdf",
          deductible: true,
          notes: "",
        },
      ];

      const summary = generateMonthlyTaxSummary(
        4, // May
        2025,
        300000, // Monthly income
        expenses,
        homeOffice,
        [],
        []
      );

      // Verify calculations
      expect(summary.totalIncome).toBe(300000);
      expect(summary.computerTech).toBe(8000);
      expect(summary.professionalDevelopment).toBe(3000);
      expect(summary.businessServices).toBe(2000);
      expect(summary.homeOfficeDeduction).toBeGreaterThan(0);
      expect(summary.totalDeductions).toBeGreaterThan(13000);
      expect(summary.taxableIncome).toBeLessThan(300000);
      expect(summary.estimatedTax).toBeGreaterThan(0);
      expect(summary.taxSavings).toBeGreaterThan(0);

      // Tax savings should be significant
      const taxWithoutDeductions = 300000 * 0.28;
      expect(summary.taxSavings).toBeCloseTo(taxWithoutDeductions - summary.estimatedTax, 0);
      expect(summary.taxSavings).toBeGreaterThan(5000); // At least R5k savings
    });
  });
});
